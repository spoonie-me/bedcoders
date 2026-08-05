-- CreateTable
CREATE TABLE "bedcoders"."CredentialPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "bundleId" TEXT,
    "stripeSessionId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CredentialPurchase_stripeSessionId_key" ON "bedcoders"."CredentialPurchase"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialPurchase_userId_trackId_key" ON "bedcoders"."CredentialPurchase"("userId", "trackId");

-- AddForeignKey
ALTER TABLE "bedcoders"."CredentialPurchase" ADD CONSTRAINT "CredentialPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "bedcoders"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
