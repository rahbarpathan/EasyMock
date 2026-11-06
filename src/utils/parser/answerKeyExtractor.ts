import { AnswerKeyEntry, AnswerKeyMatchResult, Question } from '../../types';

/**
 * Regex patterns to extract question number and answer choice
 */
const ANSWER_KEY_PATTERNS = [
  // Question 1 - Option A / Question 1: A / Question 1 - A
  /(?:Question|Q\.?|Que\.?)\s*(\d+)[\s.:\-–—=]+(?:Option\s+)?\(?([A-Ea-e1-5])\)?/i,
  // 1 - A / 1. A / 1: A / 1 = A / 1) A / (1) A
  /^\s*\(?(\d+)\)?[\s.:\-–—=]+(?:Option\s+)?\(?([A-Ea-e1-5])\)?\s*$/i,
  // Line with multiple items like "1. A  2. B  3. C" or "1-A 2-B 3-C"
];

const INLINE_KEY_PAIR_REGEX = /(?:(?:Q\.?|Que\.?)?\s*\(?(\d+)\)?[\s.:\-–—=]+(?:Option\s+)?\(?([A-Ea-e1-5])\)?)/gi;

/**
 * Extracts answer key entries from raw text
 */
export function extractAnswerKeyFromText(rawText: string): AnswerKeyEntry[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const entries: AnswerKeyEntry[] = [];
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    // Try single pattern on whole line
    let matchedSingle = false;
    for (const pattern of ANSWER_KEY_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const qNum = parseInt(match[1], 10);
        const ans = normalizeAnswer(match[2]);
        if (!isNaN(qNum) && ans) {
          entries.push({ questionNumber: qNum, answer: ans });
          matchedSingle = true;
          break;
        }
      }
    }

    if (matchedSingle) continue;

    // Try finding multiple inline pairs in the line (e.g. "1. B 2. C 3. A 4. D")
    let pairMatch: RegExpExecArray | null;
    let foundInline = false;
    const re = new RegExp(INLINE_KEY_PAIR_REGEX);
    while ((pairMatch = re.exec(line)) !== null) {
      const qNum = parseInt(pairMatch[1], 10);
      const ans = normalizeAnswer(pairMatch[2]);
      if (!isNaN(qNum) && ans) {
        entries.push({ questionNumber: qNum, answer: ans });
        foundInline = true;
      }
    }

    if (!foundInline) {
      // Fallback for simple space-separated or comma-separated pairs: "1 A", "2 B"
      const simpleMatch = line.match(/^(\d+)\s+([A-Ea-e1-5])$/);
      if (simpleMatch) {
        const qNum = parseInt(simpleMatch[1], 10);
        const ans = normalizeAnswer(simpleMatch[2]);
        if (!isNaN(qNum) && ans) {
          entries.push({ questionNumber: qNum, answer: ans });
        }
      }
    }
  }

  return entries;
}

/**
 * Matches extracted answer key entries to a list of questions
 */
export function matchAnswerKeyWithQuestions(
  entries: AnswerKeyEntry[],
  questions: Question[]
): {
  updatedQuestions: Question[];
  matchResult: AnswerKeyMatchResult;
  answerMap: Record<number, string>;
} {
  const answerMap: Record<number, string> = {};
  const duplicateKeys: number[] = [];
  const seenNumbers = new Set<number>();

  for (const entry of entries) {
    if (seenNumbers.has(entry.questionNumber)) {
      duplicateKeys.push(entry.questionNumber);
    } else {
      seenNumbers.add(entry.questionNumber);
      answerMap[entry.questionNumber] = entry.answer;
    }
  }

  const questionNumbers = new Set(questions.map(q => q.number));
  let matched = 0;
  const missingInKey: number[] = [];

  for (const q of questions) {
    if (answerMap[q.number]) {
      matched++;
    } else {
      missingInKey.push(q.number);
    }
  }

  const unmatchedKeys: AnswerKeyEntry[] = [];
  for (const entry of entries) {
    if (!questionNumbers.has(entry.questionNumber)) {
      unmatchedKeys.push(entry);
    }
  }

  // Update questions with their correct answers
  const updatedQuestions = questions.map(q => {
    const ans = answerMap[q.number];
    return {
      ...q,
      correctAnswer: ans || q.correctAnswer || null,
    };
  });

  const matchResult: AnswerKeyMatchResult = {
    totalFound: entries.length,
    matched,
    missingInKey,
    unmatchedKeys,
    duplicateKeys,
  };

  return {
    updatedQuestions,
    matchResult,
    answerMap,
  };
}

function normalizeAnswer(ans: string): string {
  if (!ans) return '';
  const trimmed = ans.trim();
  // If 1-5, map to A-E
  if (['1', '2', '3', '4', '5'].includes(trimmed)) {
    return String.fromCharCode(64 + parseInt(trimmed, 10));
  }
  return trimmed.toUpperCase();
}

