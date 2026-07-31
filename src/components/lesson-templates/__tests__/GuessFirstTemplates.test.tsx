import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ConceptFlow,
  DiagnoseMechanism,
  SpotFlaw,
  SequenceIt,
  BuildIt,
  type BuildItProps,
  EvidenceStack,
  PredictNumber,
  PromptBuild,
  type PromptBuildProps,
} from '../GuessFirstTemplates';

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

describe('BuildIt', () => {
  const props: BuildItProps = {
    intro: 'Construct a configuration object for your CI pipeline.',
    objectName: 'pipelineConfig',
    fields: [
      {
        key: 'runtime',
        prompt: 'Which language runtime should be used?',
        options: [{ label: 'Node.js', value: 'node' }, { label: 'Python', value: 'python' }],
        correctValue: 'node',
        feedback: { node: 'Matches this project\'s existing stack.', python: 'Not aligned with the codebase.' },
      },
      {
        key: 'testCommand',
        prompt: 'What is the test command?',
        options: [{ label: 'npm test', value: 'npm-test' }, { label: 'make test', value: 'make-test' }],
        correctValue: 'npm-test',
        feedback: { 'npm-test': 'Matches package.json scripts.', 'make-test': 'Not configured for this project.' },
      },
    ],
    synthesis: 'This object drives the entire build process across environments.',
  };

  it('shows only the first field until it is answered', () => {
    render(<BuildIt {...props} />);
    expect(screen.getByText(/Which language runtime should be used\?/)).toBeInTheDocument();
    expect(screen.queryByText(/What is the test command\?/)).not.toBeInTheDocument();
  });

  it('gives field-specific feedback, then updates the live preview once advanced', async () => {
    render(<BuildIt {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Node.js' }));
    expect(screen.getByText(/Matches this project's existing stack/)).toBeInTheDocument();
    expect(screen.queryByText(/What is the test command\?/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Next field/ }));
    expect(screen.getByText(/What is the test command\?/)).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.tagName === 'CODE' && /runtime:\s*"node"/.test(el.textContent ?? ''))).toBeInTheDocument();
  });

  it('only reveals the synthesis panel once every field is answered', async () => {
    render(<BuildIt {...props} />);
    expect(screen.queryByText(/entire build process/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Node.js' }));
    await userEvent.click(screen.getByRole('button', { name: /Next field/ }));
    expect(screen.queryByText(/entire build process/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'npm test' }));
    expect(screen.getByText(/entire build process/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Next field/ })).not.toBeInTheDocument();
  });
});

describe('EvidenceStack', () => {
  const props = {
    scenario: "A React app crashes on mount with `Cannot resolve module './utils'`.",
    question: 'Select every fact relevant to diagnosing this crash.',
    items: [
      { value: 'missing-file', label: 'The file src/utils.ts is missing from the repo', applicable: true },
      { value: 'wrong-ext', label: 'Imports use .js but source files are .ts', applicable: true },
      { value: 'cache', label: 'The webpack cache was cleared and rebuilt', applicable: false },
    ],
    explanation: {
      'missing-file': 'A missing file is a direct cause of "cannot resolve module".',
      'wrong-ext': 'A mismatched extension also breaks module resolution.',
      cache: 'Clearing the cache would not cause a missing-module error.',
    },
    synthesis: 'Verify the imported file exists and the extension matches before suspecting tooling.',
  };

  it('shows no feedback and unchecked checkboxes before submitting', () => {
    render(<EvidenceStack {...props} />);
    expect(screen.queryByText(/direct cause of/)).not.toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(props.items.length);
    checkboxes.forEach((cb) => expect(cb).toHaveAttribute('aria-checked', 'false'));
  });

  it('reveals per-item explanations only after Check my answers', async () => {
    render(<EvidenceStack {...props} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /missing from the repo/ }));
    expect(screen.queryByText(/direct cause of/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Check my answers/ }));
    expect(screen.getByText(/direct cause of/)).toBeInTheDocument();
  });

  it('marks an applicable item the learner did not select as missed, not as silently correct', async () => {
    render(<EvidenceStack {...props} />);
    // Select only one of the two applicable items — leave "wrong-ext" unchecked.
    await userEvent.click(screen.getByRole('checkbox', { name: /missing from the repo/ }));
    await userEvent.click(screen.getByRole('button', { name: /Check my answers/ }));
    expect(screen.getByText('MISSED')).toBeInTheDocument();
  });

  it('does not flag an inapplicable, unselected item as incorrect', async () => {
    render(<EvidenceStack {...props} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /missing from the repo/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /wrong-ext|Imports use \.js/ }));
    await userEvent.click(screen.getByRole('button', { name: /Check my answers/ }));
    // "cache" is inapplicable and correctly left unselected — should read EXCLUDED, never INCORRECT.
    expect(screen.queryByText('INCORRECT')).not.toBeInTheDocument();
    expect(screen.getByText('EXCLUDED')).toBeInTheDocument();
  });
});

describe('PredictNumber', () => {
  const props = {
    scenario: 'The following code computes an average of [10, 20, 30, 40].',
    question: 'What numeric value does `result` hold?',
    actualValue: '25',
    explanation: 'Sum is 100, count is 4 → 100 / 4 = 25.',
  };

  it('disables Reveal answer until the learner types something', async () => {
    render(<PredictNumber {...props} />);
    const revealBtn = screen.getByRole('button', { name: /Reveal answer/ });
    expect(revealBtn).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox'), '50');
    expect(revealBtn).toBeEnabled();
  });

  it('shows the prediction and the actual value without grading it right or wrong', async () => {
    render(<PredictNumber {...props} />);
    await userEvent.type(screen.getByRole('textbox'), '50');
    await userEvent.click(screen.getByRole('button', { name: /Reveal answer/ }));

    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.queryByText(/\bcorrect\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bincorrect\b/i)).not.toBeInTheDocument();
  });
});

describe('PromptBuild', () => {
  const props: PromptBuildProps = {
    intro: 'Build a prompt asking Claude for a login form component.',
    fields: [
      {
        key: 'context',
        question: 'What context should you give Claude first?',
        options: [
          { label: 'State the tech stack', value: "I'm building a React app with TypeScript and Tailwind CSS." },
          { label: 'Say nothing', value: '' },
        ],
        correctValue: "I'm building a React app with TypeScript and Tailwind CSS.",
        feedback: {
          "I'm building a React app with TypeScript and Tailwind CSS.": 'This tells Claude what to target.',
          '': 'Without this, Claude has to guess your stack.',
        },
      },
      {
        key: 'task',
        question: 'What should the task line say?',
        options: [
          { label: 'Vague request', value: 'write a login form' },
          { label: 'Specific requirements', value: 'I need a login form with email + password inputs and inline validation.' },
        ],
        correctValue: 'I need a login form with email + password inputs and inline validation.',
        feedback: {
          'write a login form': 'Too vague — Claude will guess at the requirements.',
          'I need a login form with email + password inputs and inline validation.': 'Specific and testable.',
        },
      },
    ],
    synthesis: 'Context plus specific requirements is what turns a guess into working code.',
  };

  it('reveals the task field only after the context field is answered', async () => {
    render(<PromptBuild {...props} />);
    expect(screen.getByText(/What context should you give Claude first\?/)).toBeInTheDocument();
    expect(screen.queryByText(/What should the task line say\?/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'State the tech stack' }));
    await userEvent.click(screen.getByRole('button', { name: /Next field/ }));
    expect(screen.getByText(/What should the task line say\?/)).toBeInTheDocument();
  });

  it('assembles the chosen prompt fragments into the live preview, not JSON', async () => {
    render(<PromptBuild {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'State the tech stack' }));
    await userEvent.click(screen.getByRole('button', { name: /Next field/ }));
    expect(screen.getByText(/I'm building a React app with TypeScript and Tailwind CSS\./)).toBeInTheDocument();
  });

  it('shows the synthesis panel only once every field is answered', async () => {
    render(<PromptBuild {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'State the tech stack' }));
    await userEvent.click(screen.getByRole('button', { name: /Next field/ }));
    expect(screen.queryByText(/turns a guess into working code/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Specific requirements' }));
    expect(screen.getByText(/turns a guess into working code/)).toBeInTheDocument();
  });
});
