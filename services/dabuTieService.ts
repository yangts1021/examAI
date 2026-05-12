// 大補帖錯題與答題紀錄服務 (本地 localStorage)

const STORAGE_KEY = 'examai_dabutie_records';

export interface DabuTieAttempt {
  scopeId: string;
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface DabuTieWrongSummary {
  questionId: string;
  wrongCount: number;
  lastWrongAt: number;
  lastUserAnswer: string;
}

const readAll = (): DabuTieAttempt[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAll = (attempts: DabuTieAttempt[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch (e) {
    console.warn('儲存大補帖紀錄失敗', e);
  }
};

export const saveAttempt = (attempt: DabuTieAttempt) => {
  const all = readAll();
  all.push(attempt);
  // 保留最近 1000 筆，避免無限成長
  if (all.length > 1000) all.splice(0, all.length - 1000);
  writeAll(all);
};

export const saveAttempts = (attempts: DabuTieAttempt[]) => {
  const all = readAll();
  all.push(...attempts);
  if (all.length > 1000) all.splice(0, all.length - 1000);
  writeAll(all);
};

// 取得指定範圍的錯題摘要 (依題目去重，記錄錯誤次數)
export const getWrongSummary = (scopeId: string): DabuTieWrongSummary[] => {
  const map = new Map<string, DabuTieWrongSummary>();
  for (const a of readAll()) {
    if (a.scopeId !== scopeId || a.isCorrect) continue;
    const existing = map.get(a.questionId);
    if (existing) {
      existing.wrongCount += 1;
      if (a.timestamp > existing.lastWrongAt) {
        existing.lastWrongAt = a.timestamp;
        existing.lastUserAnswer = a.userAnswer;
      }
    } else {
      map.set(a.questionId, {
        questionId: a.questionId,
        wrongCount: 1,
        lastWrongAt: a.timestamp,
        lastUserAnswer: a.userAnswer,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.lastWrongAt - a.lastWrongAt);
};

// 清除指定題目的錯題紀錄 (例如在「只練錯題」答對後)
export const clearWrongForQuestion = (scopeId: string, questionId: string) => {
  const filtered = readAll().filter(
    (a) => !(a.scopeId === scopeId && a.questionId === questionId && !a.isCorrect),
  );
  writeAll(filtered);
};

export const clearAllWrong = (scopeId: string) => {
  const filtered = readAll().filter((a) => a.scopeId !== scopeId || a.isCorrect);
  writeAll(filtered);
};

// 嚴格字串比對：去除前後空白後比對
export const isAnswerCorrect = (userAnswer: string, correctAnswer: string): boolean => {
  return userAnswer.trim() === correctAnswer.trim();
};
