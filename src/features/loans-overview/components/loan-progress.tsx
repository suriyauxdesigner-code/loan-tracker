"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { CircularProgress } from "@/components/ui/circular-progress";
import { IconContainer } from "@/components/ui/icon-container";

export function LoanProgress({
  principalProgressPct,
  interestProgressPct,
  completionPct,
}: {
  principalProgressPct: number;
  interestProgressPct: number;
  completionPct: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <IconContainer icon={TrendingUp} tone="violet" size="sm" />
            <CardTitle className="text-base">Loan Progress</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <CircularProgress value={completionPct} label="Completed" />
          <div className="flex-1 space-y-4">
            <Progress value={principalProgressPct}>
              <div className="flex justify-between">
                <ProgressLabel>Principal Repaid</ProgressLabel>
                <ProgressValue />
              </div>
            </Progress>
            <Progress value={interestProgressPct}>
              <div className="flex justify-between">
                <ProgressLabel>Interest Paid (of total payable)</ProgressLabel>
                <ProgressValue />
              </div>
            </Progress>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
