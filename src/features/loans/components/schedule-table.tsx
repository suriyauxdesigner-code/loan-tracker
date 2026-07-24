"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const COLUMN_LABELS: Record<string, string> = {
  monthIndex: "#",
  dueDate: "Due Date",
  openingBalance: "Opening Balance",
  interestAccrued: "Interest Accrued",
  capitalizedInterest: "Interest Capitalized",
  interestPaid: "Interest Paid",
  principalPaid: "Principal Paid",
  emiAmount: "EMI",
  extraPayment: "Extra Payment",
  closingBalance: "Closing Balance",
  remainingTenure: "Remaining Tenure",
  status: "Status",
  paymentDate: "Payment Date",
  daysLate: "Days Late",
  runningInterest: "Running Interest",
  notes: "Notes",
};

function noteFor(entry: SerializedEntry): string {
  if (entry.status === "MISSED") return "Missed — carried forward";
  if (Number(entry.capitalizedInterest) > 0) return "Interest capitalized";
  if (Number(entry.extraPayment) > 0) return "Extra payment applied";
  if (entry.status === "UPCOMING") return "Projected";
  return "";
}

function toCsvValue(value: unknown): string {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function ScheduleTable({
  entries,
  currency,
}: {
  entries: SerializedEntry[];
  currency: string;
}) {
  const [selected, setSelected] = useState<SerializedEntry | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const runningInterest = useMemo(() => {
    let running = 0;
    const map = new Map<number, number>();
    for (const e of entries) {
      running += Number(e.interestAccrued);
      map.set(e.monthIndex, running);
    }
    return map;
  }, [entries]);

  const columns: ColumnDef<SerializedEntry>[] = useMemo(
    () => [
      { id: "monthIndex", header: "#", accessorKey: "monthIndex" },
      {
        id: "dueDate",
        header: "Due Date",
        accessorFn: (e) => new Date(e.dueDate).toLocaleDateString("en-IN"),
      },
      { id: "openingBalance", header: "Opening Balance", accessorKey: "openingBalance" },
      { id: "interestAccrued", header: "Interest Accrued", accessorKey: "interestAccrued" },
      {
        id: "capitalizedInterest",
        header: "Interest Capitalized",
        accessorKey: "capitalizedInterest",
      },
      { id: "interestPaid", header: "Interest Paid", accessorKey: "interestPaid" },
      { id: "principalPaid", header: "Principal Paid", accessorKey: "principalPaid" },
      { id: "emiAmount", header: "EMI", accessorKey: "emiAmount" },
      { id: "extraPayment", header: "Extra Payment", accessorKey: "extraPayment" },
      { id: "closingBalance", header: "Closing Balance", accessorKey: "closingBalance" },
      {
        id: "remainingTenure",
        header: "Remaining Tenure",
        accessorFn: (e) => entries.length - e.monthIndex,
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (e) => e.status,
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>
            {row.original.status.replaceAll("_", " ")}
          </Badge>
        ),
      },
      {
        id: "paymentDate",
        header: "Payment Date",
        accessorFn: (e) =>
          e.paymentDate ? new Date(e.paymentDate).toLocaleDateString("en-IN") : "—",
      },
      {
        id: "daysLate",
        header: "Days Late",
        accessorFn: (e) => (e.daysLate != null && e.daysLate > 0 ? e.daysLate : "—"),
      },
      {
        id: "runningInterest",
        header: "Running Interest",
        accessorFn: (e) => runningInterest.get(e.monthIndex)?.toFixed(2) ?? "—",
      },
      { id: "notes", header: "Notes", accessorFn: (e) => noteFor(e) },
    ],
    [entries.length, runningInterest],
  );

  const table = useReactTable({
    data: entries,
    columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 12 } },
  });

  function exportCsv() {
    const visibleColumns = table.getVisibleLeafColumns();
    const header = visibleColumns.map((c) => toCsvValue(COLUMN_LABELS[c.id] ?? c.id));
    const rows = table
      .getFilteredRowModel()
      .rows.map((row) =>
        visibleColumns
          .map((c) => toCsvValue(row.getValue(c.id)))
          .join(","),
      );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "emi-schedule.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <Input
          placeholder="Search schedule…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-64"
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm">
                <SlidersHorizontal />
                Columns
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {table.getAllLeafColumns().map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
              >
                {COLUMN_LABELS[column.id] ?? column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={exportCsv} className="ml-auto">
          <Download />
          Export CSV
        </Button>
      </div>

      <div className="max-h-[32rem] overflow-y-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-background sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
                  No matching rows.
                </TableCell>
              </TableRow>
            )}
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

      <div className="flex items-center justify-between pt-3">
        <p className="text-muted-foreground text-sm">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {Math.max(1, table.getPageCount())} · {table.getFilteredRowModel().rows.length} rows
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <CalculationDrawer
        entry={selected}
        currency={currency}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}
