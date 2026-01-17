// Use import.meta.env for Vite environment variables
// Ensure VITE_GEMINI_API_KEY is set in .env
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';

