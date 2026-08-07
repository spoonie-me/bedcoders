/* Guards on the curriculum data itself, not on any component.
 *
 * Three things are worth failing a build over, and they are all things that
 * break silently:
 *   1. A blueprint that no longer adds up to 100 hours, or breaks an energy
 *      or spacing rule — the whole point of the plan is that the arithmetic
 *      is checkable.
 *   2. A lesson referencing an exercise that doesn't exist, which renders as
 *      a silently missing exercise rather than an error.
 *   3. trackCatalog.ts advertising lesson counts and minutes that no longer
 *      match the seed data — the public page would then be quietly lying
 *      about how much a paid track contains.
 *
 * Spec-compliance warnings on authored content are deliberately NOT asserted:
 * most of the existing curriculum predates the pedagogy spec, and
 * `npm run curriculum:audit` reports those honestly instead.
 */
import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain .mjs audit script, no types, intentionally runnable
// by node with no build step.
import { runAudit, auditBlueprint, parseCatalogCounts, TARGET_MINUTES } from '../../../scripts/curriculum-audit.mjs';

interface AuditTrack {
  track: string;
  plannedMinutes: number;
  plannedLessons: number;
  authoredMinutes: number;
  authoredLessons: number;
}
interface AuditResult {
  tracks: AuditTrack[];
  errors: string[];
  warnings: string[];
}

const result = runAudit() as AuditResult;

describe('curriculum data', () => {
  it('has no integrity errors', () => {
    expect(result.errors).toEqual([]);
  });

  it('covers all eight tracks', () => {
    expect(result.tracks.map((t) => t.track).sort()).toEqual([
      'accessibility-qa-lived-experience',
      'advanced',
      'ai',
      'ai-orchestrated-dev',
      'ai-oversight-health-informatics',
      'ai-workflow-consulting',
      'fundamentals',
      'tools',
    ]);
  });

  it('plans every track to exactly 100 hours', () => {
    for (const track of result.tracks) {
      expect(track.plannedMinutes, track.track).toBe(TARGET_MINUTES);
      expect(track.plannedLessons, track.track).toBe(150);
    }
  });

  it('never advertises more content than the seed data holds', () => {
    const catalog = parseCatalogCounts() as Record<string, { lessonCount: number; totalMinutes: number }>;
    for (const track of result.tracks) {
      const advertised = catalog[track.track];
      if (!advertised) continue;
      expect(advertised.lessonCount, track.track).toBe(track.authoredLessons);
      expect(advertised.totalMinutes, track.track).toBe(track.authoredMinutes);
    }
  });
});

describe('auditBlueprint', () => {
  /** Minimal well-formed module, cloned and broken per case below. */
  function module(overrides: Record<string, unknown> = {}) {
    return {
      order: 3,
      slug: 'm',
      name: 'M',
      tier: 'foundation',
      bloom: 'apply',
      objective: 'o',
      minutes: 200,
      lessons: [
        { order: 1, title: 'a', minutes: 25, energy: 'low', bloom: 'apply', badDayPath: true },
        { order: 2, title: 'b', minutes: 20, energy: 'medium', bloom: 'apply', badDayPath: false },
        { order: 3, title: 'c', minutes: 25, energy: 'low', bloom: 'apply', badDayPath: true },
        { order: 4, title: 'd', minutes: 20, energy: 'medium', bloom: 'apply', badDayPath: false },
        { order: 5, title: 'e', minutes: 20, energy: 'medium', bloom: 'apply', badDayPath: true },
      ],
      practiceSet: { title: 'p', minutes: 30, drills: 7, energy: 'medium' },
      lab: { title: 'l', minutes: 50, stages: 4, deliverable: 'thing', energy: 'high' },
      checkpoint: {
        title: 'c',
        minutes: 10,
        energy: 'low',
        badDayPath: true,
        pulls: { thisModule: 4, previousModule: 4, olderModules: 2 },
      },
      ...overrides,
    };
  }

  /** One phase of five identical-shaped modules, with unique lesson titles. */
  function plan(mutate: (m: ReturnType<typeof module>) => void = () => {}) {
    const phases = Array.from({ length: 6 }, (_, p) => ({
      order: p + 1,
      slug: `p${p}`,
      name: `P${p}`,
      outcome: 'o',
      modules: Array.from({ length: 5 }, (_, i) => {
        const m = module({ order: i + 1, slug: `p${p}m${i}` });
        m.lessons = m.lessons.map((l) => ({ ...l, title: `${l.title}-${p}-${i}` }));
        return m;
      }),
    }));
    // Modules 1 and 2 of phase 1 have nothing behind them to space against.
    phases[0].modules[0].checkpoint.pulls = { thisModule: 10, previousModule: 0, olderModules: 0 };
    phases[0].modules[1].checkpoint.pulls = { thisModule: 5, previousModule: 5, olderModules: 0 };
    mutate(phases[2].modules[2]);
    return { track: 't', title: 'T', phases };
  }

  function errorsFor(mutate: (m: ReturnType<typeof module>) => void) {
    return (auditBlueprint(plan(mutate)) as { errors: string[] }).errors;
  }

  it('passes a well-formed plan', () => {
    expect(errorsFor(() => {})).toEqual([]);
  });

  it('catches lesson minutes that no longer sum to 110', () => {
    expect(errorsFor((m) => { m.lessons[0].minutes = 30; })).toEqual(
      expect.arrayContaining([expect.stringContaining('lessons sum to 115')]),
    );
  });

  it('catches a second high-energy unit in a module', () => {
    expect(errorsFor((m) => { m.lessons[1].energy = 'high'; })).toEqual(
      expect.arrayContaining([expect.stringContaining('high-energy')]),
    );
  });

  it('catches a checkpoint that drops the long-interval pull', () => {
    expect(errorsFor((m) => { m.checkpoint.pulls = { thisModule: 5, previousModule: 5, olderModules: 0 }; })).toEqual(
      expect.arrayContaining([expect.stringContaining('expected 4/4/2')]),
    );
  });

  it('catches a module with no usable bad-day path', () => {
    expect(errorsFor((m) => { m.lessons = m.lessons.map((l) => ({ ...l, badDayPath: false })); })).toEqual(
      expect.arrayContaining([expect.stringContaining('bad-day path')]),
    );
  });

  it('catches an unstaged lab that exceeds the 30-minute unit cap', () => {
    expect(errorsFor((m) => { m.lab.stages = 1; })).toEqual(
      expect.arrayContaining([expect.stringContaining('needs at least 3')]),
    );
  });

  it('catches a duplicate lesson title within a track', () => {
    expect(errorsFor((m) => { m.lessons[1].title = m.lessons[0].title; })).toEqual(
      expect.arrayContaining([expect.stringContaining('duplicate lesson title')]),
    );
  });
});
