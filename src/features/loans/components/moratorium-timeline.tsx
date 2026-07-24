function fmtDate(d: Date | null) {
  return d
    ? d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : "—";
}

interface Segment {
  label: string;
  start: Date;
  end: Date;
  tone: "sky" | "amber" | "emerald";
}

export function MoratoriumTimeline({
  studyStartDate,
  studyEndDate,
  moratoriumStartDate,
  moratoriumEndDate,
  emiStartDate,
  now,
}: {
  studyStartDate: Date | null;
  studyEndDate: Date | null;
  moratoriumStartDate: Date | null;
  moratoriumEndDate: Date | null;
  emiStartDate: Date | null;
  now: Date;
}) {
  const segments: Segment[] = [];

  if (studyStartDate && studyEndDate) {
    segments.push({ label: "Study Period", start: studyStartDate, end: studyEndDate, tone: "sky" });
  }
  if (studyEndDate && moratoriumStartDate && moratoriumStartDate > studyEndDate) {
    segments.push({
      label: "Grace Period",
      start: studyEndDate,
      end: moratoriumStartDate,
      tone: "amber",
    });
  }
  if (moratoriumStartDate && moratoriumEndDate) {
    segments.push({
      label: "Moratorium",
      start: moratoriumStartDate,
      end: moratoriumEndDate,
      tone: "amber",
    });
  }

  if (segments.length === 0) return null;

  const rangeStart = segments[0].start;
  const rangeEnd = emiStartDate ?? segments[segments.length - 1].end;
  const totalMs = Math.max(1, rangeEnd.getTime() - rangeStart.getTime());
  const nowPct =
    now >= rangeStart && now <= rangeEnd
      ? ((now.getTime() - rangeStart.getTime()) / totalMs) * 100
      : null;

  const TONE_BG: Record<Segment["tone"], string> = {
    sky: "bg-sky-500/70",
    amber: "bg-amber-500/70",
    emerald: "bg-emerald-500/70",
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex h-3 w-full overflow-hidden rounded-full">
        {segments.map((s, i) => {
          const widthPct = ((s.end.getTime() - s.start.getTime()) / totalMs) * 100;
          return (
            <div
              key={i}
              className={TONE_BG[s.tone]}
              style={{ width: `${widthPct}%` }}
              title={`${s.label}: ${fmtDate(s.start)} – ${fmtDate(s.end)}`}
            />
          );
        })}
        {nowPct != null && (
          <div
            className="bg-foreground absolute top-0 h-full w-0.5"
            style={{ left: `${nowPct}%` }}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className={`size-2 rounded-full ${TONE_BG[s.tone]}`} />
            <span className="font-medium">{s.label}</span>
            <span className="text-muted-foreground">
              {fmtDate(s.start)} – {fmtDate(s.end)}
            </span>
          </div>
        ))}
        {emiStartDate && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="bg-primary size-2 rounded-full" />
            <span className="font-medium">Repayment Starts</span>
            <span className="text-muted-foreground">{fmtDate(emiStartDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
