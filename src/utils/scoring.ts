import { Question, ScoredQuestion, TestConfig, TestResult, TestSession } from '../types';

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

