import Dexie, { Table } from 'dexie';
import { Question } from '../types';

export interface ImageAsset {
    id: string; // The original URL
    blob: Blob;
    mimeType: string;
    timestamp: number;
}

export interface OfflineHistory {
    id?: number;
    date: string;
    score: number;
    totalQuestions: number;
    subject: string;
    scope: string;
    mistakes: number;
    timestamp: number;
}

export class ExamOfflineDB extends Dexie {
    questions!: Table<Question, number>;
    images!: Table<ImageAsset, string>;
    history!: Table<OfflineHistory, number>;

    constructor() {
        super('ExamOfflineDB');
        this.version(1).stores({
            questions: '++id, subject, original_id', // Index for searching
            images: 'id', // Primary key is the URL
            history: '++id, timestamp'
        });
    }
}

export const db = new ExamOfflineDB();
