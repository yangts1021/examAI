import { QuizSubmission, Question } from "../types";

const GAS_URL_KEY = 'examai_gas_url';

export const getGasUrl = (): string => {
  return localStorage.getItem(GAS_URL_KEY) || '';
};

export const setGasUrl = (url: string): void => {
  localStorage.setItem(GAS_URL_KEY, url.trim());
};

/* 
  Google Apps Script (GAS) 整合服務
*/

const checkUrl = (): string | null => {
  const url = getGasUrl();
  if (!url) {
    alert("請先在首頁設定 Google Apps Script (GAS) 網址！");
    return null;
  }
  return url;
};

export const fetchQuizQuestions = async (subject: string, scope: string): Promise<Question[]> => {
  const url = checkUrl();
  if (!url) return [];

  try {
    const params = new URLSearchParams({
      action: 'getQuestions',
      subject: subject,
      scope: scope
    });

    const response = await fetch(`${url}?${params.toString()}`);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("GAS returned non-JSON response for questions.");
      return [];
    }

    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.questions)) {
      return result.questions;
    } else {
      console.error("GAS Fetch Error:", result);
      return [];
    }
  } catch (error) {
    console.error("GAS Fetch Network Error:", error);
    alert("讀取題目失敗：無法連線至 Google Sheets。");
    return [];
  }
};

export const fetchSubjects = async (): Promise<string[]> => {
  const url = getGasUrl(); // Don't alert on home page load if missing
  if (!url) return [];

  try {
    const params = new URLSearchParams({
      action: 'getSubjects'
    });

    const response = await fetch(`${url}?${params.toString()}`);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("GAS returned non-JSON response for subjects.");
      return [];
    }

    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.subjects)) {
      return result.subjects;
    } else {
      return [];
    }
  } catch (error) {
    console.error("GAS Fetch Subjects Error:", error);
    return [];
  }
};

export const fetchScopes = async (subject: string): Promise<string[]> => {
  const url = checkUrl();
  if (!url) return [];

  try {
    const params = new URLSearchParams({
      action: 'getScopes',
      subject: subject
    });

    const response = await fetch(`${url}?${params.toString()}`);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("GAS returned non-JSON response for scopes.");
      return [];
    }

    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.scopes)) {
      return result.scopes;
    } else {
      return [];
    }
  } catch (error) {
    console.error("GAS Fetch Scopes Error:", error);
    return [];
  }
};

export const saveQuizResult = async (submission: QuizSubmission): Promise<boolean> => {
  const url = checkUrl();
  if (!url) return false;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveResult',
        data: submission
      })
    });
    return true;
  } catch (error) {
    console.error("GAS Save Result Error:", error);
    return false;
  }
};

export interface HistoryRecord {
  timestamp: string;
  subject: string;
  scope: string;
  score: string;
  results: any[];
}

export const fetchQuizHistory = async (): Promise<HistoryRecord[]> => {
  const url = getGasUrl();
  if (!url) return [];

  try {
    const params = new URLSearchParams({
      action: 'getHistory'
    });

    const response = await fetch(`${url}?${params.toString()}`);
    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("GAS returned non-JSON response for history.");
      return [];
    }

    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.history)) {
      return result.history;
    } else {
      return [];
    }
  } catch (error) {
    console.error("GAS Fetch History Error:", error);
    return [];
  }
};