-- CreateEnum
CREATE TYPE "InterestType" AS ENUM ('FIXED', 'FLOATING');

-- CreateEnum
CREATE TYPE "CompoundingFrequency" AS ENUM ('DAILY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "InterestCalculationMethod" AS ENUM ('SIMPLE', 'COMPOUND', 'REDUCING_BALANCE');

-- CreateEnum
CREATE TYPE "DayCountConvention" AS ENUM ('DAYS_365', 'DAYS_360');

-- CreateEnum
CREATE TYPE "MoratoriumInterestPayment" AS ENUM ('NONE', 'FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('EMI', 'EXTRA', 'INTEREST_ONLY', 'PRINCIPAL_ONLY', 'LUMP_SUM');

-- CreateEnum
CREATE TYPE "AmortizationStatus" AS ENUM ('PAID', 'PARTIAL', 'EXTRA_PAID', 'PENDING', 'MISSED', 'UPCOMING');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'CLOSED', 'DRAFT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "loanName" TEXT NOT NULL,
    "loanAccountNumber" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "principalAmount" DECIMAL(18,2) NOT NULL,
    "sanctionDate" TIMESTAMP(3) NOT NULL,
    "interestRate" DECIMAL(6,3) NOT NULL,
    "interestType" "InterestType" NOT NULL DEFAULT 'FIXED',
    "loanTenureMonths" INTEGER NOT NULL,
    "repaymentTenureMonths" INTEGER NOT NULL,
    "emiStartDate" TIMESTAMP(3),
    "targetClosureDate" TIMESTAMP(3),
    "hasMoratorium" BOOLEAN NOT NULL DEFAULT false,
    "studyStartDate" TIMESTAMP(3),
    "studyEndDate" TIMESTAMP(3),
    "moratoriumStartDate" TIMESTAMP(3),
    "moratoriumEndDate" TIMESTAMP(3),
    "courseDurationMonths" INTEGER,
    "gracePeriodMonths" INTEGER,
    "totalMoratoriumMonths" INTEGER,
    "moratoriumInterestPayment" "MoratoriumInterestPayment" NOT NULL DEFAULT 'NONE',
    "moratoriumAvgMonthlyInterest" DECIMAL(18,2),
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanSettings" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "compounding" "CompoundingFrequency" NOT NULL DEFAULT 'MONTHLY',
    "calculationMethod" "InterestCalculationMethod" NOT NULL DEFAULT 'REDUCING_BALANCE',
    "dayCountConvention" "DayCountConvention" NOT NULL DEFAULT 'DAYS_365',
    "emiReminder" BOOLEAN NOT NULL DEFAULT true,
    "interestReminder" BOOLEAN NOT NULL DEFAULT true,
    "monthlySummary" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LoanSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disbursement" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Disbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "type" "PaymentType" NOT NULL DEFAULT 'EMI',
    "interestPaid" DECIMAL(18,2),
    "principalPaid" DECIMAL(18,2),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amortizationEntryId" TEXT,
    "interestCovered" DECIMAL(18,2) NOT NULL,
    "principalCovered" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmortizationEntry" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "monthIndex" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "openingBalance" DECIMAL(18,2) NOT NULL,
    "interestAccrued" DECIMAL(18,2) NOT NULL,
    "interestPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "principalPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "emiAmount" DECIMAL(18,2) NOT NULL,
    "extraPayment" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "capitalizedInterest" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "closingBalance" DECIMAL(18,2) NOT NULL,
    "status" "AmortizationStatus" NOT NULL DEFAULT 'UPCOMING',

    CONSTRAINT "AmortizationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyInterestLog" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "outstandingBalance" DECIMAL(18,2) NOT NULL,
    "dailyRate" DECIMAL(10,8) NOT NULL,
    "accruedInterest" DECIMAL(18,2) NOT NULL,
    "cumulativeAccrued" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyInterestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Loan_userId_idx" ON "Loan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanSettings_loanId_key" ON "LoanSettings"("loanId");

-- CreateIndex
CREATE INDEX "Disbursement_loanId_idx" ON "Disbursement"("loanId");

-- CreateIndex
CREATE INDEX "Payment_loanId_idx" ON "Payment"("loanId");

-- CreateIndex
CREATE INDEX "Payment_date_idx" ON "Payment"("date");

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "AmortizationEntry_loanId_dueDate_idx" ON "AmortizationEntry"("loanId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "AmortizationEntry_loanId_monthIndex_key" ON "AmortizationEntry"("loanId", "monthIndex");

-- CreateIndex
CREATE INDEX "DailyInterestLog_loanId_date_idx" ON "DailyInterestLog"("loanId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyInterestLog_loanId_date_key" ON "DailyInterestLog"("loanId", "date");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanSettings" ADD CONSTRAINT "LoanSettings_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_amortizationEntryId_fkey" FOREIGN KEY ("amortizationEntryId") REFERENCES "AmortizationEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmortizationEntry" ADD CONSTRAINT "AmortizationEntry_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyInterestLog" ADD CONSTRAINT "DailyInterestLog_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
