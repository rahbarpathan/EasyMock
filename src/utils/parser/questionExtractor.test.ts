import { describe, it, expect } from 'vitest';
import { extractQuestionsFromText } from './questionExtractor';

describe('Question Extractor', () => {
  it('extracts standard numbered questions with line-separated options', () => {
    const raw = `
1. What is the capital of France?
(A) London
(B) Paris
(C) Berlin
(D) Rome

2. What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
    `;

    const questions = extractQuestionsFromText(raw);
    expect(questions.length).toBe(2);

    expect(questions[0].number).toBe(1);
    expect(questions[0].question).toContain('What is the capital of France?');
    expect(questions[0].options['A']).toBe('London');
    expect(questions[0].options['B']).toBe('Paris');
    expect(questions[0].options['C']).toBe('Berlin');
    expect(questions[0].options['D']).toBe('Rome');

    expect(questions[1].number).toBe(2);
    expect(questions[1].options['B']).toBe('4');
  });

  it('extracts inline options formatted on the same line', () => {
    const raw = `
1. Select the smallest prime number:
(A) 0 (B) 1 (C) 2 (D) 3
    `;

    const questions = extractQuestionsFromText(raw);
    expect(questions.length).toBe(1);
    expect(questions[0].options['A']).toBe('0');
    expect(questions[0].options['B']).toBe('1');
    expect(questions[0].options['C']).toBe('2');
    expect(questions[0].options['D']).toBe('3');
  });

  it('extracts True/False questions', () => {
    const raw = `
1. The Earth revolves around the Sun. True or False?
(A) True
(B) False
    `;

    const questions = extractQuestionsFromText(raw);
    expect(questions.length).toBe(1);
    expect(questions[0].options['A']).toBe('True');
    expect(questions[0].options['B']).toBe('False');
  });

  it('extracts embedded answers and explanations if present', () => {
    const raw = `
1. Which is an operating system?
(A) Linux
(B) Python
(C) HTML
(D) CSS
Answer: A
Explanation: Linux is an open-source Unix-like kernel and operating system family.
    `;

    const questions = extractQuestionsFromText(raw);
    expect(questions.length).toBe(1);
    expect(questions[0].correctAnswer).toBe('A');
    expect(questions[0].explanation).toContain('Linux is an open-source Unix-like kernel');
  });

  it('flags incomplete questions with missing options', () => {
    const raw = `
1. Open ended essay question without options?
Just some descriptive text.

2. Normal Question
(A) Opt 1
(B) Opt 2
    `;

    const questions = extractQuestionsFromText(raw);
    expect(questions.length).toBe(2);
    expect(questions[0].isIncomplete).toBe(true);
    expect(questions[0].extractionConfidence).toBe('low');
    expect(questions[1].isIncomplete).toBe(false);
  });
});
