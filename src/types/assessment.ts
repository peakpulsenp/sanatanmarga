export interface CourseQuestion {
  id: string;
  courseId: string;
  lessonId?: string;
  lessonTitle?: string;
  type: "mcq" | "true_false" | "multiple_select" | "short_answer";
  question: string;
  options?: {
    id: string;
    text: string;
  }[];
  correctAnswer?: string | string[]; // Kept only on admin/server side
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  source: "manual" | "ai_extracted";
  sourceType?: "course_lesson" | "manual" | "curriculum_import" | "video";
  sourceTimestampStart?: string;
  sourceTimestampEnd?: string;
  learningObjective?: string;
  sourceTimestamp?: number | string;
  sourceTextHash?: string;
  model?: string;
  version?: number;
  status: "draft" | "review" | "approved" | "archived";
  createdBy: string;
  generatedAt?: string;
  generatedBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AssessmentConfig {
  courseId: string;
  passingScore: number; // e.g., 70%
  questionCount: number; // e.g., 10 questions
  timeLimitMinutes: number; // e.g., 30 minutes
  maxAttempts: number; // e.g., 3 attempts
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showCorrectAnswersAfterSubmit: boolean;
  allowRetake: boolean;
  certificateRequired: boolean;
  updatedAt?: string;
}

export interface AssessmentAttempt {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  startedAt: string;
  submittedAt?: string;
  questionIds: string[];
  userAnswers?: Record<string, string | string[]>;
  score?: number;
  total?: number;
  percentage?: number;
  grade?: string;
  passed?: boolean;
  attemptNumber: number;
  durationSeconds?: number;
  gradedAt?: string;
  immutable?: boolean;
  status: "in_progress" | "completed" | "expired" | "graded";
}

export interface CourseRanking {
  userId: string;
  userName: string;
  courseId: string;
  score: number;
  total: number;
  percentage: number;
  grade: string;
  attempts: number;
  durationSeconds: number;
  submittedAt: string;
  rank?: number;
}

export interface QuestionIntelligence {
  questionId: string;
  question: string;
  type: string;
  difficulty: "easy" | "medium" | "hard";
  sourceLesson: string;
  totalAnswers: number;
  correctAnswers: number;
  incorrectAnswers: number;
  failureRate: number; // 0-100%
  flaggedHighFailure: boolean;
}

export interface AssessmentAnalytics {
  courseId: string;
  totalEnrolled: number;
  totalAttempts: number;
  uniqueStudentsAttempted: number;
  passedStudents: number;
  passRatePercentage: number;
  averageScorePercentage: number;
  averageDurationSeconds: number;
  certificatesIssuedCount: number;
  questionIntelligence: QuestionIntelligence[];
}
