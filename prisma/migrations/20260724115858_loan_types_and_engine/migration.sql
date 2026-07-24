-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('EDUCATION', 'BIKE', 'CAR', 'HOME', 'PERSONAL', 'GOLD', 'BUSINESS', 'OTHER');

-- CreateEnum
CREATE TYPE "InterestResetFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "EmiType" AS ENUM ('STANDARD', 'INTEREST_ONLY', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'WEEKLY', 'BIWEEKLY');

-- CreateEnum
CREATE TYPE "PrepaymentStrategy" AS ENUM ('REDUCE_TENURE', 'REDUCE_EMI');

-- AlterEnum
BEGIN;
CREATE TYPE "LoanStatus_new" AS ENUM ('NOT_STARTED', 'STUDY_PERIOD', 'MORATORIUM', 'EMI_STARTED', 'CLOSED');
ALTER TABLE "public"."Loan" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Loan" ALTER COLUMN "status" TYPE "LoanStatus_new" USING ("status"::text::"LoanStatus_new");
ALTER TYPE "LoanStatus" RENAME TO "LoanStatus_old";
ALTER TYPE "LoanStatus_new" RENAME TO "LoanStatus";
DROP TYPE "public"."LoanStatus_old";
ALTER TABLE "Loan" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
COMMIT;

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "capitalizeUnpaidInterest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emiType" "EmiType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "interestResetFrequency" "InterestResetFrequency",
ADD COLUMN     "loanApprovalDate" TIMESTAMP(3),
ADD COLUMN     "loanType" "LoanType" NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';

-- AlterTable
ALTER TABLE "LoanSettings" ADD COLUMN     "autoAccrueInterestDaily" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoCapitalizeMonthly" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoGenerateEmiMonthly" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoRefreshDashboard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "paymentFrequency" "PaymentFrequency" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "prepaymentStrategy" "PrepaymentStrategy" NOT NULL DEFAULT 'REDUCE_TENURE';

-- CreateTable
CREATE TABLE "LoanImportSnapshot" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "outstandingPrincipal" DECIMAL(18,2) NOT NULL,
    "accruedInterest" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lastInterestPostingDate" TIMESTAMP(3),
    "lastEmiPaidDate" TIMESTAMP(3),
    "totalInterestPaidSoFar" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalPrincipalPaidSoFar" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanImportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoanImportSnapshot_loanId_key" ON "LoanImportSnapshot"("loanId");

-- AddForeignKey
ALTER TABLE "LoanImportSnapshot" ADD CONSTRAINT "LoanImportSnapshot_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

