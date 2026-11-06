import { describe, it, expect } from 'vitest';
import { extractAnswerKeyFromText, matchAnswerKeyWithQuestions } from './answerKeyExtractor';
import { Question } from '../../types';

describe('Answer Key Extractor & Matcher', () => {
  it('extracts various standard answer key formats', () => {
    const raw = `
1 - A
Q2: B
3. C
4 = D
Question 5 – Option A
6) B
(7) C
    `;

    const entries = extractAnswerKeyFromText(raw);
    expect(entries.length).toBe(7);
    expect(entries[0]).toEqual({ questionNumber: 1, answer: 'A' });
    expect(entries[1]).toEqual({ questionNumber: 2, answer: 'B' });
    expect(entries[2]).toEqual({ questionNumber: 3, answer: 'C' });
    expect(entries[3]).toEqual({ questionNumber: 4, answer: 'D' });
    expect(entries[4]).toEqual({ questionNumber: 5, answer: 'A' });
    expect(entries[5]).toEqual({ questionNumber: 6, answer: 'B' });
    expect(entries[6]).toEqual({ questionNumber: 7, answer: 'C' });
  });

  it('extracts multiple inline answer pairs in a single line', () => {
    const raw = `1. A  2. B  3. C  4. D`;
    const entries = extractAnswerKeyFromText(raw);
    expect(entries.length).toBe(4);
    expect(entries.map(e => e.answer)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('correctly maps answers to questions and identifies missing and unmatched keys', () => {
    const mockQuestions: Question[] = [
      { id: '1', number: 1, question: 'Q1', options: {}, marks: 1, negativeMarks: 0 },
      { id: '2', number: 2, question: 'Q2', options: {}, marks: 1, negativeMarks: 0 },
      { id: '3', number: 3, question: 'Q3', options: {}, marks: 1, negativeMarks: 0 },
    ];

    // Answer key has answers for Q1, Q2, and Q99 (unmatched), missing Q3
    const entries = [
      { questionNumber: 1, answer: 'B' },
      { questionNumber: 2, answer: 'D' },
      { questionNumber: 99, answer: 'A' },
    ];

    const { updatedQuestions, matchResult } = matchAnswerKeyWithQuestions(entries, mockQuestions);

    expect(matchResult.matched).toBe(2);
    expect(matchResult.missingInKey).toEqual([3]);
    expect(matchResult.unmatchedKeys).toEqual([{ questionNumber: 99, answer: 'A' }]);
    expect(updatedQuestions[0].correctAnswer).toBe('B');
    expect(updatedQuestions[1].correctAnswer).toBe('D');
    expect(updatedQuestions[2].correctAnswer).toBeNull();
  });

  it('detects duplicate keys for the same question number', () => {
    const mockQuestions: Question[] = [
      { id: '1', number: 1, question: 'Q1', options: {}, marks: 1, negativeMarks: 0 },
    ];

    const entries = [
      { questionNumber: 1, answer: 'A' },
      { questionNumber: 1, answer: 'C' },
    ];

    const { matchResult } = matchAnswerKeyWithQuestions(entries, mockQuestions);
    expect(matchResult.duplicateKeys).toEqual([1]);
  });
});
