import { describe, it, expect } from 'vitest';
import { scoreTestSession, calculateNegativeMarkValue, normalizeTestResult } from './scoring';
import { TestConfig, TestSession, Question } from '../types';

describe('Scoring Engine', () => {
  const baseConfig: TestConfig = {
    testName: 'General Test',
    durationMinutes: 30,
    enableNegativeMarking: true,
    negativeScheme: 'quarter',
    customNegativeMarks: 0,
    marksPerQuestion: 1,
    shuffleQuestions: false,
    shuffleOptions: false,
    enableFullscreen: false,
    confirmManualSubmission: true,
  };

  const sampleQuestions: Question[] = [
    {
      id: 'q-1',
      number: 1,
      question: 'Question 1',
      options: { A: 'Opt A', B: 'Opt B' },
      correctAnswer: 'A',
      marks: 1,
      negativeMarks: 0.25,
    },
    {
      id: 'q-2',
      number: 2,
      question: 'Question 2',
      options: { A: 'Opt A', B: 'Opt B' },
      correctAnswer: 'B',
      marks: 1,
      negativeMarks: 0.25,
    },
    {
      id: 'q-3',
      number: 3,
      question: 'Question 3',
      options: { A: 'Opt A', B: 'Opt B' },
      correctAnswer: 'A',
      marks: 1,
      negativeMarks: 0.25,
    },
    {
      id: 'q-4',
      number: 4,
      question: 'Question 4',
      options: { A: 'Opt A', B: 'Opt B' },
      correctAnswer: 'B',
      marks: 1,
      negativeMarks: 0.25,
    },
  ];

  it('calculates negative mark values correctly for quarter, third, none, and custom', () => {
    expect(calculateNegativeMarkValue({ ...baseConfig, negativeScheme: 'quarter', marksPerQuestion: 1 })).toBe(0.25);
    expect(calculateNegativeMarkValue({ ...baseConfig, negativeScheme: 'third', marksPerQuestion: 1 })).toBeCloseTo(0.3333, 3);
    expect(calculateNegativeMarkValue({ ...baseConfig, negativeScheme: 'quarter', marksPerQuestion: 2 })).toBe(0.5);
    expect(calculateNegativeMarkValue({ ...baseConfig, enableNegativeMarking: false })).toBe(0);
    expect(calculateNegativeMarkValue({ ...baseConfig, negativeScheme: 'custom', customNegativeMarks: 0.66 })).toBe(0.66);
  });

  it('scores session correctly with correct, incorrect, and unanswered questions', () => {
    // Q1: correct (A), Q2: incorrect (selected A, correct B), Q3: unanswered, Q4: correct (B)
    const session: TestSession = {
      testId: 'test-1',
      config: baseConfig,
      questions: sampleQuestions,
      answers: {
        'q-1': 'A', // correct (+1)
        'q-2': 'A', // incorrect (-0.25)
        'q-4': 'B', // correct (+1)
      },
      questionStatuses: {
        'q-1': 'answered',
        'q-2': 'answered',
        'q-3': 'not_answered',
        'q-4': 'answered',
      },
      currentQuestionIndex: 0,
      startTime: Date.now() - 60000,
      endTime: Date.now() + 1740000,
      durationMs: 1800000,
      isSubmitted: false,
      timeSpentPerQuestion: { 'q-1': 20, 'q-2': 15, 'q-4': 25 },
    };

    const result = scoreTestSession(session, 'manual');

    expect(result.totalQuestions).toBe(4);
    expect(result.attempted).toBe(3);
    expect(result.correct).toBe(2);
    expect(result.incorrect).toBe(1);
    expect(result.unanswered).toBe(1);
    // Score = 2 * 1 - 1 * 0.25 = 1.75
    expect(result.finalScore).toBe(1.75);
    expect(result.maxScore).toBe(4);
    // Accuracy = 2 / 3 = 66.7%
    expect(result.accuracyPercentage).toBe(66.7);
  });

  it('never penalizes unanswered questions', () => {
    const session: TestSession = {
      testId: 'test-2',
      config: baseConfig,
      questions: sampleQuestions,
      answers: {},
      questionStatuses: {},
      currentQuestionIndex: 0,
      startTime: Date.now() - 10000,
      endTime: Date.now() + 1000000,
      durationMs: 1000000,
      isSubmitted: false,
      timeSpentPerQuestion: {},
    };

    const result = scoreTestSession(session, 'auto_time_expired');

    expect(result.attempted).toBe(0);
    expect(result.unanswered).toBe(4);
    expect(result.correct).toBe(0);
    expect(result.incorrect).toBe(0);
    expect(result.finalScore).toBe(0);
    expect(result.accuracyPercentage).toBe(0);
    expect(result.submissionType).toBe('auto_time_expired');
  });

  it('handles practice mode without answer key safely', () => {
    const questionsWithoutAnswers = sampleQuestions.map(q => ({ ...q, correctAnswer: null }));
    const session: TestSession = {
      testId: 'test-3',
      config: baseConfig,
      questions: questionsWithoutAnswers,
      answers: { 'q-1': 'A', 'q-2': 'B' },
      questionStatuses: { 'q-1': 'answered', 'q-2': 'answered' },
      currentQuestionIndex: 0,
      startTime: Date.now() - 5000,
      endTime: Date.now() + 500000,
      durationMs: 500000,
      isSubmitted: false,
      timeSpentPerQuestion: {},
    };

    const result = scoreTestSession(session);

    expect(result.hasAnswerKey).toBe(false);
    expect(result.attempted).toBe(2);
    expect(result.correct).toBe(0);
    expect(result.incorrect).toBe(0);
    expect(result.finalScore).toBe(0);
    expect(result.questions[0].isCorrect).toBeNull();
  });

  it('normalizes empty or corrupted result data with safe defaults and history fallback', () => {
    const fallbackHistoryItem = {
      id: 'past-test-1',
      testName: 'My Mock Test',
      date: 1793990110000,
      totalQuestions: 150,
      score: 89,
      maxScore: 150,
      accuracy: 59.3,
      durationMinutes: 120,
      submissionType: 'manual' as const,
    };

    // Case 1: resultData was completely undefined / missing in localStorage
    const normalizedFromNothing = normalizeTestResult(undefined, fallbackHistoryItem);
    expect(normalizedFromNothing.testName).toBe('My Mock Test');
    expect(normalizedFromNothing.finalScore).toBe(89);
    expect(normalizedFromNothing.maxScore).toBe(150);
    expect(normalizedFromNothing.accuracyPercentage).toBe(59.3);
    expect(normalizedFromNothing.totalQuestions).toBe(150);
    expect(normalizedFromNothing.marksPerQuestion).toBe(1);
    expect(normalizedFromNothing.negativeMarksPerQuestion).toBe(0);
    expect(normalizedFromNothing.questions.length).toBe(150);
    // Verify no crashing calling .toFixed(2)
    expect(normalizedFromNothing.marksPerQuestion.toFixed(2)).toBe('1.00');
    expect(normalizedFromNothing.negativeMarksPerQuestion.toFixed(2)).toBe('0.00');

    // Case 2: partial resultData with undefined marks and missing questions array
    const partialResult = {
      testName: 'Partial Test',
      finalScore: 45,
      questions: null,
    };
    const normalizedPartial = normalizeTestResult(partialResult);
    expect(normalizedPartial.testName).toBe('Partial Test');
    expect(normalizedPartial.marksPerQuestion).toBe(1);
    expect(normalizedPartial.negativeMarksPerQuestion).toBe(0);
    expect(Array.isArray(normalizedPartial.questions)).toBe(true);
  });
});

