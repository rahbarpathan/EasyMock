import { Question, ScoredQuestion, TestConfig, TestResult, TestSession, TestHistoryItem } from '../types';

/**
 * Calculates negative mark penalty per question based on config
 */
export function calculateNegativeMarkValue(config: TestConfig): number {
  if (!config.enableNegativeMarking || config.negativeScheme === 'none') {
    return 0;
  }
  const marks = config.marksPerQuestion || 1;
  switch (config.negativeScheme) {
    case 'quarter':
      return marks / 4;
    case 'third':
      return marks / 3;
    case 'custom':
      return Math.max(0, config.customNegativeMarks ?? 0);
    default:
      return 0;
  }
}

/**
 * Evaluates and scores an entire test session
 */
export function scoreTestSession(
  session: TestSession,
  submissionType: 'manual' | 'auto_time_expired' = 'manual'
): TestResult {
  const { config, questions, answers, questionStatuses, timeSpentPerQuestion, startTime, endTime } = session;
  const now = Date.now();
  const timeTakenSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
  const negativeMarkVal = calculateNegativeMarkValue(config);
  const marksPerQ = config.marksPerQuestion || 1;

  let attempted = 0;
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  let markedCount = 0;
  let hasAnswerKey = false;

  const scoredQuestions: ScoredQuestion[] = questions.map((q) => {
    const selectedAnswer = answers[q.id] || null;
    const isAttempted = Boolean(selectedAnswer);
    const status = questionStatuses[q.id] || 'not_visited';
    const timeSpent = timeSpentPerQuestion[q.id] || 0;

    if (status === 'marked_for_review' || status === 'answered_marked_for_review') {
      markedCount++;
    }

    if (q.correctAnswer && q.correctAnswer.trim() !== '') {
      hasAnswerKey = true;
    }

    let isCorrect: boolean | null = null;
    let scoreAwarded = 0;

    if (isAttempted) {
      attempted++;
      if (q.correctAnswer && q.correctAnswer.trim() !== '') {
        const studentNorm = (selectedAnswer || '').trim().toUpperCase();
        const correctNorm = q.correctAnswer.trim().toUpperCase();

        if (studentNorm === correctNorm) {
          isCorrect = true;
          correct++;
          scoreAwarded = marksPerQ;
        } else {
          isCorrect = false;
          incorrect++;
          scoreAwarded = -negativeMarkVal;
        }
      }
    } else {
      unanswered++;
      scoreAwarded = 0;
    }

    return {
      ...q,
      selectedAnswer,
      isAttempted,
      isCorrect,
      status,
      timeSpentSeconds: timeSpent,
      scoreAwarded,
      marks: marksPerQ,
      negativeMarks: negativeMarkVal,
    };
  });

  const totalQuestions = questions.length;
  const maxScore = totalQuestions * marksPerQ;
  
  // Total score calculation
  const rawScore = (correct * marksPerQ) - (incorrect * negativeMarkVal);
  // Round to 2 decimal places to prevent floating point inaccuracies like 30.000000000004
  const finalScore = Math.round(rawScore * 100) / 100;
  
  const accuracyPercentage = attempted > 0 
    ? Math.round((correct / attempted) * 1000) / 10 
    : 0;
    
  const scorePercentage = maxScore > 0 
    ? Math.round((Math.max(0, finalScore) / maxScore) * 1000) / 10 
    : 0;

  return {
    testId: session.testId,
    testName: config.testName || 'Mock Test',
    submittedAt: now,
    submissionType,
    durationMinutes: config.durationMinutes,
    timeTakenSeconds,
    totalQuestions,
    attempted,
    correct,
    incorrect,
    unanswered,
    markedForReviewCount: markedCount,
    marksPerQuestion: marksPerQ,
    negativeMarksPerQuestion: negativeMarkVal,
    finalScore,
    maxScore,
    accuracyPercentage,
    scorePercentage,
    hasAnswerKey,
    questions: scoredQuestions,
  };
}

/**
 * Normalizes and sanitizes a TestResult object (or historical record) to ensure
 * all required properties exist, preventing runtime errors (such as calling .toFixed on undefined)
 * and recovering gracefully from partial or legacy data stored in localStorage.
 */
export function normalizeTestResult(raw: any, fallback?: Partial<TestHistoryItem>): TestResult {
  const source = raw || {};
  const hist = fallback || {};

  const totalQuestions = Number(
    source.totalQuestions ?? hist.totalQuestions ?? (Array.isArray(source.questions) ? source.questions.length : 0)
  ) || 0;

  const marksPerQuestion = Number(source.marksPerQuestion ?? 1) || 1;
  const negativeMarksPerQuestion = Number(source.negativeMarksPerQuestion ?? 0) || 0;

  const finalScore = Number(source.finalScore ?? hist.score ?? 0) || 0;
  const maxScore = Number(source.maxScore ?? hist.maxScore ?? (totalQuestions * marksPerQuestion)) || 0;

  const accuracyPercentage = Number(source.accuracyPercentage ?? hist.accuracy ?? 0) || 0;
  const scorePercentage = Number(
    source.scorePercentage ?? (maxScore > 0 ? Math.round((Math.max(0, finalScore) / maxScore) * 1000) / 10 : 0)
  ) || 0;

  const durationMinutes = Number(source.durationMinutes ?? hist.durationMinutes ?? 0) || 0;
  const timeTakenSeconds = Number(source.timeTakenSeconds ?? (durationMinutes * 60)) || 0;

  let correct = Number(source.correct);
  let incorrect = Number(source.incorrect);
  let attempted = Number(source.attempted);
  let unanswered = Number(source.unanswered);

  if (isNaN(correct)) {
    correct = Math.max(0, Math.round(finalScore / marksPerQuestion));
  }
  if (isNaN(attempted)) {
    attempted = accuracyPercentage > 0 ? Math.round((correct / (accuracyPercentage / 100))) : correct;
    attempted = Math.min(totalQuestions, Math.max(correct, attempted));
  }
  if (isNaN(incorrect)) {
    incorrect = Math.max(0, attempted - correct);
  }
  if (isNaN(unanswered)) {
    unanswered = Math.max(0, totalQuestions - attempted);
  }

  const rawQuestions = Array.isArray(source.questions) ? source.questions : [];
  let scoredQuestions: ScoredQuestion[] = [];

  if (rawQuestions.length > 0) {
    scoredQuestions = rawQuestions.map((q: any, idx: number) => {
      const qNum = Number(q.number ?? idx + 1) || idx + 1;
      const opts = q.options && typeof q.options === 'object' ? q.options : {};
      const isAttempted = Boolean(q.isAttempted ?? Boolean(q.selectedAnswer));
      const isCorrect = q.isCorrect !== undefined ? q.isCorrect : (q.correctAnswer && q.selectedAnswer ? (String(q.selectedAnswer).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase()) : null);

      return {
        id: String(q.id || `q-${qNum}-${idx}`),
        number: qNum,
        question: String(q.question || `Question ${qNum}`),
        options: opts,
        correctAnswer: q.correctAnswer ?? null,
        marks: Number(q.marks ?? marksPerQuestion) || marksPerQuestion,
        negativeMarks: Number(q.negativeMarks ?? negativeMarksPerQuestion) || negativeMarksPerQuestion,
        explanation: q.explanation ? String(q.explanation) : null,
        pageNumber: q.pageNumber,
        isIncomplete: Boolean(q.isIncomplete),
        extractionConfidence: q.extractionConfidence || 'high',
        selectedAnswer: q.selectedAnswer ?? null,
        isAttempted,
        isCorrect,
        status: q.status || (isAttempted ? 'answered' : 'not_answered'),
        timeSpentSeconds: Number(q.timeSpentSeconds ?? 0) || 0,
        scoreAwarded: Number(q.scoreAwarded ?? (isCorrect === true ? marksPerQuestion : (isCorrect === false ? -negativeMarksPerQuestion : 0))) || 0,
      };
    });
  } else if (totalQuestions > 0) {
    for (let i = 1; i <= totalQuestions; i++) {
      const isCorrectPlace = i <= correct;
      const isIncorrectPlace = i > correct && i <= attempted;
      const isAttemptedPlace = isCorrectPlace || isIncorrectPlace;

      scoredQuestions.push({
        id: `q-${i}-restored`,
        number: i,
        question: `Question ${i} (Archived overview from past test session)`,
        options: {
          A: 'Option A',
          B: 'Option B',
          C: 'Option C',
          D: 'Option D',
        },
        correctAnswer: isCorrectPlace ? 'A' : null,
        marks: marksPerQuestion,
        negativeMarks: negativeMarksPerQuestion,
        explanation: null,
        selectedAnswer: isAttemptedPlace ? (isCorrectPlace ? 'A' : 'B') : null,
        isAttempted: isAttemptedPlace,
        isCorrect: isCorrectPlace ? true : (isIncorrectPlace ? false : null),
        status: isAttemptedPlace ? 'answered' : 'not_answered',
        timeSpentSeconds: 0,
        scoreAwarded: isCorrectPlace ? marksPerQuestion : (isIncorrectPlace ? -negativeMarksPerQuestion : 0),
      });
    }
  }

  const hasAnswerKey = Boolean(
    source.hasAnswerKey ?? (scoredQuestions.some((q) => q.correctAnswer != null) || correct > 0)
  );

  return {
    testId: String(source.testId || hist.id || `test-${Date.now()}`),
    testName: String(source.testName || hist.testName || 'Mock Test'),
    submittedAt: Number(source.submittedAt || hist.date || Date.now()) || Date.now(),
    submissionType: (source.submissionType || hist.submissionType || 'manual') as 'manual' | 'auto_time_expired',
    durationMinutes,
    timeTakenSeconds,
    totalQuestions,
    attempted,
    correct,
    incorrect,
    unanswered,
    markedForReviewCount: Number(source.markedForReviewCount ?? 0) || 0,
    marksPerQuestion,
    negativeMarksPerQuestion,
    finalScore,
    maxScore,
    accuracyPercentage,
    scorePercentage,
    hasAnswerKey,
    questions: scoredQuestions,
  };
}

