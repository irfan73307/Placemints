/**
 * Table Component
 * 
 * Purpose:
 * Generic data table component that automatically transitions from standard <table> on screens >= 768px
 * into a stacked list of structured cards on screens < 768px for optimal mobile usability.
 * 
 * Props:
 * `columns`: Array of { header: string, accessor: string | function, cell?: function, width?: string }
 * `rows`: Array of data objects
 * 
 * Future Backend Integration:
 * Used for rendering lists such as PYQs (Past Year Questions) from GET /api/companies/:id/pyqs.
 */

import React from 'react';
import { cn } from '../utils/cn';

export function Table({ columns = [], rows = [], emptyMessage = 'No data available', className }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop & Tablet Table (>= 768px) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className="px-5 py-3.5" style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIdx) => (
              <tr key={row.id || rowIdx} className="hover:bg-slate-50/80 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-5 py-4 text-slate-700 font-medium">
                    {col.cell
                      ? col.cell(row)
                      : typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (< 768px) */}
      <div className="md:hidden space-y-3">
        {rows.map((row, rowIdx) => (
          <div
            key={row.id || rowIdx}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-card space-y-2 text-sm"
          >
            {columns.map((col, colIdx) => {
              const value = col.cell
                ? col.cell(row)
                : typeof col.accessor === 'function'
                ? col.accessor(row)
                : row[col.accessor];

              return (
                <div key={colIdx} className="flex justify-between items-start gap-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 pt-0.5">
                    {col.header}:
                  </span>
                  <div className="text-right text-slate-800 font-medium">{value}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Table;
