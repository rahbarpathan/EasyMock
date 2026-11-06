import { TestHistoryItem, TestResult, TestSession } from '../types';
import { normalizeTestResult } from './scoring';

const ACTIVE_SESSION_KEY = 'easymock_active_session_v1';
const HISTORY_KEY = 'easymock_test_history_v1';
const DRAFT_CONFIG_KEY = 'easymock_draft_config_v1';

/**
 * Saves the active test session to local storage
 */
export function saveActiveSession(session: TestSession): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save active session to localStorage:', e);
  }
}

/**
 * Retrieves the active test session from local storage if exists and valid
 */
export function getActiveSession(): TestSession | null {
  try {
    const data = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!data) return null;
    const session = JSON.parse(data) as TestSession;

    // Check if valid session object
    if (!session || !session.testId || !session.endTime || !Array.isArray(session.questions)) {
      return null;
    }

    return session;
  } catch (e) {
    console.error('Failed to retrieve active session from localStorage:', e);
    return null;
  }
}

/**
 * Clears the active test session
 */
export function clearActiveSession(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear active session:', e);
  }
}

/**
 * Saves a completed test result into local history
 */
export function saveTestToHistory(result: TestResult): void {
  try {
    const normalized = normalizeTestResult(result);
    const history = getTestHistory();
    const historyItem: TestHistoryItem = {
      id: normalized.testId,
      testName: normalized.testName,
      date: normalized.submittedAt,
      totalQuestions: normalized.totalQuestions,
      score: normalized.finalScore,
      maxScore: normalized.maxScore,
      accuracy: normalized.accuracyPercentage,
      durationMinutes: normalized.durationMinutes,
      submissionType: normalized.submissionType,
      resultData: normalized,
    };

    // Keep the most recent 30 tests
    const updatedHistory = [historyItem, ...history.filter(h => h.id !== normalized.testId)].slice(0, 30);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (quotaError) {
      console.warn('LocalStorage quota reached, storing lightweight question history:', quotaError);
      // Prune bulky question explanations/details to ensure storage fits in localStorage quota
      const lightweight = updatedHistory.map((h) => ({
        ...h,
        resultData: {
          ...h.resultData,
          questions: (h.resultData.questions || []).map((q) => ({
            id: q.id,
            number: q.number,
            question: q.question.slice(0, 300),
            options: q.options,
            correctAnswer: q.correctAnswer,
            selectedAnswer: q.selectedAnswer,
            isCorrect: q.isCorrect,
            isAttempted: q.isAttempted,
            status: q.status,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            timeSpentSeconds: q.timeSpentSeconds,
            scoreAwarded: q.scoreAwarded,
          })),
        },
      }));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(lightweight));
    }
  } catch (e) {
    console.error('Failed to save test to history:', e);
  }
}

/**
 * Gets test history from local storage, normalizing any legacy or partial entries
 */
export function getTestHistory(): TestHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: any) => {
      // Normalize resultData so viewing any past attempt is always complete and never causes blank pages
      const resultData = normalizeTestResult(item.resultData || item, item);
      return {
        id: item.id || resultData.testId,
        testName: item.testName || resultData.testName,
        date: item.date || resultData.submittedAt,
        totalQuestions: item.totalQuestions ?? resultData.totalQuestions,
        score: item.score ?? resultData.finalScore,
        maxScore: item.maxScore ?? resultData.maxScore,
        accuracy: item.accuracy ?? resultData.accuracyPercentage,
        durationMinutes: item.durationMinutes ?? resultData.durationMinutes,
        submissionType: item.submissionType || resultData.submissionType,
        resultData,
      };
    });
  } catch (e) {
    console.error('Failed to parse test history:', e);
    return [];
  }
}

/**
 * Clears all test history
 */
export function clearTestHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear test history:', e);
  }
}

/**
 * Remove a single history item by id
 */
export function deleteHistoryItem(id: string): void {
  try {
    const history = getTestHistory().filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to delete history item:', e);
  }
}

