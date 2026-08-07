import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  WorkedExample,
  type WorkedExampleProps,
  RetrievalCheck,
  type RetrievalCheckProps,
  CaseSim,
  type CaseSimProps,
  LabBrief,
  type LabBriefProps,
} from '../DepthTemplates';

describe('WorkedExample', () => {
  const props: WorkedExampleProps = {
    problem: 'An AI tool wrote a query that interpolates a username into SQL. Make it safe.',
    steps: [
      { label: 'Find the untrusted input', work: '`username` comes from the login form.', why: 'Anything a user can type is untrusted until proven otherwise.' },
      { label: 'Move it out of the SQL string', work: 'Pass it as a bound parameter.', why: 'The driver keeps data and syntax on separate channels.' },
    ],
    faded: {
      problem: 'A second query interpolates an order id into SQL.',
      blanks: [
        { prompt: 'Which value is untrusted here?', answer: 'order_id', accept: ['orderId'], why: 'It arrives on the request path.' },
        { prompt: 'What replaces the interpolation?', answer: 'a bound parameter', why: 'Same mechanism as the worked example.' },
      ],
    },
    procedure: 'Identify untrusted input, then bind it rather than concatenate it.',
  };

  it('reveals worked steps one at a time rather than all at once', async () => {
    render(<WorkedExample {...props} />);
    expect(screen.getByText('Find the untrusted input')).toBeInTheDocument();
    expect(screen.queryByText('Move it out of the SQL string')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Next step/ }));
    expect(screen.getByText('Move it out of the SQL string')).toBeInTheDocument();
  });

  it('does not offer the faded round until every worked step has been seen', async () => {
    render(<WorkedExample {...props} />);
    expect(screen.queryByRole('button', { name: /Try it yourself/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Next step/ }));
    expect(screen.getByRole('button', { name: /Try it yourself/ })).toBeInTheDocument();
  });

  async function enterFadedRound() {
    await userEvent.click(screen.getByRole('button', { name: /Next step/ }));
    await userEvent.click(screen.getByRole('button', { name: /Try it yourself/ }));
  }

  it('accepts an alternative spelling of the answer as correct', async () => {
    render(<WorkedExample {...props} />);
    await enterFadedRound();

    await userEvent.type(screen.getByLabelText(/Which value is untrusted here\?/), 'OrderId');
    await userEvent.click(screen.getByRole('button', { name: 'Check this step' }));

    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText(/It arrives on the request path/)).toBeInTheDocument();
  });

  it('lets the learner ask for a step without answering first, and says it was shown', async () => {
    render(<WorkedExample {...props} />);
    await enterFadedRound();

    await userEvent.click(screen.getByRole('button', { name: 'Show me this step' }));
    expect(screen.getByText('Shown')).toBeInTheDocument();
    // Moved on to the second blank rather than dead-ending.
    expect(screen.getByLabelText(/What replaces the interpolation\?/)).toBeInTheDocument();
  });

  it('reports how many steps were worked unaided and reveals the general procedure', async () => {
    render(<WorkedExample {...props} />);
    await enterFadedRound();

    await userEvent.type(screen.getByLabelText(/Which value is untrusted here\?/), 'order_id');
    await userEvent.click(screen.getByRole('button', { name: 'Check this step' }));
    await userEvent.click(screen.getByRole('button', { name: 'Show me this step' }));

    expect(screen.getByText(/You worked 1 of 2 steps unaided/)).toBeInTheDocument();
    expect(screen.getByText(/Identify untrusted input, then bind it/)).toBeInTheDocument();
  });

  it('offers a no-penalty restart once the faded round is finished', async () => {
    render(<WorkedExample {...props} />);
    await enterFadedRound();
    await userEvent.click(screen.getByRole('button', { name: 'Show me this step' }));
    await userEvent.click(screen.getByRole('button', { name: 'Show me this step' }));

    await userEvent.click(screen.getByRole('button', { name: /Run it again/ }));
    expect(screen.queryByText(/Identify untrusted input, then bind it/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next step/ })).toBeInTheDocument();
  });
});

describe('RetrievalCheck', () => {
  const props: RetrievalCheckProps = {
    questions: [
      {
        from: 'Module 1 — Directing, not typing',
        prompt: 'What makes a spec executable?',
        options: [
          { value: 'testable', label: 'It states a checkable outcome' },
          { value: 'long', label: 'It is long' },
        ],
        correctValue: 'testable',
        explanation: 'A spec is executable when you can tell from the output alone whether it was met.',
      },
      {
        from: 'Module 2 — Reviewing AI-generated code',
        prompt: 'Why are string-built queries dangerous?',
        options: [
          { value: 'channels', label: 'Data and SQL syntax share one channel' },
          { value: 'slow', label: 'They run slowly' },
        ],
        correctValue: 'channels',
        explanation: 'Once concatenated, the database cannot tell typed data from command syntax.',
      },
    ],
  };

  it('names which module each question is retrieving from', () => {
    render(<RetrievalCheck {...props} />);
    expect(screen.getByText(/from Module 1 — Directing, not typing/)).toBeInTheDocument();
  });

  it('frames the check as ungraded and untimed by default', () => {
    render(<RetrievalCheck {...props} />);
    expect(screen.getByText(/Nothing here is graded, nothing is timed/)).toBeInTheDocument();
  });

  it('shows one question at a time and advances only on request', async () => {
    render(<RetrievalCheck {...props} />);
    expect(screen.getByText('What makes a spec executable?')).toBeInTheDocument();
    expect(screen.queryByText('Why are string-built queries dangerous?')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'It states a checkable outcome' }));
    expect(screen.getByText('What makes a spec executable?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Next question/ }));
    expect(screen.getByText('Why are string-built queries dangerous?')).toBeInTheDocument();
  });

  it('summarises what stuck and lists only the modules that were missed', async () => {
    render(<RetrievalCheck {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'It is long' }));
    await userEvent.click(screen.getByRole('button', { name: /Next question/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Data and SQL syntax share one channel' }));
    await userEvent.click(screen.getByRole('button', { name: /Finish check/ }));

    expect(screen.getByText(/1 of 2 came back to you/)).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('Module 1 — Directing, not typing');
    expect(screen.queryByText('Module 2 — Reviewing AI-generated code')).not.toBeInTheDocument();
  });

  it('says nothing needs revisiting when everything came back', async () => {
    render(<RetrievalCheck {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'It states a checkable outcome' }));
    await userEvent.click(screen.getByRole('button', { name: /Next question/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Data and SQL syntax share one channel' }));
    await userEvent.click(screen.getByRole('button', { name: /Finish check/ }));

    expect(screen.getByText(/All of it held/)).toBeInTheDocument();
  });
});

describe('CaseSim', () => {
  const props: CaseSimProps = {
    title: 'The Friday deploy',
    opening: 'A client wants an AI-written migration shipped before the weekend.',
    start: 'n1',
    nodes: {
      n1: {
        situation: 'The migration drops a column. The AI says it is unused.',
        question: 'What do you do first?',
        choices: [
          { value: 'verify', label: 'Check the column is really unused', consequence: 'You find two dashboards reading it.', nextNode: 'n2' },
          { value: 'ship', label: 'Ship it — the AI checked', consequence: 'Two dashboards break overnight.', ending: 'bad' },
        ],
      },
      n2: {
        situation: 'The dashboards need the column.',
        question: 'What now?',
        choices: [
          { value: 'stage', label: 'Deprecate first, drop next release', consequence: 'Nothing breaks.', ending: 'good' },
        ],
      },
    },
    endings: {
      good: { verdict: 'good', summary: 'Nothing broke.', lesson: 'Verification cost ten minutes.' },
      bad: { verdict: 'costly', summary: 'A weekend incident.', lesson: 'The AI checked syntax, not usage.' },
    },
  };

  it('shows the opening decision without revealing later nodes or endings', () => {
    render(<CaseSim {...props} />);
    expect(screen.getByText('What do you do first?')).toBeInTheDocument();
    expect(screen.queryByText('What now?')).not.toBeInTheDocument();
    expect(screen.queryByText(/A weekend incident/)).not.toBeInTheDocument();
  });

  it('records each decision and its consequence in a running trail', async () => {
    render(<CaseSim {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /Check the column is really unused/ }));

    expect(screen.getByText('What you decided')).toBeInTheDocument();
    expect(screen.getByText(/You find two dashboards reading it/)).toBeInTheDocument();
    expect(screen.getByText('What now?')).toBeInTheDocument();
  });

  it('states the ending verdict in words, not only colour', async () => {
    render(<CaseSim {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /Ship it/ }));

    expect(screen.getByText('This was costly')).toBeInTheDocument();
    expect(screen.getByText(/The AI checked syntax, not usage/)).toBeInTheDocument();
  });

  it('marks a choice as already tried on replay so a second run explores', async () => {
    render(<CaseSim {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /Ship it/ }));
    await userEvent.click(screen.getByRole('button', { name: /Run it again/ }));

    expect(screen.getByRole('button', { name: /Ship it.*tried before/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Check the column is really unused$/ })).toBeInTheDocument();
  });
});

describe('LabBrief', () => {
  const props: LabBriefProps = {
    labId: 'test-lab-1',
    title: 'Review a migration PR',
    brief: 'A colleague opened a PR generated end-to-end by an AI tool.',
    deliverable: 'A review comment listing every blocking issue with a suggested fix.',
    stages: [
      { title: 'Read the diff', minutes: 10, instructions: 'Read it once without commenting.', checkpoint: 'You can state what the PR changes in one sentence.' },
      { title: 'Write the review', minutes: 20, instructions: 'One comment per blocking issue.', checkpoint: 'Every blocking issue has a suggested fix.' },
    ],
    rubric: [
      { criterion: 'Every blocking issue is named', meets: 'Nothing that would break production is left unmentioned.' },
      { criterion: 'Each issue has a fix', meets: 'A reviewer could act on the comment without asking a follow-up.' },
    ],
  };

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the rubric before any work starts', () => {
    render(<LabBrief {...props} />);
    expect(screen.getByText('Every blocking issue is named')).toBeInTheDocument();
    expect(screen.getByText(/Nothing that would break production/)).toBeInTheDocument();
  });

  it('states the total time and how much is left as stages are ticked off', async () => {
    render(<LabBrief {...props} />);
    expect(screen.getByText(/30 min across 2 stages/)).toBeInTheDocument();
    expect(screen.getByText(/About 30 min left/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: /Read the diff/ }));
    expect(screen.getByText(/About 20 min left/)).toBeInTheDocument();
  });

  it('tells the learner they can stop after any stage', () => {
    render(<LabBrief {...props} />);
    expect(screen.getByText(/Stop after any stage — your place is saved/)).toBeInTheDocument();
  });

  it('restores ticked stages from storage on a later visit', async () => {
    const { unmount } = render(<LabBrief {...props} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /Read the diff/ }));
    unmount();

    render(<LabBrief {...props} />);
    expect(screen.getByRole('checkbox', { name: /Read the diff/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Write the review/ })).not.toBeChecked();
  });

  it('survives corrupted stored state instead of crashing the lesson', () => {
    window.localStorage.setItem('srs.lab.test-lab-1', '{ not json');
    render(<LabBrief {...props} />);
    expect(screen.getByRole('checkbox', { name: /Read the diff/ })).not.toBeChecked();
  });

  it('names the criteria still to fix after a self-check', async () => {
    render(<LabBrief {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /Self-check before you submit/ }));

    const groups = screen.getAllByRole('group');
    await userEvent.click(within(groups[0]).getByRole('button', { name: /Meets this/ }));
    await userEvent.click(within(groups[1]).getByRole('button', { name: /Not yet/ }));

    expect(screen.getByText(/1 criterion to fix before this is done/)).toBeInTheDocument();
  });
});
