/* ─── Depth lesson templates ───
 * The four interactive section types the 100-hour track architecture needs
 * and the guess-first set doesn't cover. See docs/CURRICULUM_ARCHITECTURE_100H.md.
 *
 *   WorkedExample   step 4 of the pod cycle — a fully worked procedure, then
 *                   the same procedure with steps blanked out (the fading
 *                   effect: worked examples alone give no retrieval, blank
 *                   problems alone overload a learner new to the domain).
 *   RetrievalCheck  the 10-minute end-of-module checkpoint. Ungraded,
 *                   untimed, and it names which module each question came
 *                   from so spacing is visible rather than implied.
 *   CaseSim         a branching scenario where decisions compound. The point
 *                   is the second run-through: the path you took is marked,
 *                   so replay explores instead of repeating.
 *   LabBrief        a staged, resumable applied lab with the rubric shown
 *                   BEFORE the work starts and a self-check against that same
 *                   rubric before submission.
 *
 * Accessibility contract is inherited from ./shared — 48px touch targets,
 * focus moved onto every revealed panel, verdicts as real text rather than a
 * colour wash, and no dead ends. Nothing here is timed and nothing here is
 * lost by stopping halfway.
 */
import { useCallback, useId, useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import { markdownComponents } from './markdownComponents';
import {
  MIN_TOUCH,
  optionButtonStyle,
  primaryActionButtonStyle,
  questionBandStyle,
  questionBlockFocusStyle,
  revealPanelFocusStyle,
  secondaryActionButtonStyle,
  templateFrameStyle,
  useRevealFocus,
  useReturnFocus,
  visuallyHidden,
} from './a11y';
import { PanelLabel, TryAgainButton, Verdict } from './shared';

const panelStyle = (background: string): React.CSSProperties => ({
  ...revealPanelFocusStyle,
  padding: 'var(--space-lg) var(--space-xl)',
  background,
  borderTop: '1px solid var(--bg-border)',
});

const CORRECT_WASH = 'rgba(90,158,106,0.05)';
const NEUTRAL_WASH = 'rgba(90,140,196,0.06)';
const NOT_QUITE_WASH = 'rgba(196,107,58,0.05)';

/** Answers are compared on meaning-preserving normalisation only: case,
 * surrounding whitespace, and collapsed internal runs. Nothing cleverer —
 * a learner who typed the right thing with a different capitalisation is
 * right, and a learner who typed something else is not going to be rescued
 * by fuzzy matching, only confused by it. */
function normalise(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function matches(given: string, answer: string, accept?: string[]): boolean {
  const g = normalise(given);
  if (!g) return false;
  return [answer, ...(accept ?? [])].some((candidate) => normalise(candidate) === g);
}

/* ══════════════════════════════════════════════════════════════
   1. WorkedExample — fully worked, then faded
   ══════════════════════════════════════════════════════════════ */

export interface WorkedStep {
  /** Short name for the step, e.g. "Find the untrusted input". */
  label: string;
  /** What is actually done at this step — markdown, may hold code. */
  work: string;
  /** Why this step, not a different one. This is the part that transfers;
   * a worked example without it teaches the answer, not the procedure. */
  why: string;
}

export interface FadedBlank {
  /** What the learner is being asked to supply at this step. */
  prompt: string;
  answer: string;
  /** Alternative spellings/phrasings that are equally right. */
  accept?: string[];
  /** Shown once the step is resolved, whichever way it went. */
  why: string;
}

export interface WorkedExampleProps {
  /** The problem the worked example solves — markdown. */
  problem: string;
  steps: WorkedStep[];
  /** A second problem of the same shape, with steps for the learner to fill. */
  faded: {
    problem: string;
    blanks: FadedBlank[];
  };
  /** Closing statement of the procedure in general form. */
  procedure: string;
}

export function WorkedExample({ problem, steps, faded, procedure }: WorkedExampleProps) {
  // Phase 1: study — steps revealed one at a time.
  const [revealedSteps, setRevealedSteps] = useState(1);
  const [phase, setPhase] = useState<'study' | 'practice' | 'done'>('study');
  // Phase 2: practice — one blank at a time, each either answered or shown.
  const [blankIndex, setBlankIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [outcomes, setOutcomes] = useState<Array<'correct' | 'not-quite' | 'shown'>>([]);

  const inputId = useId();
  const practiceRef = useRevealFocus<HTMLDivElement>(phase === 'practice');
  const doneRef = useRevealFocus<HTMLDivElement>(phase === 'done');
  const studyRef = useReturnFocus<HTMLDivElement>(phase === 'study' && revealedSteps === 1);

  const allStepsShown = revealedSteps >= steps.length;
  const currentBlank = faded.blanks[blankIndex];

  function reset() {
    setRevealedSteps(1);
    setPhase('study');
    setBlankIndex(0);
    setDraft('');
    setOutcomes([]);
  }

  function resolveBlank(outcome: 'correct' | 'not-quite' | 'shown') {
    const next = [...outcomes, outcome];
    setOutcomes(next);
    setDraft('');
    if (blankIndex + 1 >= faded.blanks.length) setPhase('done');
    else setBlankIndex(blankIndex + 1);
  }

  const solvedUnaided = outcomes.filter((o) => o === 'correct').length;

  return (
    <div style={templateFrameStyle}>
      <div style={questionBandStyle}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.125rem', flexShrink: 0 }} aria-hidden="true">🧩</span>
          <div ref={studyRef} tabIndex={-1} style={questionBlockFocusStyle}>
            <PanelLabel color="var(--gold)">Worked example</PanelLabel>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
              <Markdown components={markdownComponents}>{problem}</Markdown>
            </div>
          </div>
        </div>
      </div>

      {/* ── Phase 1: study the worked steps ── */}
      <div style={panelStyle(NEUTRAL_WASH)}>
        <ol style={{ margin: 0, paddingLeft: 'var(--space-xl)', color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
          {steps.slice(0, revealedSteps).map((step, i) => (
            <li key={i} style={{ marginBottom: 'var(--space-lg)' }}>
              <p style={{ margin: '0 0 var(--space-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>{step.label}</p>
              <Markdown components={markdownComponents}>{step.work}</Markdown>
              <div style={{ marginTop: 'var(--space-sm)', paddingLeft: 'var(--space-md)', borderLeft: '2px solid var(--bg-border)' }}>
                <PanelLabel>Why this step</PanelLabel>
                <Markdown components={markdownComponents}>{step.why}</Markdown>
              </div>
            </li>
          ))}
        </ol>

        {phase === 'study' && !allStepsShown && (
          <button onClick={() => setRevealedSteps(revealedSteps + 1)} style={primaryActionButtonStyle}>
            Next step →<span style={visuallyHidden}>{` (step ${revealedSteps + 1} of ${steps.length})`}</span>
          </button>
        )}

        {phase === 'study' && allStepsShown && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, marginTop: 0 }}>
              Now the same procedure on a different problem — this time you supply the steps.
            </p>
            <button onClick={() => setPhase('practice')} style={primaryActionButtonStyle}>
              Try it yourself →
            </button>
          </>
        )}
      </div>

      {/* ── Phase 2: the faded round ── */}
      {phase !== 'study' && (
        <div ref={practiceRef} tabIndex={-1} style={panelStyle('transparent')}>
          <PanelLabel color="var(--gold)">Your turn</PanelLabel>
          <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: 'var(--space-lg)' }}>
            <Markdown components={markdownComponents}>{faded.problem}</Markdown>
          </div>

          <ol style={{ margin: 0, paddingLeft: 'var(--space-xl)', color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
            {faded.blanks.slice(0, outcomes.length).map((blank, i) => (
              <li key={i} style={{ marginBottom: 'var(--space-lg)' }}>
                <p style={{ margin: '0 0 var(--space-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>{blank.prompt}</p>
                {outcomes[i] === 'correct' ? (
                  <Verdict correct />
                ) : outcomes[i] === 'shown' ? (
                  <PanelLabel>Shown</PanelLabel>
                ) : (
                  <Verdict correct={false} />
                )}
                <p style={{ margin: '0 0 var(--space-xs)' }}>
                  <strong>{blank.answer}</strong>
                </p>
                <Markdown components={markdownComponents}>{blank.why}</Markdown>
              </li>
            ))}
          </ol>

          {phase === 'practice' && currentBlank && (
            <div style={{ marginTop: outcomes.length ? 'var(--space-md)' : 0 }}>
              <label htmlFor={inputId} style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                Step {blankIndex + 1} of {faded.blanks.length}: {currentBlank.prompt}
              </label>
              <input
                id={inputId}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && draft.trim()) {
                    e.preventDefault();
                    resolveBlank(matches(draft, currentBlank.answer, currentBlank.accept) ? 'correct' : 'not-quite');
                  }
                }}
                style={{
                  width: '100%',
                  minHeight: MIN_TOUCH,
                  padding: '12px 16px',
                  fontSize: '0.9375rem',
                  fontFamily: 'inherit',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--space-md)',
                }}
              />
              <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                <button
                  onClick={() => resolveBlank(matches(draft, currentBlank.answer, currentBlank.accept) ? 'correct' : 'not-quite')}
                  disabled={!draft.trim()}
                  style={{ ...primaryActionButtonStyle, opacity: draft.trim() ? 1 : 0.5, cursor: draft.trim() ? 'pointer' : 'not-allowed' }}
                >
                  Check this step
                </button>
                {/* No penalty, and deliberately not hidden behind a wrong answer
                 * first: on a bad day, being made to guess before you're allowed
                 * to see the step is just a tax. */}
                <button onClick={() => resolveBlank('shown')} style={secondaryActionButtonStyle}>
                  Show me this step
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── The procedure, in general form ── */}
      {phase === 'done' && (
        <div ref={doneRef} tabIndex={-1} style={panelStyle(CORRECT_WASH)}>
          <div aria-live="polite">
            <PanelLabel color="var(--success)">The procedure</PanelLabel>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: '0 0 var(--space-md)' }}>
              You worked {solvedUnaided} of {faded.blanks.length} steps unaided. Steps you asked to see are
              worth re-running later — that is what the next checkpoint is for.
            </p>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
              <Markdown components={markdownComponents}>{procedure}</Markdown>
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <TryAgainButton onClick={reset} label="Run it again ↺" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   2. RetrievalCheck — the spaced end-of-module checkpoint
   ══════════════════════════════════════════════════════════════ */

export interface RetrievalQuestion {
  /** Where this came from, shown to the learner: "Module 2 — Reviewing AI
   * output". Spacing the learner can see is spacing they trust. */
  from: string;
  prompt: string;
  options: Array<{ value: string; label: string }>;
  correctValue: string;
  explanation: string;
}

export interface RetrievalCheckProps {
  title?: string;
  /** Deliberately low-stakes framing. Defaults to the house wording. */
  framing?: string;
  questions: RetrievalQuestion[];
}

const DEFAULT_FRAMING =
  "Let's see what stuck. Nothing here is graded, nothing is timed, and getting one wrong just means it comes back in a later check — which is the whole point.";

export function RetrievalCheck({ title = 'Retrieval check', framing = DEFAULT_FRAMING, questions }: RetrievalCheckProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  /* Separate from `results.length === questions.length` on purpose. Deriving
   * it meant the summary replaced the final question the instant it was
   * answered, so the explanation for the last item — the one most likely to be
   * the spaced, long-interval pull — was the only one the learner never got to
   * read. The learner leaves the last question when they say so. */
  const [finished, setFinished] = useState(false);

  const feedbackRef = useRevealFocus<HTMLDivElement>(selected !== null);
  const summaryRef = useRevealFocus<HTMLDivElement>(finished);
  const questionRef = useReturnFocus<HTMLDivElement>(index === 0 && selected === null && results.length === 0);

  const current = questions[index];
  const isLast = index + 1 === questions.length;

  function choose(value: string) {
    setSelected(value);
    setResults((prev) => [...prev, value === questions[index].correctValue]);
  }

  function advance() {
    if (isLast) {
      setFinished(true);
      return;
    }
    setSelected(null);
    setIndex((i) => i + 1);
  }

  function reset() {
    setIndex(0);
    setSelected(null);
    setResults([]);
    setFinished(false);
  }

  const missed = useMemo(
    () => questions.filter((_, i) => results[i] === false).map((q) => q.from),
    [questions, results],
  );
  const uniqueMissed = useMemo(() => Array.from(new Set(missed)), [missed]);

  return (
    <div style={templateFrameStyle}>
      <div style={questionBandStyle}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.125rem', flexShrink: 0 }} aria-hidden="true">🔁</span>
          <div ref={questionRef} tabIndex={-1} style={questionBlockFocusStyle}>
            <PanelLabel color="var(--gold)">{title}</PanelLabel>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, margin: 0 }}>{framing}</p>
          </div>
        </div>
      </div>

      {!finished && current && (
        <div style={panelStyle('transparent')}>
          <p style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)', fontSize: '0.75rem', margin: '0 0 var(--space-xs)' }}>
            Question {index + 1} of {questions.length} · from {current.from}
          </p>
          <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, margin: '0 0 var(--space-lg)' }}>{current.prompt}</p>

          {!selected && (
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              {current.options.map((option) => (
                <button key={option.value} onClick={() => choose(option.value)} style={optionButtonStyle}>
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div
              ref={feedbackRef}
              tabIndex={-1}
              style={{
                ...revealPanelFocusStyle,
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-sm)',
                background: selected === current.correctValue ? CORRECT_WASH : NOT_QUITE_WASH,
              }}
            >
              <div aria-live="polite" style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                <Verdict correct={selected === current.correctValue} />
                <Markdown components={markdownComponents}>{current.explanation}</Markdown>
              </div>
              <button onClick={advance} style={{ ...primaryActionButtonStyle, marginTop: 'var(--space-lg)' }}>
                {isLast ? 'Finish check →' : 'Next question →'}
              </button>
            </div>
          )}
        </div>
      )}

      {finished && (
        <div ref={summaryRef} tabIndex={-1} style={panelStyle(NEUTRAL_WASH)}>
          <div aria-live="polite" style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
            <PanelLabel>What stuck</PanelLabel>
            <p style={{ margin: '0 0 var(--space-md)' }}>
              {results.filter(Boolean).length} of {questions.length} came back to you.{' '}
              {uniqueMissed.length === 0
                ? 'All of it held. Nothing to revisit before the next module.'
                : 'The rest is not lost — it just needs another pass.'}
            </p>
            {uniqueMissed.length > 0 && (
              <>
                <p style={{ margin: '0 0 var(--space-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>Worth another look:</p>
                <ul style={{ margin: '0 0 var(--space-md)', paddingLeft: 'var(--space-xl)' }}>
                  {uniqueMissed.map((from) => (
                    <li key={from}>{from}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <TryAgainButton onClick={reset} label="Run the check again ↺" />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   3. CaseSim — branching scenario where decisions compound
   ══════════════════════════════════════════════════════════════ */

export interface CaseChoice {
  value: string;
  label: string;
  /** What happens as a result — shown before the next decision. */
  consequence: string;
  /** Exactly one of these. `nextNode` continues, `ending` stops. */
  nextNode?: string;
  ending?: string;
}

export interface CaseNode {
  situation: string;
  question: string;
  choices: CaseChoice[];
}

export interface CaseEnding {
  /** `good` / `mixed` / `costly` — stated in words as well as colour. */
  verdict: 'good' | 'mixed' | 'costly';
  summary: string;
  /** What this run teaches, including what a different path would have cost. */
  lesson: string;
}

export interface CaseSimProps {
  title: string;
  opening: string;
  start: string;
  nodes: Record<string, CaseNode>;
  endings: Record<string, CaseEnding>;
}

const VERDICT_WORDS: Record<CaseEnding['verdict'], { label: string; wash: string; color: string }> = {
  good: { label: 'This went well', wash: CORRECT_WASH, color: 'var(--success)' },
  mixed: { label: 'Mixed outcome', wash: NEUTRAL_WASH, color: 'var(--signal)' },
  costly: { label: 'This was costly', wash: NOT_QUITE_WASH, color: 'var(--rust)' },
};

export function CaseSim({ title, opening, start, nodes, endings }: CaseSimProps) {
  const [nodeId, setNodeId] = useState(start);
  const [trail, setTrail] = useState<Array<{ nodeId: string; choice: CaseChoice }>>([]);
  const [endingId, setEndingId] = useState<string | null>(null);
  /** Choices taken on a previous run, keyed `nodeId:choiceValue`. Marked on
   * replay so a second run explores a different branch instead of
   * reproducing the first one from memory. */
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const consequenceRef = useRevealFocus<HTMLDivElement>(trail.length > 0);
  const endingRef = useRevealFocus<HTMLDivElement>(endingId !== null);
  const openingRef = useReturnFocus<HTMLDivElement>(trail.length === 0 && endingId === null);

  const node = nodes[nodeId];
  const ending = endingId ? endings[endingId] : null;

  function choose(choice: CaseChoice) {
    setTrail((prev) => [...prev, { nodeId, choice }]);
    setSeen((prev) => new Set(prev).add(`${nodeId}:${choice.value}`));
    if (choice.ending) setEndingId(choice.ending);
    else if (choice.nextNode) setNodeId(choice.nextNode);
  }

  function replay() {
    setNodeId(start);
    setTrail([]);
    setEndingId(null);
  }

  return (
    <div style={templateFrameStyle}>
      <div style={questionBandStyle}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.125rem', flexShrink: 0 }} aria-hidden="true">🎬</span>
          <div ref={openingRef} tabIndex={-1} style={questionBlockFocusStyle}>
            <PanelLabel color="var(--gold)">{title}</PanelLabel>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
              <Markdown components={markdownComponents}>{opening}</Markdown>
            </div>
          </div>
        </div>
      </div>

      {/* Decisions already made, with what each one caused. */}
      {trail.length > 0 && (
        <div ref={consequenceRef} tabIndex={-1} style={panelStyle('transparent')}>
          <PanelLabel>What you decided</PanelLabel>
          <ol style={{ margin: 0, paddingLeft: 'var(--space-xl)', color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
            {trail.map((entry, i) => (
              <li key={i} style={{ marginBottom: 'var(--space-md)' }}>
                <p style={{ margin: '0 0 var(--space-xs)', color: 'var(--text-primary)', fontWeight: 600 }}>{entry.choice.label}</p>
                <Markdown components={markdownComponents}>{entry.choice.consequence}</Markdown>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* The live decision. */}
      {!ending && node && (
        <div style={panelStyle(NEUTRAL_WASH)}>
          <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: 'var(--space-md)' }}>
            <Markdown components={markdownComponents}>{node.situation}</Markdown>
          </div>
          <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, margin: '0 0 var(--space-lg)' }}>{node.question}</p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {node.choices.map((choice) => {
              const taken = seen.has(`${nodeId}:${choice.value}`);
              return (
                <button
                  key={choice.value}
                  onClick={() => choose(choice)}
                  style={{ ...optionButtonStyle, borderColor: taken ? 'var(--signal)' : 'var(--bg-border)' }}
                >
                  {choice.label}
                  {/* Real text, not just the border colour — WCAG 1.4.1. */}
                  {taken && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}> · tried before</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Where it ended up. */}
      {ending && (
        <div ref={endingRef} tabIndex={-1} style={panelStyle(VERDICT_WORDS[ending.verdict].wash)}>
          <div aria-live="polite" style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
            <PanelLabel color={VERDICT_WORDS[ending.verdict].color}>{VERDICT_WORDS[ending.verdict].label}</PanelLabel>
            <Markdown components={markdownComponents}>{ending.summary}</Markdown>
            <div style={{ marginTop: 'var(--space-md)', paddingLeft: 'var(--space-md)', borderLeft: '2px solid var(--bg-border)' }}>
              <Markdown components={markdownComponents}>{ending.lesson}</Markdown>
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <TryAgainButton onClick={replay} label="Run it again, different call ↺" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   4. LabBrief — staged, resumable applied lab
   ══════════════════════════════════════════════════════════════ */

export interface LabStage {
  title: string;
  minutes: number;
  instructions: string;
  /** The one thing that must be true before this stage counts as done. */
  checkpoint: string;
}

export interface RubricCriterion {
  criterion: string;
  /** Concrete description of what "meets" looks like. A rubric without this
   * is a score with no explanation of what earns it. */
  meets: string;
}

export interface LabBriefProps {
  /** Stable id — the learner's place is stored under it, so it must not
   * change once a lab has shipped. */
  labId: string;
  title: string;
  brief: string;
  deliverable: string;
  stages: LabStage[];
  rubric: RubricCriterion[];
}

interface LabState {
  done: number[];
  selfCheck: Record<number, 'meets' | 'not-yet'>;
}

const EMPTY_LAB_STATE: LabState = { done: [], selfCheck: {} };

/** Stored state is learner-controlled data on their own device, so it is
 * validated rather than trusted: a hand-edited or half-written entry gives an
 * empty lab, never a crashed lesson. */
function readLabState(storageKey: string): LabState {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return EMPTY_LAB_STATE;
    const parsed = JSON.parse(raw) as Partial<LabState>;
    return {
      done: Array.isArray(parsed.done) ? parsed.done.filter((n) => typeof n === 'number') : [],
      selfCheck:
        parsed.selfCheck && typeof parsed.selfCheck === 'object' && !Array.isArray(parsed.selfCheck)
          ? parsed.selfCheck
          : {},
    };
  } catch {
    return EMPTY_LAB_STATE;
  }
}

/** Labs are the one unit type that reliably spans more than one sitting, so
 * their place is kept locally and survives a closed tab. Local only — this
 * is a scratchpad, not the submission, and a storage failure (private mode,
 * quota, disabled storage) degrades to a working-but-forgetful lab rather
 * than a crash. */
function useLabState(labId: string): [LabState, (next: LabState) => void] {
  const storageKey = `srs.lab.${labId}`;
  // Read once, at mount, rather than in an effect — a lab's identity is fixed
  // for the life of the component (Lesson.tsx keys each LabBrief by labId, so a
  // different lab is a remount, not a prop change).
  const [state, setState] = useState<LabState>(() => readLabState(storageKey));

  const persist = useCallback(
    (next: LabState) => {
      setState(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* Storage unavailable — the lab still works, it just won't be
         * remembered after a reload. Not worth interrupting the learner. */
      }
    },
    [storageKey],
  );

  return [state, persist];
}

export function LabBrief({ labId, title, brief, deliverable, stages, rubric }: LabBriefProps) {
  const [state, persist] = useLabState(labId);
  const [rubricOpen, setRubricOpen] = useState(true);
  const [selfCheckOpen, setSelfCheckOpen] = useState(false);

  const doneSet = useMemo(() => new Set(state.done), [state.done]);
  const allStagesDone = stages.length > 0 && stages.every((_, i) => doneSet.has(i));
  const totalMinutes = stages.reduce((sum, s) => sum + s.minutes, 0);
  const remainingMinutes = stages.reduce((sum, s, i) => (doneSet.has(i) ? sum : sum + s.minutes), 0);

  const selfCheckRef = useRevealFocus<HTMLDivElement>(selfCheckOpen);

  function toggleStage(index: number) {
    const next = new Set(doneSet);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    persist({ ...state, done: [...next].sort((a, b) => a - b) });
  }

  function rate(index: number, value: 'meets' | 'not-yet') {
    persist({ ...state, selfCheck: { ...state.selfCheck, [index]: value } });
  }

  const rated = rubric.filter((_, i) => state.selfCheck[i]).length;
  const notYet = rubric.filter((_, i) => state.selfCheck[i] === 'not-yet');

  return (
    <div style={templateFrameStyle}>
      <div style={questionBandStyle}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.125rem', flexShrink: 0 }} aria-hidden="true">🛠</span>
          <div style={{ flex: 1 }}>
            <PanelLabel color="var(--gold)">Applied lab · {totalMinutes} min across {stages.length} stages</PanelLabel>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.0625rem', margin: '0 0 var(--space-md)' }}>{title}</h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
              <Markdown components={markdownComponents}>{brief}</Markdown>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: 0 }}>
              <strong>What you hand in:</strong> {deliverable}
            </p>
          </div>
        </div>
      </div>

      {/* Rubric first — before any work starts, not after it's marked. */}
      <div style={panelStyle(NEUTRAL_WASH)}>
        <button
          onClick={() => setRubricOpen((o) => !o)}
          aria-expanded={rubricOpen}
          style={{ ...secondaryActionButtonStyle, marginBottom: rubricOpen ? 'var(--space-lg)' : 0 }}
        >
          {rubricOpen ? 'Hide' : 'Show'} what good looks like ({rubric.length} criteria)
        </button>
        {rubricOpen && (
          <ul style={{ margin: 0, paddingLeft: 'var(--space-xl)', color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
            {rubric.map((r, i) => (
              <li key={i} style={{ marginBottom: 'var(--space-md)' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.criterion}</span>
                <br />
                {r.meets}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Stages. Each one independently checkable and independently stoppable. */}
      <div style={panelStyle('transparent')}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', lineHeight: 1.7, margin: '0 0 var(--space-lg)' }}>
          Stop after any stage — your place is saved on this device.{' '}
          {allStagesDone ? 'All stages done.' : `About ${remainingMinutes} min left.`}
        </p>
        <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
          {stages.map((stage, i) => {
            const done = doneSet.has(i);
            return (
              <li key={i} style={{ marginBottom: 'var(--space-xl)', borderLeft: `3px solid ${done ? 'var(--success)' : 'var(--bg-border)'}`, paddingLeft: 'var(--space-lg)' }}>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 var(--space-xs)' }}>
                  Stage {i + 1} · {stage.title} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>· {stage.minutes} min</span>
                </p>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                  <Markdown components={markdownComponents}>{stage.instructions}</Markdown>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, margin: '0 0 var(--space-md)' }}>
                  <strong>Done when:</strong> {stage.checkpoint}
                </p>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)', minHeight: MIN_TOUCH, cursor: 'pointer', color: done ? 'var(--success)' : 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggleStage(i)}
                    style={{ width: 22, height: 22, cursor: 'pointer' }}
                  />
                  {done ? 'Stage done' : 'Mark this stage done'}
                  {/* Every stage's visible label is identical, so without this a
                    * screen-reader user tabbing the lab hears "Mark this stage
                    * done" five times with nothing distinguishing them. */}
                  <span style={visuallyHidden}>{`: stage ${i + 1}, ${stage.title}`}</span>
                </label>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Self-check against the same rubric that was visible from the start. */}
      <div style={panelStyle(allStagesDone ? CORRECT_WASH : 'transparent')}>
        <button
          onClick={() => setSelfCheckOpen((o) => !o)}
          aria-expanded={selfCheckOpen}
          style={{ ...primaryActionButtonStyle, marginBottom: selfCheckOpen ? 'var(--space-lg)' : 0 }}
        >
          {selfCheckOpen ? 'Hide self-check' : 'Self-check before you submit →'}
        </button>

        {selfCheckOpen && (
          <div ref={selfCheckRef} tabIndex={-1} style={revealPanelFocusStyle}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, margin: '0 0 var(--space-lg)' }}>
              Go through your own deliverable against each criterion. Marking something "not yet" is the
              useful answer — it tells you what to fix while it is still cheap to fix.
            </p>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {rubric.map((r, i) => {
                const value = state.selfCheck[i];
                return (
                  <li key={i} style={{ marginBottom: 'var(--space-lg)' }}>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 var(--space-xs)' }}>{r.criterion}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 var(--space-sm)' }}>{r.meets}</p>
                    <div role="group" aria-label={`Self-check: ${r.criterion}`} style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => rate(i, 'meets')}
                        aria-pressed={value === 'meets'}
                        style={{ ...optionButtonStyle, borderColor: value === 'meets' ? 'var(--success)' : 'var(--bg-border)' }}
                      >
                        {value === 'meets' ? '✓ ' : ''}Meets this
                      </button>
                      <button
                        onClick={() => rate(i, 'not-yet')}
                        aria-pressed={value === 'not-yet'}
                        style={{ ...optionButtonStyle, borderColor: value === 'not-yet' ? 'var(--rust)' : 'var(--bg-border)' }}
                      >
                        {value === 'not-yet' ? '→ ' : ''}Not yet
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div aria-live="polite" style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, marginTop: 'var(--space-lg)' }}>
              {rated < rubric.length ? (
                <p style={{ margin: 0 }}>
                  {rated} of {rubric.length} criteria rated.
                </p>
              ) : notYet.length === 0 ? (
                <p style={{ margin: 0 }}>
                  You've rated every criterion as met. That is a submission — hand it in.
                </p>
              ) : (
                <>
                  <p style={{ margin: '0 0 var(--space-xs)' }}>
                    {notYet.length} {notYet.length === 1 ? 'criterion' : 'criteria'} to fix before this is done:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-xl)' }}>
                    {notYet.map((r) => (
                      <li key={r.criterion}>{r.criterion}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
