
export interface Question {
  id?: string;
  questionNumber?: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string; // 'A', 'B', 'C', or 'D'
  explanation: string;
  // 新增：圖片座標 [ymin, xmin, ymax, xmax] (0-1000 scale)
  diagramCoordinates?: number[];
  // 新增：前端裁切後的圖片 Base64
  diagramUrl?: string;
  // 新增：題組 ID (用於識別多題共用同一文章)
  groupId?: string;
  // 新增：題組內容 (文章、對話、圖表敘述)
  groupContent?: string;
}

export interface ExamPaperData {
  subject: string;
  scope: string;
  questions: Question[];
}

export interface QuizResult {
  questionNumber: number;
  selectedAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
}

export interface QuizSubmission {
  subject: string;
  scope: string;
  results: QuizResult[];
}

export enum AppRoute {
  HOME = 'home',
  UPLOAD = 'upload',
  QUIZ = 'quiz',
  HISTORY = 'history',
}
