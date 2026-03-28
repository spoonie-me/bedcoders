// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { getExerciseFeedback } from '../lib/claude.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { entitlementsMiddleware, type EntitledRequest } from '../middleware/entitlements.js';

const router = Router();

// Submit an exercise answer and get AI feedback
router.post('/:exerciseId', authMiddleware, entitlementsMiddleware, async (req, res) => {
  try {
    const authReq = req as EntitledRequest;
    const { answer } = req.body;

    if (!answer) {
      res.status(400).json({ error: 'Answer is required' });
      return;
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: req.params.exerciseId },
      include: {
        lesson: {
          include: {
            module: {
              include: { domain: true },
            },
          },
        },
      },
    });

    if (!exercise || !exercise.isActive) {
      res.status(404).json({ error: 'Exercise not found' });
      return;
    }

    // Check track access — allow first module (free tier) or paid access
    const trackId = exercise.lesson?.module?.domain?.trackId;
    const moduleOrder = exercise.lesson?.module?.order;
    if (trackId && moduleOrder !== 1 && !authReq.trackAccess?.includes(trackId)) {
      res.status(403).json({
        error: 'Track access required',
        message: 'Upgrade your plan to get AI feedback for exercises in this module.',
      });
      return;
    }

    // Get AI feedback — parse config for expected answer
    const config = typeof exercise.config === 'string' ? JSON.parse(exercise.config) : exercise.config;
    const expectedAnswer = config?.correctAnswer ?? config?.correctIndex ?? '';
    const result = await getExerciseFeedback(
      exercise.prompt,
      String(expectedAnswer),
      answer,
      exercise.type,
    );

    // Count previous attempts
    const previousAttempts = await prisma.submission.count({
      where: { userId: authReq.userId!, exerciseId: exercise.id },
    });

    // Save submission
    const submission = await prisma.submission.create({
      data: {
        userId: authReq.userId!,
        exerciseId: exercise.id,
        answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
        feedback: result.feedback,
        score: result.score,
        isCorrect: result.isCorrect,
        attemptNumber: previousAttempts + 1,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: authReq.userId!,
        action: 'exercise_submitted',
        exerciseId: exercise.id,
        lessonId: exercise.lessonId,
        details: JSON.stringify({ score: result.score, isCorrect: result.isCorrect }),
      },
    });

    res.json({ submission });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
