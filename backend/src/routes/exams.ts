// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { entitlementsMiddleware, type EntitledRequest } from '../middleware/entitlements.js';
import { XP_REWARDS, levelFromXp } from '../lib/gamification.js';
import crypto from 'crypto';

const router = Router();

// Get exam info and questions for a track (requires paid access)
router.get('/:trackId', authMiddleware, entitlementsMiddleware, async (req, res) => {
  try {
    const entReq = req as EntitledRequest;
    const { trackId } = req.params;

    // Exams require paid access — no free tier
    if (!entReq.trackAccess?.includes(trackId)) {
      res.status(403).json({
        error: 'Subscription required',
        message: 'Upgrade to a paid plan to take certification exams.',
      });
      return;
    }

    const exam = await prisma.trackExam.findUnique({
      where: { trackId },
    });

    if (!exam) {
      res.status(404).json({ error: 'Exam not found for this track' });
      return;
    }

    // Pull MULTIPLE_CHOICE exercises from all domains in this track (direct join — no lesson required)
    const exercises = await prisma.exercise.findMany({
      where: {
        isActive: true,
        type: 'MULTIPLE_CHOICE',
        domain: { trackId: req.params.trackId },
      },
      select: {
        id: true,
        ref: true,
        prompt: true,
        type: true,
        config: true,
        difficulty: true,
        bloomLevel: true,
        domainId: true,
        timeEstimate: true,
      },
    });

    // Shuffle and limit to exam question count
    const shuffled = shuffleArray(exercises);
    const questions = shuffled.slice(0, exam.questionCount);

    // Sanitize — remove correct answers
    const sanitizedQuestions = questions.map((q) => ({
      ...q,
      config: sanitizeConfig(parseJson(q.config) as Record<string, unknown>),
    }));

    res.json({
      exam: {
        id: exam.id,
        trackId: exam.trackId,
        title: exam.title,
        description: exam.description,
        timeLimit: exam.timeLimit,
        passScore: exam.passScore,
        questionCount: sanitizedQuestions.length,
      },
      questions: sanitizedQuestions,
    });
  } catch (err) {
    console.error('Exam get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit exam attempt (requires paid access)
router.post('/:examId/attempt', authMiddleware, entitlementsMiddleware, async (req, res) => {
  try {
    const authReq = req as EntitledRequest;
    const { examId } = req.params;
    const { answers } = req.body as {
      answers: Array<{ exerciseId: string; answer: unknown }>;
    };

    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ error: 'Answers array is required' });
      return;
    }

    const exam = await prisma.trackExam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      res.status(404).json({ error: 'Exam not found' });
      return;
    }

    // Verify paid access for this track
    if (!authReq.trackAccess?.includes(exam.trackId)) {
      res.status(403).json({
        error: 'Subscription required',
        message: 'Upgrade to a paid plan to submit certification exams.',
      });
      return;
    }

    // Fetch all referenced exercises
    const exerciseIds = answers.map((a) => a.exerciseId);
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds }, isActive: true },
    });

    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

    // Score each answer
    const scoredAnswers: Array<{
      exerciseId: string;
      answer: unknown;
      score: number;
      isCorrect: boolean;
    }> = [];

    for (const { exerciseId, answer } of answers) {
      const exercise = exerciseMap.get(exerciseId);
      if (!exercise) continue;

      const { score, isCorrect } = scoreAnswer(exercise, answer);
      scoredAnswers.push({ exerciseId, answer, score, isCorrect });
    }

    // Denominator = exam.questionCount so unanswered questions count as 0
    const totalScore =
      scoredAnswers.length > 0
        ? scoredAnswers.reduce((sum, a) => sum + a.score, 0) / (exam.questionCount ?? scoredAnswers.length)
        : 0;

    const passed = totalScore >= (exam.passScore ?? 75);

    // Create exam attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        examId,
        userId: authReq.userId!,
        score: totalScore,
        passed,
        completedAt: new Date(),
        answers: JSON.stringify(scoredAnswers),
      },
    });

    let certificate = null;

    if (passed) {
      // Award XP
      const gam = await prisma.gamification.upsert({
        where: { userId: authReq.userId! },
        create: { userId: authReq.userId!, totalXp: XP_REWARDS.FINAL_EXAM_PASS },
        update: { totalXp: { increment: XP_REWARDS.FINAL_EXAM_PASS } },
      });

      const newLevel = levelFromXp(gam.totalXp);
      if (newLevel !== gam.level) {
        await prisma.gamification.update({
          where: { userId: authReq.userId! },
          data: { level: newLevel },
        });
      }

      // Create certificate — on re-pass, preserve the existing verifyCode so
      // previously issued certificates remain verifiable.
      const existing = await prisma.certificate.findUnique({
        where: { userId_trackId: { userId: authReq.userId!, trackId: exam.trackId } },
      });
      const verifyCode = existing?.verifyCode ?? crypto.randomBytes(16).toString('hex').toUpperCase();

      certificate = await prisma.certificate.upsert({
        where: {
          userId_trackId: { userId: authReq.userId!, trackId: exam.trackId },
        },
        create: {
          userId: authReq.userId!,
          trackId: exam.trackId,
          examScore: totalScore,
          verifyCode,
        },
        update: {
          examScore: totalScore,
          issuedAt: new Date(),
          verifyCode, // preserve existing code (no-op on re-pass, correct on first pass)
        },
      });

      // Link certificate to attempt
      await prisma.examAttempt.update({
        where: { id: attempt.id },
        data: { certificateId: certificate.id },
      });
    }

    res.json({
      attempt: {
        id: attempt.id,
        score: totalScore,
        passed,
        completedAt: attempt.completedAt,
      },
      answers: scoredAnswers,
      certificate: certificate
        ? {
            id: certificate.id,
            verifyCode: certificate.verifyCode,
            issuedAt: certificate.issuedAt,
          }
        : null,
    });
  } catch (err) {
    console.error('Exam attempt error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sanitizeConfig(config: Record<string, unknown>): Record<string, unknown> {
  const cleaned = { ...config };
  delete cleaned.correctIndex;
  delete cleaned.correctAnswer;
  delete cleaned.correctPairs;
  delete cleaned.correctOrder;
  delete cleaned.acceptableAnswers;
  delete cleaned.correctCategories;
  return cleaned;
}

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
      const acceptableArr = config.acceptableAnswers as string[] | undefined;
      if (!acceptableArr?.length) return { score: 0, isCorrect: false };
      const acceptable = acceptableArr.map((a) => a.toLowerCase().trim());
      const userAnswer = String(answer).toLowerCase().trim();
      const isCorrect = acceptable.includes(userAnswer);
      return { score: isCorrect ? 100 : 0, isCorrect };
    }

    case 'CATEGORIZATION': {
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
      console.warn(`[exams] Unrecognized exercise type: ${exercise.type} — scoring 0`);
      return { score: 0, isCorrect: false };
  }
}

/** Parse a JSON string if needed (SQLite stores Json fields as strings). */
function parseJson(val: unknown): unknown {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

export default router;
