-- Hiring layer: learner-owned talent profiles, employer accounts, directory,
-- job board, intro requests. See docs/HIRING_DATA_POLICY.md.
--
-- Note on schema qualification: schema.prisma declares `schemas = ["bedcoders"]`
-- and every model carries @@schema("bedcoders"), so all objects below are
-- created there. The 0_init baseline predates that move and is unqualified;
-- it is not re-runnable and is kept only as history.

CREATE SCHEMA IF NOT EXISTS "bedcoders";

-- CreateTable
CREATE TABLE "bedcoders"."TalentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicHandle" TEXT NOT NULL,
    "isDiscoverable" BOOLEAN NOT NULL DEFAULT false,
    "discoverableAt" TIMESTAMP(3),
    "headline" TEXT,
    "summary" TEXT,
    "pronouns" TEXT,
    "openToWork" BOOLEAN NOT NULL DEFAULT false,
    "hoursPerWeekMin" INTEGER,
    "hoursPerWeekMax" INTEGER,
    "wantsRemote" BOOLEAN NOT NULL DEFAULT true,
    "wantsAsync" BOOLEAN NOT NULL DEFAULT false,
    "wantsPartTime" BOOLEAN NOT NULL DEFAULT false,
    "wantsFlexHours" BOOLEAN NOT NULL DEFAULT false,
    "wantsContract" BOOLEAN NOT NULL DEFAULT false,
    "earliestStart" TIMESTAMP(3),
    "showRealName" BOOLEAN NOT NULL DEFAULT false,
    "showCountry" BOOLEAN NOT NULL DEFAULT false,
    "showTimeZone" BOOLEAN NOT NULL DEFAULT false,
    "showPortfolio" BOOLEAN NOT NULL DEFAULT false,
    "showCertificates" BOOLEAN NOT NULL DEFAULT false,
    "showMastery" BOOLEAN NOT NULL DEFAULT false,
    "showLinks" BOOLEAN NOT NULL DEFAULT false,
    "links" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bedcoders"."PortfolioProject" (
    "id" TEXT NOT NULL,
    "talentProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'self',
    "moduleId" TEXT,
    "repoUrl" TEXT,
    "liveUrl" TEXT,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bedcoders"."Company" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "size" TEXT,
    "location" TEXT,
    "remotePolicy" TEXT,
    "asyncFriendly" BOOLEAN NOT NULL DEFAULT false,
    "flexibleHours" BOOLEAN NOT NULL DEFAULT false,
    "partTimeOpen" BOOLEAN NOT NULL DEFAULT false,
    "accommodationsStatement" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bedcoders"."EmployerAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "jobTitle" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "EmployerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bedcoders"."JobPosting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT true,
    "isAsyncFriendly" BOOLEAN NOT NULL DEFAULT false,
    "hasFlexibleHours" BOOLEAN NOT NULL DEFAULT false,
    "employmentType" TEXT NOT NULL DEFAULT 'full_time',
    "hoursPerWeekMin" INTEGER,
    "hoursPerWeekMax" INTEGER,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "salaryPeriod" TEXT NOT NULL DEFAULT 'year',
    "skills" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bedcoders"."IntroRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employerAccountId" TEXT NOT NULL,
    "talentProfileId" TEXT NOT NULL,
    "jobPostingId" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "respondedAt" TIMESTAMP(3),
    "contactReleasedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntroRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bedcoders"."JobApplication" (
    "id" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "talentProfileId" TEXT NOT NULL,
    "coverNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bedcoders"."SkillDemandSignal" (
    "id" TEXT NOT NULL,
    "skillKey" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "postedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillDemandSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_userId_key" ON "bedcoders"."TalentProfile"("userId");
CREATE UNIQUE INDEX "TalentProfile_publicHandle_key" ON "bedcoders"."TalentProfile"("publicHandle");
CREATE INDEX "TalentProfile_isDiscoverable_openToWork_idx" ON "bedcoders"."TalentProfile"("isDiscoverable", "openToWork");
CREATE INDEX "PortfolioProject_talentProfileId_order_idx" ON "bedcoders"."PortfolioProject"("talentProfileId", "order");
CREATE UNIQUE INDEX "Company_slug_key" ON "bedcoders"."Company"("slug");
CREATE UNIQUE INDEX "EmployerAccount_email_key" ON "bedcoders"."EmployerAccount"("email");
CREATE INDEX "EmployerAccount_companyId_idx" ON "bedcoders"."EmployerAccount"("companyId");
CREATE INDEX "JobPosting_status_publishedAt_idx" ON "bedcoders"."JobPosting"("status", "publishedAt");
CREATE INDEX "JobPosting_companyId_status_idx" ON "bedcoders"."JobPosting"("companyId", "status");
CREATE INDEX "IntroRequest_talentProfileId_status_idx" ON "bedcoders"."IntroRequest"("talentProfileId", "status");
CREATE INDEX "IntroRequest_companyId_status_idx" ON "bedcoders"."IntroRequest"("companyId", "status");
CREATE UNIQUE INDEX "JobApplication_jobPostingId_talentProfileId_key" ON "bedcoders"."JobApplication"("jobPostingId", "talentProfileId");
CREATE INDEX "JobApplication_talentProfileId_status_idx" ON "bedcoders"."JobApplication"("talentProfileId", "status");
CREATE UNIQUE INDEX "SkillDemandSignal_skillKey_key" ON "bedcoders"."SkillDemandSignal"("skillKey");
CREATE INDEX "SkillDemandSignal_searchCount_idx" ON "bedcoders"."SkillDemandSignal"("searchCount");

-- AddForeignKey
ALTER TABLE "bedcoders"."TalentProfile" ADD CONSTRAINT "TalentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "bedcoders"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bedcoders"."PortfolioProject" ADD CONSTRAINT "PortfolioProject_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "bedcoders"."TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bedcoders"."EmployerAccount" ADD CONSTRAINT "EmployerAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "bedcoders"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bedcoders"."JobPosting" ADD CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "bedcoders"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bedcoders"."IntroRequest" ADD CONSTRAINT "IntroRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "bedcoders"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bedcoders"."IntroRequest" ADD CONSTRAINT "IntroRequest_employerAccountId_fkey" FOREIGN KEY ("employerAccountId") REFERENCES "bedcoders"."EmployerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bedcoders"."IntroRequest" ADD CONSTRAINT "IntroRequest_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "bedcoders"."TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bedcoders"."IntroRequest" ADD CONSTRAINT "IntroRequest_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "bedcoders"."JobPosting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bedcoders"."JobApplication" ADD CONSTRAINT "JobApplication_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "bedcoders"."JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bedcoders"."JobApplication" ADD CONSTRAINT "JobApplication_talentProfileId_fkey" FOREIGN KEY ("talentProfileId") REFERENCES "bedcoders"."TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
