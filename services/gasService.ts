import { GOOGLE_APP_SCRIPT_URL } from "../constants";
import { ExamPaperData, QuizSubmission, Question } from "../types";

/* 
  Google Apps Script (GAS) 整合服務
  
  嚴格模式：必須設定 GOOGLE_APP_SCRIPT_URL 才能運作。
*/

export const uploadExamData = async (data: ExamPaperData): Promise<boolean> => {
  if (!GOOGLE_APP_SCRIPT_URL) {
    alert("錯誤：尚未設定資料庫連結！\n\n請開啟專案中的 `constants.ts` 檔案，並將您的 Google Apps Script 網頁應用程式網址貼上。");
    return false;
  }

  try {
    const response = await fetch(GOOGLE_APP_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'upload',
        data: data
      })
    });

    // 先檢查是否拿到 JSON，很多時候權限錯誤會回傳 HTML
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("GAS returned non-JSON response:", text);

      // 偵測常見的 GAS HTML 權限錯誤
      if (text.includes("Google Drive") || text.includes("permission") || text.includes("權限") || text.includes("script.google.com")) {
        alert(`【權限不足：Google Drive】\n\nGoogle Apps Script 無法存取 Google Drive，因為您尚未授權。\n\n請依照以下步驟修復：\n1. 開啟 GAS 編輯器。\n2. 貼上並執行此測試函式：\n\nfunction runAuth() {\n  DriveApp.createFolder("Test_Auth");\n}\n\n3. 點擊「允許」授權。\n4. 務必建立「新版部署」。`);
      } else {
        alert("儲存失敗：Google Sheets 回傳了錯誤的內容 (非 JSON)。\n\n可能原因：\n1. 您的部署權限未設為「所有人」。\n2. 程式碼有錯誤導致崩潰。\n\n請查看 Console 了解詳細錯誤內容。");
      }
      return false;
    }

    const result = await response.json();
    if (result.status === 'success') {
      return true;
    } else {
      console.error("GAS Error:", result.message);

      const msg = typeof result.message === 'string' ? result.message : JSON.stringify(result.message);

      // 特殊處理 DriveApp 權限錯誤 (針對 Exception: 你沒有呼叫「DriveApp.createFolder」的權限)
      if (
        msg.includes("DriveApp") ||
        msg.includes("createFolder") ||
        msg.includes("auth/drive") ||
        msg.includes("權限")
      ) {
        alert(`【GAS 需要授權】\n\n偵測到錯誤：\n${msg}\n\n這表示您的 Google Apps Script 尚未取得「建立資料夾」的權限。\n\n請執行以下步驟修復：\n\n1. 回到 GAS 編輯器。\n2. 新增一個函式：\n   function doAuth() { DriveApp.createFolder("test"); }\n3. 執行該函式並完成「審查權限」。\n4. 點擊「部署」>「管理部署」> 編輯 > 選擇「新版本」> 部署。\n\n完成後請再次點擊儲存。`);
      } else {
        alert(`儲存失敗 (GAS 回傳錯誤): ${msg}`);
      }
      return false;
    }
  } catch (error) {
    console.error("GAS Upload Error:", error);
    alert(`連線失敗：${error}\n\n請檢查：\n1. 網址是否正確 (結尾通常是 /exec)\n2. 部署權限是否為「所有人」\n3. 是否有瀏覽器擴充功能阻擋`);
    return false;
  }
};

export const fetchQuizQuestions = async (subject: string, scope: string): Promise<Question[]> => {
  if (!GOOGLE_APP_SCRIPT_URL) {
    alert("錯誤：尚未設定資料庫連結！\n\n請開啟 `constants.ts` 設定 Google Apps Script 網址以讀取題目。");
    return [];
  }

  try {
    const params = new URLSearchParams({
      action: 'getQuestions',
      subject: subject,
      scope: scope
    });

    const response = await fetch(`${GOOGLE_APP_SCRIPT_URL}?${params.toString()}`);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("GAS returned non-JSON response for questions.");
      // alert("讀取失敗：資料庫回傳格式錯誤 (可能是權限問題，請檢查 GAS 部署)。");
      // 這裡可以選擇不跳 alert，以免影響使用者體驗，僅 console error
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
  if (!GOOGLE_APP_SCRIPT_URL) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      action: 'getSubjects'
    });

    const response = await fetch(`${GOOGLE_APP_SCRIPT_URL}?${params.toString()}`);

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
  if (!GOOGLE_APP_SCRIPT_URL) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      action: 'getScopes',
      subject: subject
    });

    const response = await fetch(`${GOOGLE_APP_SCRIPT_URL}?${params.toString()}`);

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
  if (!GOOGLE_APP_SCRIPT_URL) {
    alert("錯誤：無法儲存測驗結果 (未設定資料庫連結)。");
    return false;
  }

  try {
    await fetch(GOOGLE_APP_SCRIPT_URL, {
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
  if (!GOOGLE_APP_SCRIPT_URL) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      action: 'getHistory'
    });

    const response = await fetch(`${GOOGLE_APP_SCRIPT_URL}?${params.toString()}`);
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