"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { IconContainer, type IconTone } from "@/components/ui/icon-container";
import { Sparkline } from "@/components/ui/sparkline";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  icon: LucideIcon;
  tone?: IconTone;
  label: string;
  value: string;
  description?: string;
  sparklineData?: number[];
  href?: string;
  size?: "default" | "hero";
  className?: string;
}

export function MetricCard({
  icon,
  tone = "violet",
  label,
  value,
  description,
  sparklineData,
  href,
  size = "default",
  className,
}: MetricCardProps) {
  const isHero = size === "hero";

  const body = (
    <Card
      className={cn(
        "h-full transition-shadow duration-200",
        href && "hover:shadow-hover cursor-pointer",
      )}
    >
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium">{label}</p>
            <p
              className={cn(
                "truncate font-semibold tracking-tight tabular-nums",
                isHero ? "text-3xl sm:text-4xl" : "text-2xl",
              )}
            >
              {value}
            </p>
          </div>
          <IconContainer icon={icon} tone={tone} size={isHero ? "lg" : "default"} />
        </div>

        {description && <p className="text-muted-foreground text-xs">{description}</p>}

        {sparklineData && sparklineData.length > 1 && (
          <div className="mt-auto -mb-1">
            <Sparkline data={sparklineData} tone={tone} height={isHero ? 56 : 36} />
          </div>
        )}
      </CardContent>
    </Card>
  );

  const wrapped = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={href ? { y: -3 } : undefined}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("h-full", className)}
    >
      {body}
    </motion.div>
  );

  return href ? <Link href={href}>{wrapped}</Link> : wrapped;
}
