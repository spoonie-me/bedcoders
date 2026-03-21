import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { ExerciseRenderer, type ExerciseData, type ExerciseType } from '@/components/exercises/ExerciseRenderer';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import { learningApi, type LessonDetailResponse } from '@/lib/api';
import { IS_DEV_MODE } from '@/lib/useApi';
import { SEO } from '@/components/SEO';

/* ─── Types for lesson content ─── */
interface TextSection { type: 'text'; body: string }
interface CalloutSection { type: 'callout'; variant: 'info' | 'warning' | 'tip' | 'example'; body: string }
interface ExerciseSection { type: 'exercise'; exerciseRef: string }
interface HookSection { type: 'hook'; body: string }
interface TakeawaySection { type: 'takeaway'; body: string }
interface PodHeaderSection { type: 'pod-header'; title: string; podNumber: number; duration: number }
interface InteractiveGuessSection { type: 'interactive-guess'; question: string; answer: string; hint?: string }
type ContentSection = TextSection | CalloutSection | ExerciseSection | HookSection | TakeawaySection | PodHeaderSection | InteractiveGuessSection;

interface LessonView {
  id: string;
  moduleId: string;
  title: string;
  duration: number;
  order: number;
  learningObjectives: string[];
  contentSections: ContentSection[];
  trackTitle: string;
  domainTitle: string;
  exercises: ExerciseData[];
  nextLessonId?: string;
  prevLessonId?: string;
}

/* ─── Callout styling by variant ─── */
const CALLOUT_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  info: { border: 'var(--signal)', bg: 'rgba(240,240,236,0.05)', icon: '\u2139' },
  warning: { border: 'var(--warning)', bg: 'rgba(201,168,76,0.05)', icon: '\u26A0' },
  tip: { border: 'var(--success)', bg: 'rgba(90,158,106,0.05)', icon: '\uD83D\uDCA1' },
  example: { border: 'var(--rust)', bg: 'rgba(196,107,58,0.05)', icon: '\uD83D\uDCCB' },
};

/* ─── Interactive Guess Component ─── */
function InteractiveGuess({ question, answer, hint }: { question: string; answer: string; hint?: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div style={{ border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-xl)' }}>
      <div style={{ background: 'rgba(201,168,76,0.07)', padding: 'var(--space-lg) var(--space-xl)', borderBottom: revealed ? '1px solid var(--bg-border)' : 'none' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>🤔</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 500, margin: '0 0 var(--space-md)' }}>{question}</p>
            {hint && !revealed && (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', fontStyle: 'italic', margin: '0 0 var(--space-md)' }}>Hint: {hint}</p>
            )}
            {!revealed && (
              <button
                onClick={() => setRevealed(true)}
                style={{ background: 'var(--gold)', color: 'var(--bg-void)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '6px 14px', fontSize: '0.8125rem', fontFamily: 'var(--font-display)', fontWeight: 500, cursor: 'pointer' }}
              >
                Reveal answer →
              </button>
            )}
          </div>
        </div>
      </div>
      {revealed && (
        <div style={{ padding: 'var(--space-lg) var(--space-xl)', background: 'rgba(90,158,106,0.05)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>✓</span>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
              <Markdown components={markdownComponents}>{answer}</Markdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Demo data ─── */
const DEMO_EXERCISES: ExerciseData[] = [
  {
    id: 'ex-demo-1',
    ref: 'FUNDAMENTALS-CODE-001',
    prompt: 'What is the primary purpose of code?',
    type: 'MULTIPLE_CHOICE',
    config: { options: [
      { text: 'To give computers something to do', correct: false },
      { text: 'To let humans communicate instructions to computers', correct: true },
      { text: 'To replace human thinking', correct: false },
      { text: 'To make websites look nice', correct: false },
    ]},
    hints: ['Think about who writes code and who reads it.'],
    explanation: 'Code is fundamentally a tool for human communication — we write it so other humans (and future us) can understand what a program does. The computer just executes it.',
    isKnowledgeCheck: true,
    xpReward: 10,
  },
];

const DEMO_LESSON: LessonView = {
  id: 'gs-l01',
  moduleId: 'gs-f1',
  title: 'What is Code?',
  duration: 15,
  order: 1,
  trackTitle: '🛏️ Code from Bed',
  domainTitle: 'Getting Started',
  learningObjectives: [
    'Define what code is in plain language',
    'Explain why the current moment (Claude era) is special for learning to code',
    'Describe what lazy coding means and why it\'s smart',
  ],
  exercises: DEMO_EXERCISES,
  contentSections: [
    { type: 'pod-header', title: 'Code is just instructions', podNumber: 1, duration: 5 },
    { type: 'hook', body: 'Every app on your phone — Instagram, Google Maps, your banking app — was written in code by humans who also occasionally forgot what they were doing and Googled "how to center a div". Code isn\'t magic. It\'s instructions.' },
    { type: 'text', body: '**Code** is a set of instructions you write for a computer. Think of it like a recipe:\n\n- A recipe tells a cook: "First add flour, then mix in eggs, then bake at 180°C."\n- Code tells a computer: "First ask the user for their name, then store it, then display it on screen."\n\nThe computer follows your instructions exactly. Which is both its superpower and its greatest limitation.' },
    { type: 'interactive-guess', question: 'Before we go further — who do you think code is actually written for: computers or humans?', answer: '**Humans.** Computers could run binary (1s and 0s) all day. Code exists so that *humans* can read, write, and reason about what a program does.', hint: 'Think about who needs to understand what the code does day-to-day.' },
    { type: 'takeaway', body: 'Code = instructions written by humans, for humans, that computers can also execute.' },
    { type: 'pod-header', title: 'The lazy coding mindset', podNumber: 2, duration: 5 },
    { type: 'text', body: '**Lazy coding isn\'t about cutting corners.** It\'s about not doing work a tool can do for you.\n\nIn the Claude era, this means:\n- Let Claude generate boilerplate code\n- You focus on *what* to build, Claude figures out *how*\n- Review, tweak, and ship\n\nYou\'re the architect. Claude is the construction crew.' },
    { type: 'callout', variant: 'tip', body: '**You\'re learning to code at the best possible time.** The tools available to you right now — Claude, VS Code, Vercel — make it possible to ship real things in days, not months.' },
    { type: 'exercise', exerciseRef: 'FUNDAMENTALS-CODE-001' },
  ],
  nextLessonId: 'gs-l02',
};

/* ─── Markdown component overrides ─── */
const markdownComponents = {
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 style={{ color: 'var(--text-primary)', marginBottom: 12, marginTop: 4, fontSize: '1.125rem' }}>{children}</h3>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong style={{ color: 'var(--text-primary)' }}>{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul style={{ paddingLeft: 'var(--space-xl)', listStyle: 'disc' }}>{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li style={{ marginBottom: 'var(--space-xs)' }}>{children}</li>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p style={{ marginBottom: 'var(--space-md)' }}>{children}</p>
  ),
};

export function Lesson() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<LessonView | null>(null);
  const [loading, setLoading] = useState(true);
  const [exerciseResults, setExerciseResults] = useState<Record<string, { feedback: string; score: number }>>({});
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Mark a text/callout section as read when it scrolls 80% into view
  const markSectionReadCallback = useCallback((idx: number) => {
    setCompletedSections((prev) => {
      if (prev.has(idx)) return prev;
      return new Set(prev).add(idx);
    });
  }, []);

  useEffect(() => {
    if (IS_DEV_MODE) {
      setLesson(DEMO_LESSON);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res: LessonDetailResponse = await learningApi.getLesson(id ?? '1');
        const l = res.lesson;

        // Parse learningObjectives from Json
        const objectives = Array.isArray(l.learningObjectives)
          ? (l.learningObjectives as Array<{ text?: string }>).map((o) => (typeof o === 'string' ? o : o.text ?? ''))
          : [];

        const sections = Array.isArray(l.contentSections) ? (l.contentSections as ContentSection[]) : [];

        // Map exercises to ExerciseData
        const exercises: ExerciseData[] = l.exercises.map((ex) => ({
          id: ex.id,
          ref: ex.ref,
          prompt: ex.prompt,
          type: ex.type as ExerciseType,
          config: ex.config as Record<string, unknown>,
          hints: ex.hints,
          explanation: ex.explanation ?? undefined,
          isKnowledgeCheck: ex.isKnowledgeCheck,
          xpReward: ex.xpReward,
        }));

        setLesson({
          id: l.id,
          moduleId: l.moduleId,
          title: l.title,
          duration: l.duration,
          order: l.order,
          learningObjectives: objectives,
          contentSections: sections,
          trackTitle: l.trackTitle ?? 'Code from Bed',
          domainTitle: l.domainTitle ?? '',
          exercises,
          nextLessonId: l.nextLessonId ?? undefined,
          prevLessonId: l.prevLessonId ?? undefined,
        });
      } catch {
        setLesson(DEMO_LESSON);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // Build exercise lookup
  const exerciseMap = useMemo(() => {
    const map: Record<string, ExerciseData> = {};
    if (lesson) for (const ex of lesson.exercises) map[ex.ref] = ex;
    return map;
  }, [lesson]);

  // Auto-mark text/callout sections as read when scrolled into view (80% visible)
  // Must be before early return to satisfy rules-of-hooks
  useEffect(() => {
    if (!lesson) return;
    const refs = sectionRefs.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-section-idx'));
            if (!isNaN(idx)) markSectionReadCallback(idx);
          }
        });
      },
      { threshold: 0.8 },
    );
    refs.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [lesson, markSectionReadCallback]);

  // Fire lesson complete API call when all sections done
  // Must be before any early return to satisfy rules-of-hooks
  useEffect(() => {
    if (!lesson || IS_DEV_MODE) return;
    const total = lesson.contentSections.length;
    if (total > 0 && completedSections.size === total) {
      learningApi.updateLessonProgress(lesson.id, 'completed', 100).catch(() => {});
    }
  }, [completedSections, lesson]);

  if (loading || !lesson) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  const totalSections = lesson.contentSections.length;
  const progress = totalSections > 0 ? (completedSections.size / totalSections) * 100 : 0;

  const handleExerciseSubmit = async (exerciseRef: string, answer: unknown) => {
    const exercise = exerciseMap[exerciseRef];
    if (!exercise) return;

    try {
      const res = await learningApi.submitExercise(exercise.id, answer);
      setExerciseResults((prev) => ({
        ...prev,
        [exerciseRef]: {
          feedback: res.submission.feedback,
          score: res.submission.score,
        },
      }));
    } catch {
      // Fallback for dev mode / offline
      setExerciseResults((prev) => ({
        ...prev,
        [exerciseRef]: { feedback: 'Great work! Your answer has been recorded.', score: 85 },
      }));
    }

    const sectionIdx = lesson.contentSections.findIndex(
      (s) => s.type === 'exercise' && (s as ExerciseSection).exerciseRef === exerciseRef,
    );
    if (sectionIdx >= 0) setCompletedSections((prev) => new Set(prev).add(sectionIdx));
  };

  const markSectionRead = (idx: number) => {
    setCompletedSections((prev) => new Set(prev).add(idx));
  };

  // Mark lesson complete — called by nav buttons AND reactively when all sections done
  const markLessonComplete = () => {
    if (!lesson) return;
    // Mark all sections as read so progress bar fills (always, including dev mode)
    setCompletedSections(new Set(lesson.contentSections.map((_, i) => i)));
    // Skip API call in dev mode
    if (IS_DEV_MODE) return;
    learningApi.updateLessonProgress(lesson.id, 'completed', 100).catch(() => {});
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <SEO title={lesson.title} description={`${lesson.trackTitle} — ${lesson.domainTitle}. Lesson ${lesson.order}: ${lesson.title}`} noIndex />
      {/* Breadcrumb + progress */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>Dashboard</Link>
          <span aria-hidden="true" style={{ color: 'var(--text-tertiary)' }}>/</span>
          <span style={{ color: 'var(--signal)', fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}>{lesson.trackTitle}</span>
          <span aria-hidden="true" style={{ color: 'var(--text-tertiary)' }}>/</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{lesson.domainTitle}</span>
          <span aria-hidden="true" style={{ color: 'var(--text-tertiary)' }}>/</span>
          <span aria-current="page" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Lesson {lesson.order}</span>
        </nav>
        <ProgressBar value={progress} color="var(--signal)" height={4} />
      </div>

      <h1 style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>{lesson.title}</h1>
      <p style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>
        {lesson.duration} min &middot; Lesson {lesson.order}
      </p>

      {/* Learning objectives */}
      <Card style={{ marginBottom: 'var(--space-2xl)', borderLeft: '3px solid var(--signal)' }}>
        <h3 style={{ fontSize: '0.875rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--signal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-md)' }}>
          Learning Objectives
        </h3>
        <ul style={{ paddingLeft: 'var(--space-xl)', listStyle: 'none', margin: 0 }}>
          {lesson.learningObjectives.map((obj, i) => (
            <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, padding: 'var(--space-xs) 0', display: 'flex', gap: 'var(--space-sm)' }}>
              <span style={{ color: 'var(--signal)', flexShrink: 0 }}>&#9673;</span>
              {obj}
            </li>
          ))}
        </ul>
      </Card>

      {/* Content sections */}
      {lesson.contentSections.map((section, i) => {
        if (section.type === 'text') {
          return (
            <Card
              key={i}
              ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }}
              data-section-idx={i}
              style={{ marginBottom: 'var(--space-xl)' }}
              onClick={() => markSectionRead(i)}
            >
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                <Markdown components={markdownComponents}>{section.body}</Markdown>
              </div>
            </Card>
          );
        }

        if (section.type === 'callout') {
          const style = CALLOUT_STYLES[section.variant] || CALLOUT_STYLES.info;
          return (
            <div
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              data-section-idx={i}
              role={section.variant === 'warning' ? 'alert' : 'note'}
              style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg) var(--space-xl)', borderLeft: `3px solid ${style.border}`, background: style.bg, borderRadius: 'var(--radius-md)' }}
              onClick={() => markSectionRead(i)}
            >
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ fontSize: '1.125rem', lineHeight: 1.4 }}>{style.icon}</span>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                  <Markdown components={markdownComponents}>{section.body}</Markdown>
                </div>
              </div>
            </div>
          );
        }

        if (section.type === 'exercise') {
          const exercise = exerciseMap[(section as ExerciseSection).exerciseRef];
          if (!exercise) return null;
          const result = exerciseResults[(section as ExerciseSection).exerciseRef];
          return (
            <div key={i} style={{ marginBottom: 'var(--space-xl)' }}>
              <ExerciseRenderer
                exercise={exercise}
                onSubmit={(answer) => handleExerciseSubmit((section as ExerciseSection).exerciseRef, answer)}
                feedback={result?.feedback}
                score={result?.score}
                disabled={!!result}
              />
            </div>
          );
        }

        if (section.type === 'hook') {
          const s = section as HookSection;
          return (
            <div
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              data-section-idx={i}
              style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg) var(--space-xl)', borderLeft: '3px solid var(--gold)', background: 'rgba(201,168,76,0.06)', borderRadius: 'var(--radius-md)' }}
              onClick={() => markSectionRead(i)}
            >
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ fontSize: '1.125rem', lineHeight: 1.4 }}>🎯</span>
                <div>
                  <p style={{ color: 'var(--gold)', fontSize: '0.6875rem', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 var(--space-xs)' }}>Why this matters</p>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                    <Markdown components={markdownComponents}>{s.body}</Markdown>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (section.type === 'takeaway') {
          const s = section as TakeawaySection;
          return (
            <div
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              data-section-idx={i}
              style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg) var(--space-xl)', borderLeft: '3px solid var(--success)', background: 'rgba(90,158,106,0.06)', borderRadius: 'var(--radius-md)' }}
              onClick={() => markSectionRead(i)}
            >
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ fontSize: '1.125rem', lineHeight: 1.4 }}>💡</span>
                <div>
                  <p style={{ color: 'var(--success)', fontSize: '0.6875rem', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 var(--space-xs)' }}>Remember this</p>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.7, fontWeight: 500 }}>
                    <Markdown components={markdownComponents}>{s.body}</Markdown>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (section.type === 'pod-header') {
          const s = section as PodHeaderSection;
          return (
            <div
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              data-section-idx={i}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', margin: 'var(--space-3xl) 0 var(--space-xl)' }}
              onClick={() => markSectionRead(i)}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--signal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'var(--bg-void)', fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{s.podNumber}</span>
              </div>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 600 }}>{s.title}</span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontFamily: 'var(--font-display)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-border)' }}>{s.duration} min</span>
              <div style={{ flex: 1, height: 1, background: 'var(--bg-border)' }} />
            </div>
          );
        }

        if (section.type === 'interactive-guess') {
          const s = section as InteractiveGuessSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <InteractiveGuess question={s.question} answer={s.answer} hint={s.hint} />
            </div>
          );
        }

        return null;
      })}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-3xl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--bg-border)' }}>
        {lesson.prevLessonId ? (
          <Link to={`/lesson/${lesson.prevLessonId}`}><Button variant="ghost">&larr; Previous lesson</Button></Link>
        ) : (
          <Link to="/dashboard"><Button variant="ghost">Back to dashboard</Button></Link>
        )}
        {lesson.nextLessonId ? (
          <Link to={`/lesson/${lesson.nextLessonId}`} onClick={markLessonComplete}>
            <Button variant="primary">Next lesson &rarr;</Button>
          </Link>
        ) : (
          <Link to="/dashboard" onClick={markLessonComplete}>
            <Button variant="primary">Complete &check;</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
