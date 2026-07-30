import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConceptFlow, DiagnoseMechanism, SpotFlaw, SequenceIt } from '../GuessFirstTemplates';

describe('ConceptFlow', () => {
  const props = {
    scenario: 'Given this error: `ReferenceError: Cannot access total before initialization`',
    question: 'Which error type is this?',
    options: [
      { label: 'ReferenceError', value: 'reference' },
      { label: 'TypeError', value: 'type' },
    ],
    correctValue: 'reference',
    feedback: {
      reference: 'Correct family — this is a ReferenceError.',
      type: 'Not quite — a TypeError happens when a value is used the wrong way, not when a variable does not exist yet.',
    },
    concept: 'ReferenceError means the variable does not exist (yet) in the current scope.',
  };

  it('does not reveal feedback or concept before a choice is made', () => {
    render(<ConceptFlow {...props} />);
    expect(screen.queryByText(/Correct family/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ReferenceError means/)).not.toBeInTheDocument();
  });

  it('shows choice-specific feedback after picking an option, then reveals the concept on Continue', async () => {
    render(<ConceptFlow {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'TypeError' }));
    expect(screen.getByText(/Not quite/)).toBeInTheDocument();
    expect(screen.queryByText(/ReferenceError means/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByText(/ReferenceError means/)).toBeInTheDocument();
  });

  it('locks further selection after a choice is made', async () => {
    render(<ConceptFlow {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'ReferenceError' }));
    expect(screen.queryByRole('button', { name: 'TypeError' })).not.toBeInTheDocument();
  });
});

describe('DiagnoseMechanism', () => {
  const props = {
    scenario: 'Code declares `total` with `const` further down but reads it earlier.',
    question: 'What most likely caused this?',
    options: [
      { label: 'Never declared', value: 'never' },
      { label: 'Used before declaration line runs', value: 'tdz' },
    ],
    correctValue: 'tdz',
    feedback: {
      never: 'If it were never declared you would see a plain "is not defined" message, not "before initialization".',
      tdz: 'Right — this is the temporal dead zone.',
    },
    mechanism: 'const/let are hoisted but not initialized until their declaration line runs.',
  };

  it('reveals mechanism only after Continue is clicked', async () => {
    render(<DiagnoseMechanism {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Used before declaration line runs' }));
    expect(screen.getByText(/temporal dead zone/)).toBeInTheDocument();
    expect(screen.queryByText(/hoisted but not initialized/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByText(/hoisted but not initialized/)).toBeInTheDocument();
  });
});

describe('SpotFlaw', () => {
  const props = {
    code: "const freeUser = users.find(u => u.plan === 'team');\nconsole.log(freeUser.name);",
    question: 'Which line causes the crash?',
    options: [
      { label: 'The find() call', value: 'find-line' },
      { label: 'The console.log call', value: 'log-line' },
    ],
    correctValue: 'log-line',
    feedback: {
      'find-line': 'find() itself never throws — it just returns undefined when nothing matches.',
      'log-line': 'Right — accessing .name on the undefined result is what throws.',
    },
    flawExplanation: 'find() returns undefined when no element matches, and undefined.name throws a TypeError.',
  };

  it('renders the code as literal text', () => {
    render(<SpotFlaw {...props} />);
    expect(screen.getByText(/users\.find/)).toBeInTheDocument();
  });

  it('ties feedback to the specific option picked, then reveals the full explanation', async () => {
    render(<SpotFlaw {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'The find() call' }));
    expect(screen.getByText(/find\(\) itself never throws/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByText(/undefined\.name throws a TypeError/)).toBeInTheDocument();
  });
});

describe('SequenceIt', () => {
  const props = {
    question: 'Order the debugging steps.',
    steps: ['Read the error message', 'Add a console.log', 'Ask Claude with error + code + expected', 'Apply and verify the fix'],
    explanation: 'console.log before asking Claude narrows the problem so your prompt is specific.',
  };

  it('renders all four steps in some order and reveals explanation after checking', async () => {
    render(<SequenceIt {...props} />);
    for (const step of props.steps) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
    expect(screen.queryByText(/narrows the problem/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Check my order/ }));
    expect(screen.getByText(/narrows the problem/)).toBeInTheDocument();
  });

  it('lets the learner reorder via up/down before checking', async () => {
    render(<SequenceIt {...props} />);
    const upButtons = screen.getAllByRole('button', { name: /Move .* up/ });
    // First item's "up" button should be disabled (already at top)
    expect(upButtons[0]).toBeDisabled();
  });
});
