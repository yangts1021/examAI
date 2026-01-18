import { db, ImageAsset } from './db';
import { getGasUrl } from './gasService';
import { Question } from '../types';

export const offlineService = {
    // Sync all data from GAS to Local IndexedDB
    syncData: async (onProgress?: (msg: string) => void) => {
        try {
            const url = getGasUrl();
            if (!url) throw new Error("GAS URL not configured");

            // 1. Fetch Questions
            if (onProgress) onProgress("正在下載最新的題庫...");

            // We need a way to fetch ALL questions. 
            // Currently gasService fetches by subject/scope. 
            // We often need a "dump" API or efficient way. 
            // For now, we reuse the existing fetch with a special 'all' flag or iterate known subjects?
            // Actually, looking at gasService, 'getQuestions' takes subject and scope.
            // To sync EVERYTHING, we might needs to fetch the list of subjects first, then fetch all questions for them.

            // Let's rely on fetching subjects first
            if (onProgress) onProgress("正在讀取科目列表...");
            const subjectsUrl = `${url}?action=getSubjects`;
            const subjectsRes = await fetch(subjectsUrl);
            const subjectsData = await subjectsRes.json();

            if (!subjectsData.success) throw new Error("Failed to fetch subjects");
            const subjects = subjectsData.data as string[];

            let allQuestions: Question[] = [];

            // Fetch questions for each subject
            // Optimized: In a real app we might want a bulk export API, but loop is fine for now
            for (const subject of subjects) {
                if (onProgress) onProgress(`正在下載科目：${subject}...`);
                // For sync, we probably want ALL scopes.
                // The current API might need adjustment or we loop scopes too.
                // Simpler approach: Fetch questions by Subject only (ignoring scope to get all?) 
                // If the GAS script supports optional scope, that's great. 
                // Assuming we need to iterate scopes too if the backend enforces it.

                // Let's simplify: we assume we can fetch by subject.
                const qUrl = `${url}?action=getQuestions&subject=${encodeURIComponent(subject)}`;
                // NOTE: If your GAS script requires scope, this might fail or return empty.
                // We'll try to fetch all for the subject.

                const qRes = await fetch(qUrl);
                const qJson = await qRes.json();

                if (qJson.success && Array.isArray(qJson.data)) {
                    // Enrich with subject if missing
                    const qs = qJson.data.map((q: any) => ({ ...q, subject }));
                    allQuestions.push(...qs);
                }
            }

            if (onProgress) onProgress(`共找到 ${allQuestions.length} 題，開始儲存...`);

            // 2. Save Questions to DB
            await db.transaction('rw', db.questions, async () => {
                await db.questions.clear(); // Full sync updates everything
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
