import { describe, it, expect } from 'vitest';
import { QuestionStatus } from '../types';

/**
 * Pure transition function that models the question status state machine in the CBT interface
 */
export function getNextQuestionStatus(
  currentStatus: QuestionStatus | undefined,
  action: 'VISIT' | 'SELECT_ANSWER' | 'CLEAR_ANSWER' | 'TOGGLE_MARK_REVIEW',
  hasAnswer: boolean
): QuestionStatus {
  switch (action) {
    case 'VISIT':
      if (!currentStatus || currentStatus === 'not_visited') {
        return hasAnswer ? 'answered' : 'not_answered';
      }
      return currentStatus;

    case 'SELECT_ANSWER':
      if (currentStatus === 'marked_for_review' || currentStatus === 'answered_marked_for_review') {
        return 'answered_marked_for_review';
      }
      return 'answered';

    case 'CLEAR_ANSWER':
      if (currentStatus === 'answered_marked_for_review' || currentStatus === 'marked_for_review') {
        return 'marked_for_review';
      }
      return 'not_answered';

    case 'TOGGLE_MARK_REVIEW':
      if (currentStatus === 'marked_for_review') {
        return 'not_answered';
      }
      if (currentStatus === 'answered_marked_for_review') {
        return 'answered';
      }
      return hasAnswer ? 'answered_marked_for_review' : 'marked_for_review';

    default:
      return currentStatus || 'not_visited';
  }
}

describe('CBT Question Status State Machine', () => {
  it('transitions from not_visited to not_answered when visited', () => {
    expect(getNextQuestionStatus('not_visited', 'VISIT', false)).toBe('not_answered');
    expect(getNextQuestionStatus(undefined, 'VISIT', false)).toBe('not_answered');
  });

  it('transitions to answered when an option is selected', () => {
    expect(getNextQuestionStatus('not_answered', 'SELECT_ANSWER', true)).toBe('answered');
  });

  it('transitions to answered_marked_for_review if marked for review and answered', () => {
    expect(getNextQuestionStatus('marked_for_review', 'SELECT_ANSWER', true)).toBe('answered_marked_for_review');
  });

  it('reverts to marked_for_review when answer is cleared on an answered & marked question', () => {
    expect(getNextQuestionStatus('answered_marked_for_review', 'CLEAR_ANSWER', false)).toBe('marked_for_review');
  });

  it('reverts to not_answered when answer is cleared on an answered question', () => {
    expect(getNextQuestionStatus('answered', 'CLEAR_ANSWER', false)).toBe('not_answered');
  });

  it('toggles mark for review on and off accurately', () => {
    // Unmarked without answer -> Marked for review
    expect(getNextQuestionStatus('not_answered', 'TOGGLE_MARK_REVIEW', false)).toBe('marked_for_review');
    // Marked for review -> toggled off -> Not answered
    expect(getNextQuestionStatus('marked_for_review', 'TOGGLE_MARK_REVIEW', false)).toBe('not_answered');
    // Answered -> Marked for review -> Answered & marked
    expect(getNextQuestionStatus('answered', 'TOGGLE_MARK_REVIEW', true)).toBe('answered_marked_for_review');
    // Answered & marked -> toggled off -> Answered
    expect(getNextQuestionStatus('answered_marked_for_review', 'TOGGLE_MARK_REVIEW', true)).toBe('answered');
  });
});

