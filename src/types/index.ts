export type NegativeMarkingScheme = 'none' | 'quarter' | 'third' | 'custom';

export interface Question {
  id: string; // e.g., "q-1"
  number: number;
  question: string;
  options: Record<string, string>; // e.g., { "A": "Option text", "B": "Option text" }
  correctAnswer?: string | null; // e.g., "A", "B", etc.
  marks: number;
  negativeMarks: number;
  explanation?: string | null;
  pageNumber?: number;
  isIncomplete?: boolean;
  extractionConfidence?: 'high' | 'medium' | 'low';
}

export interface AnswerKeyEntry {
  questionNumber: number;
  answer: string;
}

export interface AnswerKeyMatchResult {
  totalFound: number;
  matched: number;
  missingInKey: number[]; // question numbers present in test but absent in key
  unmatchedKeys: AnswerKeyEntry[]; // answer key entries that have no matching question
  duplicateKeys: number[]; // question numbers that appeared more than once in the key
}

export interface TestConfig {
  testName: string;
  durationMinutes: number;
  enableNegativeMarking: boolean;
  negativeScheme: NegativeMarkingScheme;
  customNegativeMarks: number;
  marksPerQuestion: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  enableFullscreen: boolean;
  confirmManualSubmission: boolean;
}

export type QuestionStatus =
  | 'not_visited'
  | 'not_answered'
  | 'answered'
  | 'marked_for_review'
  | 'answered_marked_for_review';

export interface TestSession {
  testId: string;
  config: TestConfig;
  questions: Question[];
  answers: Record<string, string>; // questionId -> optionKey (e.g. "q-1": "B")
  questionStatuses: Record<string, QuestionStatus>; // questionId -> status
  currentQuestionIndex: number;
  startTime: number; // epoch ms
  endTime: number; // epoch ms (target deadline)
  durationMs: number;
  isSubmitted: boolean;
  submissionType?: 'manual' | 'auto_time_expired';
  submittedAt?: number;
  timeSpentPerQuestion: Record<string, number>; // in seconds
}

export interface ScoredQuestion extends Question {
  selectedAnswer: string | null;
  isAttempted: boolean;
  isCorrect: boolean | null; // null if test has no answer key
  status: QuestionStatus;
  timeSpentSeconds: number;
  scoreAwarded: number; // positive, negative, or 0
}

export interface TestResult {
  testId: string;
  testName: string;
  submittedAt: number;
  submissionType: 'manual' | 'auto_time_expired';
  durationMinutes: number;
  timeTakenSeconds: number;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  markedForReviewCount: number;
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
  finalScore: number;
  maxScore: number;
  accuracyPercentage: number;
  scorePercentage: number;
  hasAnswerKey: boolean;
  questions: ScoredQuestion[];
}

export interface TestHistoryItem {
  id: string;
  testName: string;
  date: number; // timestamp
  totalQuestions: number;
  score: number;
  maxScore: number;
  accuracy: number;
  durationMinutes: number;
  submissionType: 'manual' | 'auto_time_expired';
  resultData: TestResult;
}

