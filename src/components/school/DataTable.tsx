import React from 'react';
import { cn } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface Column {
  key: string;
  title: string;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  className?: string;
  onRowClick?: (row: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({ columns, data, className = '', onRowClick }) => {
  return (
    <div
      className={cn(
        "bg-[var(--glass-bg)] backdrop-blur-[20px] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--glass-shadow)] overflow-hidden",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <Table className="w-full border-collapse">
          <TableHeader className="bg-violet-600/[0.03] sticky top-0 z-10">
            <TableRow className="border-b-0 hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className="h-auto px-4 py-2.5 text-left text-[0.688rem] font-semibold text-[var(--gray-500)] uppercase tracking-wide whitespace-nowrap border-b border-[var(--gray-100)]"
                >
                  {col.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow
                key={row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b-0 transition-colors duration-150 hover:bg-violet-600/[0.02] last:[&>td]:border-b-0",
                  onRowClick ? "cursor-pointer" : "",
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className="px-4 py-2.5 text-[0.813rem] text-[var(--gray-700)] border-b border-[var(--gray-50)] whitespace-nowrap"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DataTable;
