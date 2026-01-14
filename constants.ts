// 在這裡貼上您的 Google Apps Script 網頁應用程式網址
// 請務必將網址貼在引號內，例如: "https://script.google.com/macros/s/AKfycbx.../exec"
export const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyPnWaTsYWV2IBiVMtmgevrMyx87DulDsp3bEhx_1E_YLHPp4FBAvCrPlkImUuBy8R6/exec';

// Use import.meta.env for Vite environment variables
// Ensure VITE_GEMINI_API_KEY is set in .env
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';

