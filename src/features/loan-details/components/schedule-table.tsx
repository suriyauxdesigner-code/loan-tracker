"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalculationDrawer } from "./calculation-drawer";
import type { SerializedEntry } from "../serialize";

const STATUS_VARIANT: Record<
  SerializedEntry["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  PAID: "default",
  EXTRA_PAID: "default",
  PARTIAL: "secondary",
  PENDING: "secondary",
  UPCOMING: "outline",
  MISSED: "destructive",
};

function noteFor(entry: SerializedEntry): string {
  if (entry.status === "MISSED") return "Missed — carried forward";
  if (Number(entry.capitalizedInterest) > 0) return "Interest capitalized";
  if (Number(entry.extraPayment) > 0) return "Extra payment applied";
  if (entry.status === "UPCOMING") return "Projected";
  return "";
}

export function ScheduleTable({
  entries,
  currency,
}: {
  entries: SerializedEntry[];
  currency: string;
}) {
  const [selected, setSelected] = useState<SerializedEntry | null>(null);
  const runningInterest = useMemo(() => {
    let running = 0;
    const map = new Map<number, number>();
    for (const e of entries) {
      running += Number(e.interestAccrued);
      map.set(e.monthIndex, running);
    }
    return map;
  }, [entries]);

  const columns: ColumnDef<SerializedEntry>[] = [
    { header: "#", accessorKey: "monthIndex" },
    {
      header: "Due Date",
      accessorFn: (e) => new Date(e.dueDate).toLocaleDateString("en-IN"),
    },
    { header: "Opening Balance", accessorKey: "openingBalance" },
    { header: "Interest Accrued", accessorKey: "interestAccrued" },
    { header: "Interest Capitalized", accessorKey: "capitalizedInterest" },
    { header: "Interest Paid", accessorKey: "interestPaid" },
    { header: "Principal Paid", accessorKey: "principalPaid" },
    { header: "EMI", accessorKey: "emiAmount" },
    { header: "Extra Payment", accessorKey: "extraPayment" },
    { header: "Closing Balance", accessorKey: "closingBalance" },
    {
      header: "Remaining Tenure",
      accessorFn: (e) => entries.length - e.monthIndex,
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {row.original.status.replaceAll("_", " ")}
        </Badge>
      ),
    },
    {
      header: "Payment Date",
      accessorFn: (e) =>
        e.paymentDate ? new Date(e.paymentDate).toLocaleDateString("en-IN") : "—",
    },
    {
      header: "Days Late",
      accessorFn: (e) => (e.daysLate != null && e.daysLate > 0 ? e.daysLate : "—"),
    },
    {
      header: "Running Interest",
      accessorFn: (e) => runningInterest.get(e.monthIndex)?.toFixed(2) ?? "—",
    },
    { header: "Notes", cell: ({ row }) => noteFor(row.original) },
  ];

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="max-h-[32rem] overflow-y-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-background sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-muted/40 cursor-pointer"
                onClick={() => setSelected(row.original)}
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
      <CalculationDrawer
        entry={selected}
        currency={currency}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}
