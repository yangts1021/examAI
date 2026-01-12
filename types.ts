
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
}
