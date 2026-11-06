import { TestHistoryItem, TestResult, TestSession } from '../types';

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
    const history = getTestHistory();
    const historyItem: TestHistoryItem = {
      id: result.testId,
      testName: result.testName,
      date: result.submittedAt,
      totalQuestions: result.totalQuestions,
      score: result.finalScore,
      maxScore: result.maxScore,
      accuracy: result.accuracyPercentage,
      durationMinutes: result.durationMinutes,
      submissionType: result.submissionType,
      resultData: result,
    };

    // Keep the most recent 30 tests
    const updatedHistory = [historyItem, ...history.filter(h => h.id !== result.testId)].slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error('Failed to save test to history:', e);
  }
}

/**
 * Gets test history from local storage
 */
export function getTestHistory(): TestHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TestHistoryItem[];
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

