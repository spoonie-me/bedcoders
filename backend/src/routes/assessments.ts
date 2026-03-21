// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { entitlementsMiddleware, type EntitledRequest } from '../middleware/entitlements.js';
import {
  XP_REWARDS,
  levelFromXp,
  calculateDomainMastery,
  calculateMasteryStars,
  isDomainMastered,
} from '../lib/gamification.js';

const router = Router();

// Get assessment questions for a module (requires paid access for non-first modules)
router.get('/:moduleId', authMiddleware, entitlementsMiddleware, async (req, res) => {
  try {
    const entReq = req as EntitledRequest;

    // Check if module is beyond free tier
    const mod = await prisma.module.findUnique({
      where: { id: req.params.moduleId },
      include: { domain: true },
    });

    if (mod && mod.order !== 1 && !entReq.trackAccess?.includes(mod.domain?.trackId ?? '')) {
      res.status(403).json({
        error: 'Track access required',
        message: 'Upgrade your plan to take assessments beyond the first module.',
      });
      return;
    }

    const assessment = await prisma.moduleAssessment.findUnique({
      where: { moduleId: req.params.moduleId },
      include: {
        exercises: {
          where: { isActive: true },
          select: {
            id: true,
            ref: true,
            prompt: true,
            type: true,
            config: true,
            hints: true,
            difficulty: true,
            bloomLevel: true,
            timeEstimate: true,
            order: true,
          },
        },
      },
    });

    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found for this module' });
      return;
    }

    // Randomize and limit question count if configured
    let questions = [...assessment.exercises];
    if (assessment.randomize) {
      questions = shuffleArray(questions);
    }
    questions = questions.slice(0, assessment.questionCount);

    // Strip correct answers from config before sending to client
    const sanitizedQuestions = questions.map((q) => ({
      ...q,
      config: sanitizeConfig(parseJson(q.config) as Record<string, unknown>, q.type),
      hints: parseJson(q.hints),
    }));

    res.json({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        timeLimit: assessment.timeLimit,
        passScore: assessment.passScore,
        questionCount: sanitizedQuestions.length,
      },
      questions: sanitizedQuestions,
    });
  } catch (err) {
    console.error('Assessment get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit assessment attempt
router.post('/:assessmentId/attempt', authMiddleware, entitlementsMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { assessmentId } = req.params;
    const { answers } = req.body as {
      answers: Array<{ exerciseId: string; answer: unknown }>;
    };

    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ error: 'Answers array is required' });
      return;
    }

    const assessment = await prisma.moduleAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        module: { select: { domainId: true } },
        exercises: { where: { isActive: true } },
      },
    });

    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    // Score each answer
    const scoredAnswers: Array<{
      exerciseId: string;
      answer: unknown;
      score: number;
      isCorrect: boolean;
    }> = [];

    for (const { exerciseId, answer } of answers) {
      const exercise = assessment.exercises.find((e) => e.id === exerciseId);
      if (!exercise) continue;

      const { score, isCorrect } = scoreAnswer(exercise, answer);
      scoredAnswers.push({ exerciseId, answer, score, isCorrect });
    }

    // Calculate overall score (denominator = total question count, not just submitted)
    const totalScore =
      scoredAnswers.length > 0
        ? scoredAnswers.reduce((sum, a) => sum + a.score, 0) / (assessment.questionCount ?? scoredAnswers.length)
        : 0;

    const passed = totalScore >= (assessment.passScore ?? 70);

    // Create attempt record
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        userId: authReq.userId!,
        score: totalScore,
        passed,
        completedAt: new Date(),
        answers: JSON.stringify(scoredAnswers),
      },
    });

    // Award XP if passed
    if (passed) {
      const gam = await prisma.gamification.upsert({
        where: { userId: authReq.userId! },
        create: {
          userId: authReq.userId!,
          totalXp: XP_REWARDS.MODULE_ASSESSMENT_PASS,
        },
        update: { totalXp: { increment: XP_REWARDS.MODULE_ASSESSMENT_PASS } },
      });

      const newLevel = levelFromXp(gam.totalXp);
      if (newLevel !== gam.level) {
        await prisma.gamification.update({
          where: { userId: authReq.userId! },
          data: { level: newLevel },
        });
      }
    }

    // Update domain mastery
    if (assessment.module?.domainId) {
      await updateDomainMastery(authReq.userId!, assessment.module.domainId);
    }

    res.json({
      attempt: {
        id: attempt.id,
        score: totalScore,
        passed,
        completedAt: attempt.completedAt,
      },
      answers: scoredAnswers,
    });
  } catch (err) {
    console.error('Assessment attempt error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** Shuffle array (Fisher-Yates). */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Remove correct answers from config before sending to client. */
function sanitizeConfig(config: Record<string, unknown>, type: string): Record<string, unknown> {
  const cleaned = { ...config };
  delete cleaned.correctIndex;
  delete cleaned.correctAnswer;
  delete cleaned.correctPairs;
  delete cleaned.correctOrder;
  delete cleaned.acceptableAnswers;
  delete cleaned.correctCategories;
  return cleaned;
}

/** Score a single answer against an exercise. */
function scoreAnswer(
  exercise: { type: string; config: unknown },
  answer: unknown,
): { score: number; isCorrect: boolean } {
  const config = (parseJson(exercise.config) ?? {}) as Record<string, unknown>;

  if (!config || typeof config !== 'object') {
    return { score: 0, isCorrect: false };
  }

  switch (exercise.type) {
    case 'MULTIPLE_CHOICE': {
      // Support both numeric correctIndex and string correctId formats
      const correctIndex = config.correctIndex as number | undefined;
      const correctId = config.correctId as string | undefined;
      const selected = typeof answer === 'number'
        ? answer
        : typeof answer === 'string' && !isNaN(Number(answer))
          ? Number(answer)
          : (answer as { selectedIndex?: number })?.selectedIndex;
      const selectedId = (answer as { selectedId?: string })?.selectedId
        ?? (typeof answer === 'string' ? answer : undefined);
      const isCorrect =
        (correctIndex !== undefined && selected === correctIndex) ||
        (correctId !== undefined && selectedId === correctId);
      return { score: isCorrect ? 100 : 0, isCorrect };
    }

    case 'TRUE_FALSE_JUSTIFY': {
      const correctAnswer = config.correctAnswer as boolean;
      const userAnswer = answer as { value: boolean };
      const isCorrect = userAnswer.value === correctAnswer;
      return { score: isCorrect ? 100 : 0, isCorrect };
    }

    case 'MATCHING': {
      // Support both seed formats: {pairs:[{left,right}]} and {correctPairs:[[l,r]]}
      const rawPairs = config.pairs as Array<{ left: string; right: string }> | undefined;
      const correctMap: Record<string, string> = {};
      if (rawPairs?.length) {
        for (const p of rawPairs) correctMap[p.left] = p.right;
      } else {
        const cp = config.correctPairs as Array<[string, string]> | undefined;
        if (cp?.length) for (const [l, r] of cp) correctMap[l] = r;
      }
      const total = Object.keys(correctMap).length;
      if (total === 0) return { score: 0, isCorrect: false };
      // Accept answer as Record<string,string> or Array<[string,string]>
      const userMap: Record<string, string> = {};
      if (Array.isArray(answer)) {
        for (const pair of answer as Array<[string, string]>) userMap[pair[0]] = pair[1];
      } else {
        Object.assign(userMap, answer as Record<string, string>);
      }
      let correct = 0;
      for (const [left, right] of Object.entries(correctMap)) {
        if (userMap[left] === right) correct++;
      }
      const score = Math.round((correct / total) * 100);
      return { score, isCorrect: score >= 70 };
    }

    case 'SEQUENCING': {
      const correctOrder = config.correctOrder as string[];
      const userOrder = answer as string[];
      let correct = 0;
      for (let i = 0; i < correctOrder.length; i++) {
        if (userOrder[i] === correctOrder[i]) correct++;
      }
      const score = Math.round((correct / correctOrder.length) * 100);
      return { score, isCorrect: score >= 70 };
    }

    case 'FILL_IN_BLANK': {
      // Multi-blank format: {blanks:[{answer, alternatives?}]}
      const blanks = config.blanks as Array<{ answer: string; alternatives?: string[] }> | undefined;
      if (blanks?.length) {
        const userAnswers = Array.isArray(answer) ? answer : [String(answer)];
        let correct = 0;
        for (let i = 0; i < blanks.length; i++) {
          const blank = blanks[i];
          const userVal = (userAnswers[i] ?? '').toString().toLowerCase().trim();
          const acceptable = [blank.answer, ...(blank.alternatives ?? [])].map((a) => a.toLowerCase().trim());
          if (acceptable.includes(userVal)) correct++;
        }
        const score = Math.round((correct / blanks.length) * 100);
        return { score, isCorrect: score >= 70 };
      }
      // Flat list format: {acceptableAnswers:[...]}
      const acceptableArr = config.acceptableAnswers as string[] | undefined;
      if (!acceptableArr?.length) return { score: 0, isCorrect: false };
      const acceptable = acceptableArr.map((a) => a.toLowerCase().trim());
      const userAnswer = String(answer).toLowerCase().trim();
      const isCorrect = acceptable.includes(userAnswer);
      return { score: isCorrect ? 100 : 0, isCorrect };
    }

    case 'CATEGORIZATION': {
      // Support both formats: {correctCategories:{...}} and {items:[{text,category}]}
      let correctCategories = config.correctCategories as Record<string, string[]> | undefined;
      if (!correctCategories) {
        const items = config.items as Array<{ text: string; category: string }> | undefined;
        if (items?.length) {
          correctCategories = {};
          for (const item of items) {
            if (!correctCategories[item.category]) correctCategories[item.category] = [];
            correctCategories[item.category].push(item.text);
          }
        }
      }
      if (!correctCategories) return { score: 0, isCorrect: false };
      const userCategories = answer as Record<string, string[]>;
      let total = 0;
      let correct = 0;
      for (const [cat, items] of Object.entries(correctCategories)) {
        for (const item of items) {
          total++;
          if (userCategories[cat]?.includes(item)) correct++;
        }
      }
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      return { score, isCorrect: score >= 70 };
    }

    default:
      console.warn(`[assessments] Unrecognized exercise type: ${exercise.type} — scoring 0`);
      return { score: 0, isCorrect: false };
  }
}

/** Recalculate and upsert domain mastery for a user. */
async function updateDomainMastery(userId: string, domainId: string) {
  // Get all assessment attempts for modules in this domain
  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      userId,
      assessment: { module: { domainId } },
    },
    orderBy: { completedAt: 'desc' },
  });

  if (attempts.length === 0) return;

  // Use the best score per assessment
  const bestScores = new Map<string, number>();
  for (const att of attempts) {
    const current = bestScores.get(att.assessmentId);
    if (!current || att.score > current) {
      bestScores.set(att.assessmentId, att.score);
    }
  }

  const exercises = Array.from(bestScores.values()).map((score) => ({
    score,
    weight: 1,
  }));

  const avgScore = calculateDomainMastery(exercises);
  const stars = calculateMasteryStars(avgScore);
  const mastered = isDomainMastered(avgScore);

  await prisma.domainMastery.upsert({
    where: { userId_domainId: { userId, domainId } },
    create: {
      userId,
      domainId,
      score: avgScore,
      stars,
      isMastered: mastered,
    },
    update: {
      score: avgScore,
      stars,
      isMastered: mastered,
    },
  });
}

/** Parse a JSON string if needed (SQLite stores Json fields as strings). */
function parseJson(val: unknown): unknown {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

export default router;
