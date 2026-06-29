import React from 'react';

const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  stickyHeader = false,
  render,
}) => {
  const allSelected = selectable && data.length > 0 && selectedRows.length === data.length;
  
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 ${className}`}>
      <table className="w-full">
        <thead className={stickyHeader ? 'sticky top-0 bg-gray-50 z-10' : 'bg-gray-50'}>
          <tr>
            {selectable && (
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${
                  column.width ? `w-[${column.width}]` : ''
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {loading ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-6 py-12">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-6 py-12">
                <div className="flex flex-col items-center justify-center space-y-3 text-gray-500">
                  <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm font-medium">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id || rowIndex)}
                      onChange={() => onSelectRow?.(row.id || rowIndex)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-gray-700">
                    {render ? render(row[column.key], row, column.key, rowIndex) : column.render ? column.render(row[column.key], row, column.key, rowIndex) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
