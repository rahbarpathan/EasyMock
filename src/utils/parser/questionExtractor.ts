import { Question } from '../../types';

interface RawQuestionBlock {
  number: number;
  lines: string[];
  pageNumber?: number;
}

/**
 * Regular expressions to identify question starts
 */
const QUESTION_START_PATTERNS = [
  /^(?:Question|Q\.?|Que\.?)\s*(\d+)[\s.:\-–—)]\s*(.*)/i,
  /^\(?(\d+)\)[\s.:\-–—]\s*(.*)/,
  /^\[(\d+)\][\s.:\-–—]?\s*(.*)/,
  /^(\d+)[\.\)]\s+(.*)/,
  /^(\d+)\s*[-–—]\s+(.*)/,
];

/**
 * Option letter prefixes
 */
const OPTION_PREFIX_REGEX = /^\s*(?:\(?([A-Ea-e])\)|\b([A-Ea-e])[\.\)]|\[([A-Ea-e])\])\s+(.*)/;
const NUMBERED_OPTION_REGEX = /^\s*(?:\(?([1-5])\)|\b([1-5])[\.\)]|\[([1-5])\])\s+(.*)/;

/**
 * Detect inline options like (A) abc (B) def (C) ghi (D) jkl
 */
const INLINE_OPTION_SPLIT_REGEX = /(?:\s+|^)(?:\(([A-Ea-e])\)|\[([A-Ea-e])\]|([A-Ea-e])[\.\)])\s+/g;

/**
 * Embedded answer patterns like "Answer: B", "Ans: (C)", "Correct Option: A"
 */
const EMBEDDED_ANSWER_REGEX = /(?:Ans(?:wer)?|Correct(?:\s+Option)?|Key)\s*[:=\-–—]\s*(?:\(?([A-Ea-e1-5])\)?)/i;

/**
 * Explanation patterns like "Explanation: ...", "Solution: ..."
 */
const EXPLANATION_REGEX = /(?:Explanation|Solution|Exp|Soln)\s*[:=\-–—]\s*(.+)/i;

/**
 * Extracts questions from raw text
 */
export function extractQuestionsFromText(rawText: string, defaultMarks = 1, defaultNegativeMarks = 0): Question[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim());

  // Pass 1: Partition lines into raw question blocks
  const blocks: RawQuestionBlock[] = [];
  let currentBlock: RawQuestionBlock | null = null;
  let pageCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect page boundary indicator if present (e.g. "--- Page 2 ---" or "[Page 2]")
    const pageMatch = line.match(/^---+\s*Page\s*(\d+)\s*---+$/i) || line.match(/^\[Page\s*(\d+)\]$/i);
    if (pageMatch) {
      pageCounter = parseInt(pageMatch[1], 10);
      continue;
    }

    if (!line) {
      continue;
    }

    // Check if line starts a new question
    let matchedQNum: number | null = null;
    let questionFirstLineContent = '';

    for (const pattern of QUESTION_START_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        // Only accept reasonable question numbers
        if (!isNaN(num) && num > 0 && num < 1000) {
          // If we already have a block, check if this is likely a real subsequent question
          // or an option like "1) Something" when options are numbered
          if (currentBlock && num === currentBlock.number) {
            // Same question number repeated, likely continuation or duplicate
            continue;
          }
          matchedQNum = num;
          questionFirstLineContent = match[2]?.trim() || '';
          break;
        }
      }
    }

    if (matchedQNum !== null) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        number: matchedQNum,
        lines: questionFirstLineContent ? [questionFirstLineContent] : [],
        pageNumber: pageCounter,
      };
    } else if (currentBlock) {
      currentBlock.lines.push(line);
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  // Fallback: If no structured question headers were found, try paragraph-based extraction
  if (blocks.length === 0) {
    return parseUnnumberedText(rawText, defaultMarks, defaultNegativeMarks);
  }

  // Pass 2: Parse each block into structured Question
  const questions: Question[] = [];

  for (let idx = 0; idx < blocks.length; idx++) {
    const block = blocks[idx];
    const parsed = parseQuestionBlock(block, defaultMarks, defaultNegativeMarks, idx + 1);
    questions.push(parsed);
  }

  return questions;
}

/**
 * Parses a single question block's lines into question text, options, answer, and explanation
 */
function parseQuestionBlock(
  block: RawQuestionBlock,
  defaultMarks: number,
  defaultNegativeMarks: number,
  fallbackNumber: number
): Question {
  const allLines = [...block.lines];
  const questionLines: string[] = [];
  const options: Record<string, string> = {};
  let currentOptionKey: string | null = null;
  let detectedAnswer: string | null = null;
  let explanation: string | null = null;

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];

    // Check for explanation
    const explMatch = line.match(EXPLANATION_REGEX);
    if (explMatch) {
      explanation = explMatch[1];
      // Collect remaining lines as part of explanation
      for (let j = i + 1; j < allLines.length; j++) {
        explanation += ' ' + allLines[j];
      }
      break;
    }

    // Check for embedded answer (e.g. "Answer: B")
    const ansMatch = line.match(EMBEDDED_ANSWER_REGEX);
    if (ansMatch) {
      const rawAns = ansMatch[1].toUpperCase();
      // Map 1->A, 2->B, etc. if numbered
      detectedAnswer = normalizeOptionKey(rawAns);
      continue;
    }

    // Check for line-based option letter prefix (A, B, C, D, E)
    const optMatch = line.match(OPTION_PREFIX_REGEX);
    if (optMatch) {
      const letter = (optMatch[1] || optMatch[2] || optMatch[3]).toUpperCase();
      const content = optMatch[4]?.trim() || '';
      currentOptionKey = letter;
      options[letter] = content;

      // Check if this line also contains inline other options (e.g. "(A) Apple (B) Banana")
      checkInlineOptionsInLine(content, letter, options);
      continue;
    }

    // Check for numbered options (1, 2, 3, 4) mapped to (A, B, C, D)
    const numOptMatch = line.match(NUMBERED_OPTION_REGEX);
    if (numOptMatch && Object.keys(options).length < 5) {
      const numKey = numOptMatch[1] || numOptMatch[2] || numOptMatch[3];
      const letter = String.fromCharCode(64 + parseInt(numKey, 10)); // 1->A, 2->B...
      const content = numOptMatch[4]?.trim() || '';
      currentOptionKey = letter;
      options[letter] = content;
      continue;
    }

    // If currently accumulating an option, append continuation line
    if (currentOptionKey && options[currentOptionKey]) {
      options[currentOptionKey] += ' ' + line;
    } else {
      // Still in question text
      questionLines.push(line);
    }
  }

  // If no options were found line-by-line, test if inline options exist in the question lines
  if (Object.keys(options).length === 0 && questionLines.length > 0) {
    extractInlineOptionsFromQuestionLines(questionLines, options);
  }

  // Detect True/False if only 2 options are present and say True / False
  detectTrueFalseOptions(questionLines, options);

  const questionText = questionLines.join(' ').trim();
  const optionCount = Object.keys(options).length;

  // Determine confidence & completeness
  let confidence: 'high' | 'medium' | 'low' = 'high';
  let isIncomplete = false;

  if (!questionText || optionCount === 0) {
    confidence = 'low';
    isIncomplete = true;
  } else if (optionCount < 2) {
    confidence = 'low';
    isIncomplete = true;
  } else if (optionCount < 4) {
    // 2 or 3 options may be valid (e.g. True/False or 3-choice questions)
    confidence = optionCount === 2 && isTrueFalse(options) ? 'high' : 'medium';
  }

  const qNumber = block.number || fallbackNumber;

  return {
    id: `q-${qNumber}-${Math.random().toString(36).substring(2, 7)}`,
    number: qNumber,
    question: questionText || `Question ${qNumber} (Text could not be extracted)`,
    options,
    correctAnswer: detectedAnswer,
    marks: defaultMarks,
    negativeMarks: defaultNegativeMarks,
    explanation,
    pageNumber: block.pageNumber,
    isIncomplete,
    extractionConfidence: confidence,
  };
}

/**
 * Checks for inline options inside a line, e.g. "(B) London (C) Berlin"
 */
function checkInlineOptionsInLine(content: string, firstKey: string, options: Record<string, string>) {
  const parts = content.split(/(?=\s+(?:\([B-Eb-e]\)|\[[B-Eb-e]\]|[B-Eb-e][\.\)]\s+))/);
  if (parts.length > 1) {
    options[firstKey] = parts[0].trim();
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      const match = part.match(OPTION_PREFIX_REGEX);
      if (match) {
        const letter = (match[1] || match[2] || match[3]).toUpperCase();
        options[letter] = match[4]?.trim() || '';
      }
    }
  }
}

/**
 * Extracts inline options from question lines when options weren't separated by newlines
 */
function extractInlineOptionsFromQuestionLines(questionLines: string[], options: Record<string, string>) {
  const fullText = questionLines.join(' ');
  const regex = /(?:\s+|^)(?:\(([A-Ea-e])\)|\[([A-Ea-e])\]|([A-Ea-e])[\.\)])\s+([^(]+)/g;
  let match: RegExpExecArray | null;
  const foundOptions: { key: string; text: string; index: number }[] = [];

  while ((match = regex.exec(fullText)) !== null) {
    const key = (match[1] || match[2] || match[3]).toUpperCase();
    const text = match[4].trim();
    foundOptions.push({ key, text, index: match.index });
  }

  if (foundOptions.length >= 2) {
    // Clean question text up to the first option
    const firstOptionIndex = foundOptions[0].index;
    const cleanPrompt = fullText.substring(0, firstOptionIndex).trim();
    questionLines.length = 0;
    questionLines.push(cleanPrompt);

    for (const opt of foundOptions) {
      options[opt.key] = opt.text;
    }
  }
}

/**
 * Fallback parser for unnumbered text paragraphs
 */
function parseUnnumberedText(text: string, defaultMarks: number, defaultNegativeMarks: number): Question[] {
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  return paragraphs.map((para, i) => {
    const lines = para.split('\n').map(l => l.trim()).filter(Boolean);
    const qNum = i + 1;
    const block: RawQuestionBlock = {
      number: qNum,
      lines,
    };
    return parseQuestionBlock(block, defaultMarks, defaultNegativeMarks, qNum);
  });
}

function normalizeOptionKey(key: string): string {
  if (['1', '2', '3', '4', '5'].includes(key)) {
    return String.fromCharCode(64 + parseInt(key, 10));
  }
  return key.toUpperCase();
}

function detectTrueFalseOptions(questionLines: string[], options: Record<string, string>) {
  if (Object.keys(options).length === 0) {
    const joined = questionLines.join(' ').toLowerCase();
    if (joined.includes('true or false') || joined.includes('true/false')) {
      options['A'] = 'True';
      options['B'] = 'False';
    }
  }
}

function isTrueFalse(options: Record<string, string>): boolean {
  const vals = Object.values(options).map(v => v.trim().toLowerCase());
  return vals.includes('true') && vals.includes('false');
}

