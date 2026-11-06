import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveActiveSession,
  getActiveSession,
  clearActiveSession,
  saveTestToHistory,
  getTestHistory,
  clearTestHistory,
} from './storage';
import { TestResult, TestSession } from '../types';

// Mock localStorage for Vitest environment
const mockStore: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStore[key];
  }),
  clear: vi.fn(() => {
    for (const key in mockStore) delete mockStore[key];
  }),
};

vi.stubGlobal('localStorage', localStorageMock);

describe('Storage and Session Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('saves and retrieves active test session accurately', () => {
    const session: TestSession = {
      testId: 'test-rec-1',
      config: {
        testName: 'Restore Test',
        durationMinutes: 60,
        enableNegativeMarking: true,
        negativeScheme: 'quarter',
        customNegativeMarks: 0,
        marksPerQuestion: 1,
        shuffleQuestions: false,
        shuffleOptions: false,
        enableFullscreen: false,
        confirmManualSubmission: true,
      },
      questions: [{ id: 'q1', number: 1, question: 'Hi', options: {}, marks: 1, negativeMarks: 0 }],
      answers: { q1: 'A' },
      questionStatuses: { q1: 'answered' },
      currentQuestionIndex: 0,
      startTime: 1000,
      endTime: 5000,
      durationMs: 4000,
      isSubmitted: false,
      timeSpentPerQuestion: { q1: 10 },
    };

    saveActiveSession(session);
    const restored = getActiveSession();

    expect(restored).not.toBeNull();
    expect(restored?.testId).toBe('test-rec-1');
    expect(restored?.answers['q1']).toBe('A');
    expect(restored?.endTime).toBe(5000);

    clearActiveSession();
    expect(getActiveSession()).toBeNull();
  });

  it('saves and clears test history', () => {
    const result: TestResult = {
      testId: 'hist-1',
      testName: 'History Test',
      submittedAt: Date.now(),
      submissionType: 'manual',
      durationMinutes: 30,
      timeTakenSeconds: 600,
      totalQuestions: 10,
      attempted: 8,
      correct: 7,
      incorrect: 1,
      unanswered: 2,
      markedForReviewCount: 1,
      marksPerQuestion: 1,
      negativeMarksPerQuestion: 0.25,
      finalScore: 6.75,
      maxScore: 10,
      accuracyPercentage: 87.5,
      scorePercentage: 67.5,
      hasAnswerKey: true,
      questions: [],
    };

    saveTestToHistory(result);
    const history = getTestHistory();

    expect(history.length).toBe(1);
    expect(history[0].testName).toBe('History Test');
    expect(history[0].score).toBe(6.75);

    clearTestHistory();
    expect(getTestHistory()).toEqual([]);
  });
});

