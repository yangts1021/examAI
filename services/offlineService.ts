import { db, ImageAsset } from './db';
import { getGasUrl } from './gasService';
import { Question } from '../types';

export const offlineService = {
    // Sync all data from GAS to Local IndexedDB
    syncData: async (onProgress?: (msg: string) => void) => {
        try {
            const url = getGasUrl();
            if (!url) throw new Error("GAS URL not configured");

            // 1. Fetch Subjects
            if (onProgress) onProgress("正在讀取科目列表...");
            const subjectsUrl = `${url}?action=getSubjects`;
            const subjectsRes = await fetch(subjectsUrl);

            if (!subjectsRes.ok) throw new Error(`GAS Network Error: ${subjectsRes.status}`);
            const subjectsJson = await subjectsRes.json();

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
                const scopesRes = await fetch(scopesUrl);
                const scopesJson = await scopesRes.json();

                if (scopesJson.status !== 'success' || !Array.isArray(scopesJson.scopes)) {
                    console.warn(`Skipping subject ${subject}: Failed to fetch scopes`, scopesJson);
                    continue;
                }
                const scopes = scopesJson.scopes as string[];

                for (const scope of scopes) {
                    if (onProgress) onProgress(`下載中: ${subject} - ${scope}...`);

                    const qUrl = `${url}?action=getQuestions&subject=${encodeURIComponent(subject)}&scope=${encodeURIComponent(scope)}`;
                    const qRes = await fetch(qUrl);
                    const qJson = await qRes.json();

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

            // 3. Process Images
            if (onProgress) onProgress("正在分析並下載圖片...");
            const imageUrls = new Set<string>();

            // Extract URLs from question text/options (simple regex or field check)
            // Assuming images might be in 'question' text or specifically in 'image' field if it existed.
            // Based on prior context, images are likely embedded or just links.
            // But user mentioned "Question bank has many images".
            // Let's assume there is an image field or we parse markdown/html for <img> tags.

            // If the Question type has an 'image' field:
            allQuestions.forEach(q => {
                // Check for explicit image field if it exists
                if (q.diagramUrl && q.diagramUrl.startsWith('http')) imageUrls.add(q.diagramUrl);

                // Check for markdown images in text: ![alt](url)
                const mdRegex = /!\[.*?\]\((.*?)\)/g;
                let match;
                while ((match = mdRegex.exec(q.text)) !== null) {
                    imageUrls.add(match[1]);
                }

                // Check explicit option fields
                const optionFields = [q.optionA, q.optionB, q.optionC, q.optionD];
                optionFields.forEach(opt => {
                    if (opt) {
                        // reset regex lastIndex for new string
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
                // Skip if already exists? Or force update?
                // Let's check existence to save bandwidth
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

        // Dexie doesn't support multi-field index queries easily without composite index.
        // We filter in memory for scope if needed.
        const questions = await collection.toArray();

        if (scope) {
            return questions.filter(q => q.scope === scope);
        }
        return questions;
    },

    getSubjects: async () => {
        const questions = await db.questions.toArray();
        // Unique subjects
        const subjects = Array.from(new Set(questions.map(q => q.subject)));
        return subjects;
    },

    getScopes: async (subject: string) => {
        const questions = await db.questions.where('subject').equals(subject).toArray();
        const scopes = Array.from(new Set(questions.map(q => q.scope)));
        return scopes;
    }
};
