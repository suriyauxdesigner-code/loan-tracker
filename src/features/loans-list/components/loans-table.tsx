"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, FileText, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LoanSummaryRow } from "@/features/overview/aggregate-metrics";
import type { LoanStage } from "@/features/loans/stage";

const STAGE_LABEL: Record<LoanStage, string> = {
  CREATED: "Created",
  DISBURSEMENT: "Disbursement",
  STUDY_PERIOD: "Study period",
  MORATORIUM: "Moratorium",
  REPAYMENT: "Repayment",
  CLOSED: "Closed",
};

const STAGE_VARIANT: Record<LoanStage, "default" | "secondary" | "outline"> = {
  CREATED: "secondary",
  DISBURSEMENT: "secondary",
  STUDY_PERIOD: "secondary",
  MORATORIUM: "secondary",
  REPAYMENT: "default",
  CLOSED: "outline",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-muted-foreground text-xs tabular-nums">{clamped.toFixed(0)}%</span>
    </div>
  );
}

export function LoansTable({ rows }: { rows: LoanSummaryRow[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const loanTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.loanType))), [rows]);

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          (stageFilter === "all" || r.stage === stageFilter) &&
          (typeFilter === "all" || r.loanType === typeFilter),
      ),
    [rows, stageFilter, typeFilter],
  );

  const columns: ColumnDef<LoanSummaryRow>[] = useMemo(
    () => [
      {
        id: "loanName",
        header: "Loan",
        accessorKey: "loanName",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.loanName}</p>
            {row.original.loanAccountNumber && (
              <p className="text-muted-foreground text-xs">{row.original.loanAccountNumber}</p>
            )}
          </div>
        ),
      },
      { id: "bankName", header: "Bank", accessorKey: "bankName" },
      {
        id: "outstanding",
        header: "Outstanding",
        accessorFn: (r) => Number(r.outstanding),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.currency} {row.original.outstanding}
          </span>
        ),
      },
      {
        id: "interestRate",
        header: "Interest Rate",
        accessorFn: (r) => Number(r.interestRate),
        cell: ({ row }) => <span className="tabular-nums">{row.original.interestRate}%</span>,
      },
      {
        id: "monthlyEmi",
        header: "Monthly EMI",
        accessorFn: (r) => (r.monthlyEmi ? Number(r.monthlyEmi) : -1),
        cell: ({ row }) =>
          row.original.monthlyEmi ? (
            <span className="tabular-nums">
              {row.original.currency} {row.original.monthlyEmi}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (r) => r.stage,
        cell: ({ row }) => (
          <Badge variant={STAGE_VARIANT[row.original.stage]}>{STAGE_LABEL[row.original.stage]}</Badge>
        ),
      },
      {
        id: "progress",
        header: "Progress",
        accessorFn: (r) => r.completionPct,
        cell: ({ row }) => <ProgressBar value={row.original.completionPct} />,
      },
      {
        id: "nextEmi",
        header: "Next EMI",
        accessorFn: (r) => r.nextEmiDate ?? "",
        cell: ({ row }) =>
          row.original.nextEmiDate ? (
            <span>{fmtDate(row.original.nextEmiDate)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-sm"
              render={<Link href={`/finance/loans/${row.original.loanId}/details`} />}
              aria-label="View details"
            >
              <FileText />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              render={<Link href={`/finance/loans/${row.original.loanId}/schedule`} />}
              aria-label="View schedule"
            >
              <ListChecks />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search loans…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-64"
        />
        <Select value={stageFilter} onValueChange={(v) => setStageFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STAGE_LABEL) as LoanStage[]).map((stage) => (
              <SelectItem key={stage} value={stage}>
                {STAGE_LABEL[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {loanTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replaceAll("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="max-h-[32rem] overflow-y-auto">
          <Table>
            <TableHeader className="bg-card sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="cursor-pointer whitespace-nowrap select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() &&
                          (header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="size-3" />
                          ) : (
                            <ArrowUpDown className="text-muted-foreground/50 size-3" />
                          ))}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-muted-foreground text-center">
                    No loans match your filters.
                  </TableCell>
                </TableRow>
              )}
              {table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  className={cnRow(i)}
                  onClick={() => router.push(`/finance/loans/${row.original.loanId}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function cnRow(index: number) {
  return `cursor-pointer transition-colors hover:bg-muted/50 ${index % 2 === 1 ? "bg-muted/20" : ""}`;
}
