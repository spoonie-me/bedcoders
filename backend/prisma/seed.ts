import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(__dirname, path), 'utf-8'));
}

/** Safely stringify a value for SQLite string-JSON columns. */
function toJson(val: unknown): string {
  if (val === undefined || val === null) return '{}';
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
}

function toJsonArray(val: unknown): string {
  if (Array.isArray(val)) return JSON.stringify(val);
  return '[]';
}

// exercises.json uses numeric 1-5, schema uses string
function difficultyLabel(n: number): string {
  if (n <= 2) return 'easy';
  if (n <= 3) return 'medium';
  if (n <= 4) return 'hard';
  return 'expert';
}

async function main() {
  console.log('Seeding Medinformics database...\n');

  // ─── 1. Seed Badges ──────────────────────────────────────────────────
  const badges = loadJson<any[]>('seed-data/badges.json');
  console.log(`Seeding ${badges.length} badges...`);
  for (const badge of badges) {
    const category = badge.criteria?.type || 'milestone';
    await prisma.badge.upsert({
      where: { key: badge.id },
      update: {},
      create: {
        key: badge.id,
        name: badge.name,
        description: badge.description,
        tier: badge.tier,
        icon: badge.icon,
        category,
        criteria: toJson(badge.criteria),
      },
    });
  }
  console.log(`  ${badges.length} badges seeded\n`);

  // ─── 2. Seed all tracks ──────────────────────────────────────────────
  const trackIds = ['fundamentals', 'ai', 'tools', 'advanced'];

  for (const trackId of trackIds) {
    let domains: any[];
    try {
      domains = loadJson<any[]>(`seed-data/domains/${trackId}/domains.json`);
    } catch {
      console.log(`No domains.json for track ${trackId}, skipping`);
      continue;
    }

    console.log(`\nSeeding track "${trackId}" (${domains.length} domains)...`);

    for (const domainData of domains) {
      const domain = await prisma.competencyDomain.upsert({
        where: {
          trackId_order: {
            trackId,
            order: domainData.order,
          },
        },
        update: {
          name: domainData.name,
          description: domainData.description,
        },
        create: {
          trackId,
          name: domainData.name,
          description: domainData.description,
          order: domainData.order,
        },
      });

      console.log(`  Domain: ${domain.name}`);

      const domainSlug = domainData.slug;
      if (!domainSlug) continue;

      try {
        const modules = loadJson<any[]>(
          `seed-data/domains/${trackId}/${domainSlug}/modules.json`,
        );

        for (const moduleData of modules) {
          const mod = await prisma.module.upsert({
            where: { id: moduleData.id },
            update: {
              title: moduleData.title,
              description: moduleData.description,
              tier: moduleData.tier,
              bloomLevel: moduleData.bloomLevel,
              order: moduleData.order,
              isPublished: true,
            },
            create: {
              id: moduleData.id,
              domainId: domain.id,
              title: moduleData.title,
              description: moduleData.description,
              tier: moduleData.tier,
              bloomLevel: moduleData.bloomLevel,
              order: moduleData.order,
              isPublished: true,
            },
          });

          console.log(`    Module: ${mod.title} (${mod.tier})`);
        }

        // Load lessons
        try {
          const lessons = loadJson<any[]>(
            `seed-data/domains/${trackId}/${domainSlug}/lessons.json`,
          );

          for (const lessonData of lessons) {
            await prisma.lesson.upsert({
              where: { id: lessonData.id },
              update: {
                title: lessonData.title,
                description: lessonData.description || '',
                learningObjectives: toJson(lessonData.learningObjectives),
                contentSections: toJson(lessonData.contentSections),
                duration: lessonData.duration,
                difficulty: lessonData.difficulty || 'medium',
                order: lessonData.order,
                isPublished: true,
                publishedAt: new Date(),
              },
              create: {
                id: lessonData.id,
                moduleId: lessonData.moduleId,
                title: lessonData.title,
                description: lessonData.description || '',
                learningObjectives: toJson(lessonData.learningObjectives),
                contentSections: toJson(lessonData.contentSections),
                duration: lessonData.duration,
                difficulty: lessonData.difficulty || 'medium',
                order: lessonData.order,
                isPublished: true,
                publishedAt: new Date(),
              },
            });
          }
          console.log(`    ${lessons.length} lessons loaded`);
        } catch {
          console.log(`    No lessons.json for ${domainSlug}`);
        }

        // Load exercises — resolve lessonId from module+order if available
        try {
          const exercises = loadJson<any[]>(
            `seed-data/domains/${trackId}/${domainSlug}/exercises.json`,
          );

          // Build a lookup: moduleId → array of lesson IDs (ordered by lesson.order)
          const lessonsByModule = new Map<string, string[]>();
          const allLessons = await prisma.lesson.findMany({
            where: { module: { domainId: domain.id } },
            select: { id: true, moduleId: true, order: true },
            orderBy: { order: 'asc' },
          });
          for (const l of allLessons) {
            if (!lessonsByModule.has(l.moduleId)) lessonsByModule.set(l.moduleId, []);
            lessonsByModule.get(l.moduleId)!.push(l.id);
          }

          // Build a lookup: moduleId → DB module id (for exercises that only have moduleId)
          const allModules = await prisma.module.findMany({
            where: { domainId: domain.id },
            select: { id: true },
          });
          const moduleIdSet = new Set(allModules.map((m) => m.id));

          for (let i = 0; i < exercises.length; i++) {
            const ex = exercises[i];

            // Resolve lessonId: prefer explicit lessonId, then derive from moduleId
            let resolvedLessonId: string | undefined = ex.lessonId ?? undefined;
            if (!resolvedLessonId && ex.moduleId && moduleIdSet.has(ex.moduleId)) {
              const lessonsInModule = lessonsByModule.get(ex.moduleId) ?? [];
              // Use lessonOrder if provided, otherwise fall back to first lesson in module
              const lessonIdx = ex.lessonOrder != null ? ex.lessonOrder - 1 : 0;
              resolvedLessonId = lessonsInModule[lessonIdx] ?? lessonsInModule[0];
            }

            if (!resolvedLessonId) {
              console.warn(`[seed] Exercise ref=${ex.ref} has no resolvable lessonId (moduleId=${ex.moduleId}). It will be seeded with lessonId=null and won't appear in lesson views.`);
            }

            await prisma.exercise.upsert({
              where: { ref: ex.ref },
              update: {
                prompt: ex.prompt,
                type: ex.type,
                config: toJson(ex.config),
                hints: toJsonArray(ex.hints),
                explanation: ex.explanation,
                difficulty: difficultyLabel(ex.difficulty),
                bloomLevel: ex.bloomLevel,
                domainId: domain.id,
                lessonId: resolvedLessonId ?? null,
                timeEstimate: (ex.timeEstimate || 2) * 60,
                xpReward: ex.xpReward || 10,
                isKnowledgeCheck: ex.isKnowledgeCheck || false,
                tags: toJsonArray(ex.tags),
              },
              create: {
                ref: ex.ref,
                prompt: ex.prompt,
                type: ex.type,
                config: toJson(ex.config),
                hints: toJsonArray(ex.hints),
                explanation: ex.explanation,
                difficulty: difficultyLabel(ex.difficulty),
                bloomLevel: ex.bloomLevel,
                domainId: domain.id,
                lessonId: resolvedLessonId ?? null,
                timeEstimate: (ex.timeEstimate || 2) * 60,
                xpReward: ex.xpReward || 10,
                isKnowledgeCheck: ex.isKnowledgeCheck || false,
                order: i + 1,
                tags: toJsonArray(ex.tags),
              },
            });
          }
          console.log(`    ${exercises.length} exercises loaded`);
        } catch {
          console.log(`    No exercises.json for ${domainSlug}`);
        }
      } catch {
        console.log(`    No detailed data for ${domainSlug}`);
      }
    }
  }

  // ─── 3. Create Track Exams ────────────────────────────────────────────
  const tracks = loadJson<any[]>('seed-data/tracks.json');

  console.log(`\nSeeding track exams...`);
  for (const track of tracks) {
    await prisma.trackExam.upsert({
      where: { trackId: track.id },
      update: {
        title: `${track.title} Certification Exam`,
        timeLimit: track.examTimeLimit,
        passScore: track.examPassScore,
        questionCount: track.examQuestionCount,
      },
      create: {
        trackId: track.id,
        title: `${track.title} Certification Exam`,
        description: `Final certification exam for the ${track.title} track. Timed, ${track.examQuestionCount} questions, ${track.examPassScore}% to pass.`,
        timeLimit: track.examTimeLimit,
        passScore: track.examPassScore,
        questionCount: track.examQuestionCount,
      },
    });
    console.log(`  ${track.title} exam (${track.examQuestionCount}q, ${track.examTimeLimit}min)`);
  }

  // ─── Summary ──────────────────────────────────────────────────────────
  const counts = {
    domains: await prisma.competencyDomain.count(),
    modules: await prisma.module.count(),
    lessons: await prisma.lesson.count(),
    exercises: await prisma.exercise.count(),
    badges: await prisma.badge.count(),
    exams: await prisma.trackExam.count(),
  };

  console.log(`\nSeed complete!`);
  console.log(`  ${counts.domains} domains`);
  console.log(`  ${counts.modules} modules`);
  console.log(`  ${counts.lessons} lessons`);
  console.log(`  ${counts.exercises} exercises`);
  console.log(`  ${counts.badges} badges`);
  console.log(`  ${counts.exams} track exams`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
