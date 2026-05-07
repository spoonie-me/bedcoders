// @ts-nocheck
import { prisma } from './db.js';
import type { Request } from 'express';

export async function logAuditAction(
  userId: string | null,
  action: string,
  resourceId?: string,
  req?: Request,
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resourceId,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent'),
      status: 'success',
    },
  });
}

export async function requestDataExport(userId: string) {
  return prisma.dataExportRequest.create({
    data: {
      userId,
      status: 'pending',
    },
  });
}

export async function scheduleDataDeletion(userId: string) {
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 30);

  return prisma.dataDeletionRequest.create({
    data: {
      userId,
      scheduledAt,
      status: 'pending',
    },
  });
}

export async function executeDataDeletion(userId: string) {
  // Anonymize user
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted-${userId}@bedcoders.com`,
      passwordHash: 'DELETED',
      name: null,
      deletionRequestedAt: new Date(),
    },
  });

  // Delete personal data (keep audit logs for compliance)
  await prisma.userProfile.deleteMany({ where: { userId } });
  await prisma.submission.deleteMany({ where: { userId } });
  await prisma.lessonProgress.deleteMany({ where: { userId } });
  await prisma.gamification.deleteMany({ where: { userId } });
  await prisma.subscription.deleteMany({ where: { userId } });

  await prisma.dataDeletionRequest.updateMany({
    where: { userId, status: 'pending' },
    data: { status: 'completed', completedAt: new Date() },
  });
}
