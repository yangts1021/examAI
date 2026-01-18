import { db, ImageAsset } from './db';
import { getGasUrl } from './gasService';
import { Question } from '../types';

const fetchGas = async (url: string) => {
    const res = await fetch(url);
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        // Check for common GAS errors
        if (text.includes("Google Drive") || text.includes("permission") || text.includes("權限") || text.includes("script.google.com")) {
            throw new Error("權限錯誤：GAS 無法存取 Google Drive，或連線被 Google 阻擋。請檢查 GAS 部署設定。");
        }
        throw new Error(`GAS 回傳了非 JSON 格式 (HTML)。可能是權限不足或程式錯誤。`);
    }
    return res.json();
};

export const offlineService = {
    // Upload pending offline results to GAS
    uploadPendingResults: async (onProgress?: (msg: string) => void) => {
        const pending = await db.history.filter(h => h.synced === false && !!h.submissionData).toArray();
        if (pending.length === 0) return;

        if (onProgress) onProgress(`正在上傳 ${pending.length} 筆離線測驗紀錄...`);
        const url = getGasUrl();
        if (!url) return;

        for (const record of pending) {
            try {
                // Use the standard saveResult endpoint
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        action: 'saveResult',
                        data: record.submissionData
                    })
                });

                // Mark as synced
                await db.history.update(record.id!, { synced: true });
            } catch (e) {
                console.error("Failed to upload offline result", e);
                // Continue to next record, don't block
            }
        }
    },

    // Sync all data from GAS to Local IndexedDB
    syncData: async (onProgress?: (msg: string) => void) => {
        try {
            const url = getGasUrl();
            if (!url) throw new Error("GAS URL not configured");

            // 0. Upload Pending Results First
            await offlineService.uploadPendingResults(onProgress);

            // 1. Fetch Subjects
            if (onProgress) onProgress("正在讀取科目列表...");
            const subjectsUrl = `${url}?action=getSubjects`;
            const subjectsJson = await fetchGas(subjectsUrl);

            if (subjectsJson.status !== 'success' || !Array.isArray(subjectsJson.subjects)) {
                throw new Error("Failed to fetch subjects: " + JSON.stringify(subjectsJson));
            }
            const subjects = subjectsJson.subjects as string[];

            let allQuestions: Question[] = [];

            // 2. Iterate Subjects -> Scopes -> Questions
            for (const subject of subjects) {
                if (onProgress) onProgress(`正在讀取科目 [${subject}] 的範圍...`);

                // Fetch Scopes for this Subject
                const scopesUrl = `${url}?action=getScopes&subject=${encodeURIComponent(subject)}`;
                const scopesJson = await fetchGas(scopesUrl);

                if (scopesJson.status !== 'success' || !Array.isArray(scopesJson.scopes)) {
                    console.warn(`Skipping subject ${subject}: Failed to fetch scopes`, scopesJson);
                    continue;
                }
                const scopes = scopesJson.scopes as string[];

                for (const scope of scopes) {
                    if (onProgress) onProgress(`下載中: ${subject} - ${scope}...`);

                    const qUrl = `${url}?action=getQuestions&subject=${encodeURIComponent(subject)}&scope=${encodeURIComponent(scope)}`;
                    const qJson = await fetchGas(qUrl);

                    if (qJson.status === 'success' && Array.isArray(qJson.questions)) {
                        // Enrich with subject & scope to ensure we can query locally later
                        const qs = qJson.questions.map((q: any) => ({
                            ...q,
                            subject,
                            scope,
                            // Ensure options is string[] if backend sends optionA/B...
                            options: q.options || [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean)
                        }));
                        allQuestions.push(...qs);
                    } else {
                        console.warn(`No questions or error for ${subject}-${scope}`, qJson);
                    }
                }
            }

            if (allQuestions.length === 0) {
                throw new Error("沒有找到任何題目。請確認 GAS 部署權限是否為「所有人」。");
            }

            if (onProgress) onProgress(`共找到 ${allQuestions.length} 題，開始儲存...`);

            // 3. Save Questions to DB
            await db.transaction('rw', db.questions, async () => {
                await db.questions.clear();
                await db.questions.bulkAdd(allQuestions);
            });

            // 4. Fetch History
            if (onProgress) onProgress("正在下載歷史紀錄...");
            const historyUrl = `${url}?action=getHistory`;
            try {
                const histRes = await fetch(historyUrl);
                const histJson = await histRes.json();

                if (histJson.status === 'success' && Array.isArray(histJson.history)) {
                    const historyRecords = histJson.history.map((h: any) => {
                        // Parse score string "5 / 10" or "80"
                        let score = 0;
                        let total = 0;
                        if (typeof h.score === 'string' && h.score.includes('/')) {
                            const parts = h.score.split('/');
                            score = parseInt(parts[0].trim()) || 0;
                            total = parseInt(parts[1].trim()) || 0;
                        } else {
                            score = parseInt(h.score) || 0;
                            total = h.results?.length || 0; // Fallback
                        }

                        return {
                            date: h.timestamp,
                            score,
                            totalQuestions: total,
                            subject: h.subject,
                            scope: h.scope,
                            mistakes: total - score,
                            timestamp: new Date(h.timestamp).getTime() || Date.now()
                        };
                    });

                    await db.transaction('rw', db.history, async () => {
                        // Identify unsynced items
                        const unsynced = await db.history.filter(h => h.synced === false).toArray();

                        await db.history.clear();
                        await db.history.bulkAdd([...historyRecords, ...unsynced]);
                    });
                }
            } catch (e) {
                console.warn("Failed to sync history", e);
            }

            // 5. Process Images
            if (onProgress) onProgress("正在分析並下載圖片...");
            const imageUrls = new Set<string>();

            // Extract URLs from question text/options
            allQuestions.forEach(q => {
                if (q.diagramUrl && q.diagramUrl.startsWith('http')) imageUrls.add(q.diagramUrl);

                const mdRegex = /!\[.*?\]\((.*?)\)/g;
                let match;
                while ((match = mdRegex.exec(q.text)) !== null) {
                    imageUrls.add(match[1]);
                }

                const optionFields = [q.optionA, q.optionB, q.optionC, q.optionD];
                optionFields.forEach(opt => {
                    if (opt) {
                        mdRegex.lastIndex = 0;
                        while ((match = mdRegex.exec(opt)) !== null) imageUrls.add(match[1]);
                    }
                });

                if (q.options) {
                    q.options.forEach(opt => {
                        mdRegex.lastIndex = 0;
                        while ((match = mdRegex.exec(opt)) !== null) imageUrls.add(match[1]);
                    });
                }
            });

            const urls = Array.from(imageUrls);
            let downloaded = 0;

            for (const imgUrl of urls) {
                downloaded++;
                const existing = await db.images.get(imgUrl);
                if (existing) continue;

                if (onProgress) onProgress(`正在下載圖片 (${downloaded}/${urls.length})...`);

                try {
                    const response = await fetch(imgUrl);
                    const blob = await response.blob();

                    await db.images.put({
                        id: imgUrl,
                        blob: blob,
                        mimeType: blob.type,
                        timestamp: Date.now()
                    });
                } catch (e) {
                    console.error(`Failed to download image: ${imgUrl}`, e);
                }
            }

            if (onProgress) onProgress("同步完成！");
            return true;

        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Get blob URL for an image
    getImageUrl: async (url: string): Promise<string | null> => {
        const asset = await db.images.get(url);
        if (asset) {
            return URL.createObjectURL(asset.blob);
        }
        return null;
    },

    // offline fetch
    getQuestions: async (subject: string, scope?: string) => {
        let collection = db.questions.where('subject').equals(subject);
        const questions = await collection.toArray();
        if (scope) {
            return questions.filter(q => q.scope === scope);
        }
        return questions;
    },

    saveOfflineResult: async (submission: any, score: number, total: number) => {
        await db.history.add({
            date: new Date().toISOString(),
            score,
            totalQuestions: total,
            subject: submission.subject || 'Unknown',
            scope: submission.scope || 'Unknown',
            mistakes: total - score,
            timestamp: Date.now(),
            submissionData: submission,
            synced: false
        });
    },

    getSubjects: async () => {
        const questions = await db.questions.toArray();
        const subjects = Array.from(new Set(questions.map(q => q.subject)));
        return subjects;
    },

    getScopes: async (subject: string) => {
        const questions = await db.questions.where('subject').equals(subject).toArray();
        const scopes = Array.from(new Set(questions.map(q => q.scope)));
        return scopes;
    },

    // Special Feature: Cross-Subject Quiz (e.g., Lee Tian-Hao)
    getCrossSubjectQuestions: async (keyword: string): Promise<Question[]> => {
        // 1. Find all subjects containing the keyword
        const questions = await db.questions.toArray();
        const subjects = Array.from(new Set(questions.map(q => q.subject))).filter(s => s.includes(keyword));

        if (subjects.length === 0) return [];

        // 2. Fetch all questions for these subjects
        // Dexie doesn't have an 'in' operator for efficient querying in this simplified setup, 
        // but Since we already loaded all questions to find subjects (inefficient but safe for now), 
        // we can just filter the already loaded array.
        // Optimization for later: query DB by subject index.

        return questions.filter(q => subjects.includes(q.subject));
    }
};
