import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../../atoms/Button';
import { Text } from '../../atoms/Text';
import { Input } from '../../atoms/Input';
import { type BaseProps } from '../../types';

export interface Column<T = any> {
  /**
   * Unique identifier for the column
   */
  id: string;
  
  /**
   * Header to display at the top of the column
   */
  header: React.ReactNode;
  
  /**
   * Optional accessor function to extract the cell value from the row data
   */
  accessor?: (row: T, index: number) => React.ReactNode;
  
  /**
   * Optional cell renderer function
   */
  cell?: (value: any, row: T, index: number) => React.ReactNode;
  
  /**
   * Optional width for the column (e.g., '100px', '10%')
   */
  width?: string;
  
  /**
   * Whether the column is sortable
   */
  sortable?: boolean;
  
  /**
   * Whether the column is filterable
   */
  filterable?: boolean;
  
  /**
   * Whether to right-align the cell content
   */
  rightAlign?: boolean;
}

export interface DataTableProps<T = any> extends BaseProps {
  /**
   * The columns configuration
   */
  columns: Column<T>[];
  
  /**
   * The data to display in the table
   */
  data: T[];
  
  /**
   * Whether the data is currently loading
   */
  isLoading?: boolean;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Current page number (for pagination)
   */
  page?: number;
  
  /**
   * Number of rows per page
   */
  perPage?: number;
  
  /**
   * Total number of rows (for pagination)
   */
  totalCount?: number;
  
  /**
   * Page change handler
   */
  onPageChange?: (page: number) => void;
  
  /**
   * Per page change handler
   */
  onPerPageChange?: (perPage: number) => void;
  
  /**
   * Row click handler
   */
  onRowClick?: (row: T, index: number) => void;
  
  /**
   * Sort change handler
   */
  onSortChange?: (id: string, direction: 'asc' | 'desc' | null) => void;
  
  /**
   * CSS class for the table
   */
  className?: string;
  
  /**
   * Additional props for the table
   */
  tableProps?: React.HTMLAttributes<HTMLTableElement>;
  
  /**
   * Whether to allow selection of rows
   */
  selectable?: boolean;
  
  /**
   * Currently selected row indices
   */
  selectedRows?: number[];
  
  /**
   * Selection change handler
   */
  onSelectionChange?: (indices: number[]) => void;
  
  /**
   * Whether to show pagination controls
   */
  pagination?: boolean;
  
  /**
   * Placeholder text to show when there is no data
   */
  emptyPlaceholder?: React.ReactNode;
  
  /**
   * Whether the table has a sticky header
   */
  stickyHeader?: boolean;
  
  /**
   * Height of the table (for scrollable tables)
   */
  height?: string;
  
  /**
   * Initial sort state
   */
  initialSort?: { id: string; direction: 'asc' | 'desc' };
  
  /**
   * Whether to enable column resizing
   */
  resizableColumns?: boolean;
}

/**
 * DataTable organism component
 * 
 * A flexible and feature-rich table component for displaying data
 * with sorting, filtering, pagination, and selection capabilities.
 */
export const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  error,
  page = 1,
  perPage = 10,
  totalCount,
  onPageChange,
  onPerPageChange,
  onRowClick,
  onSortChange,
  className,
  tableProps,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  pagination = true,
  emptyPlaceholder = 'No data available',
  stickyHeader = false,
  height,
  initialSort,
  resizableColumns = false,
  testId,
}: DataTableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{
    id: string;
    direction: 'asc' | 'desc' | null;
  } | null>(initialSort ? initialSort : null);
  
  const [filter, setFilter] = useState('');
  
  const handleSort = (columnId: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig?.id === columnId) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig(direction === null ? null : { id: columnId, direction });
    
    if (onSortChange) {
      onSortChange(columnId, direction);
    }
  };
  
  const handleRowSelection = (index: number) => {
    if (!onSelectionChange) return;
    
    const newSelection = selectedRows.includes(index)
      ? selectedRows.filter((i) => i !== index)
      : [...selectedRows, index];
    
    onSelectionChange(newSelection);
  };
  
  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedRows.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((_, index) => index));
    }
  };
  
  const totalPages = pagination && totalCount ? Math.ceil(totalCount / perPage) : 0;
  
  // Filter data if filter is applied and no external filtering is done
  const filteredData = filter
    ? data.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(filter.toLowerCase())
        )
      )
    : data;
  
  return (
    <div 
      className={cn('overflow-hidden', className)}
      data-testid={testId}
    >
      {/* Table toolbar */}
      <div className="mb-4 flex flex-col md:flex-row justify-between gap-4">
        <div className="max-w-xs">
          <Input
            placeholder="Search..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            leftIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            }
          />
        </div>
        
        {selectable && selectedRows.length > 0 && (
          <div className="flex items-center gap-2">
            <Text variant="bodySmall">
              {selectedRows.length} {selectedRows.length === 1 ? 'row' : 'rows'} selected
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange?.([])}>
              Clear selection
            </Button>
          </div>
        )}
      </div>
      
      {/* Table wrapper */}
      <div
        className={cn(
          'border border-neutral-200 rounded-md overflow-hidden',
          height && 'overflow-auto'
        )}
        style={height ? { height } : undefined}
      >
        <table
          className="w-full divide-y divide-neutral-200 border-collapse"
          {...tableProps}
        >
          <thead className={cn(
            'bg-neutral-50',
            stickyHeader && 'sticky top-0 z-10'
          )}>
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'px-4 py-3 text-xs font-medium uppercase tracking-wider',
                    'bg-neutral-50 border-b border-neutral-200',
                    column.sortable && 'cursor-pointer select-none',
                    column.rightAlign ? 'text-right' : 'text-left'
                  )}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>{column.header}</div>
                    
                    {column.sortable && sortConfig?.id === column.id && (
                      <span className="text-primary-600">
                        {sortConfig.direction === 'asc' ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m5 15 7-7 7 7" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m19 9-7 7-7-7" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-neutral-200">
            {isLoading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`loading-${i}`} className="animate-pulse">
                  {selectable && (
                    <td className="px-4 py-4">
                      <div className="h-4 w-4 bg-neutral-200 rounded"></div>
                    </td>
                  )}
                  {columns.map((column, j) => (
                    <td
                      key={`loading-${i}-${j}`}
                      className={cn(
                        'px-4 py-4 whitespace-nowrap text-sm',
                        column.rightAlign ? 'text-right' : 'text-left'
                      )}
                    >
                      <div className="h-4 bg-neutral-200 rounded w-20"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              // Error state
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-6 text-center text-red-500"
                >
                  <Text variant="body" color="error">
                    {error}
                  </Text>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center"
                >
                  {typeof emptyPlaceholder === 'string' ? (
                    <Text variant="body" color="secondary">{emptyPlaceholder}</Text>
                  ) : (
                    emptyPlaceholder
                  )}
                </td>
              </tr>
            ) : (
              // Data rows
              filteredData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    'hover:bg-neutral-50 transition-colors',
                    onRowClick && 'cursor-pointer',
                    selectedRows.includes(rowIndex) && 'bg-primary-50'
                  )}
                  onClick={
                    onRowClick
                      ? () => onRowClick(row, rowIndex)
                      : undefined
                  }
                >
                  {selectable && (
                    <td
                      className="px-4 py-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowSelection(rowIndex);
                      }}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                        checked={selectedRows.includes(rowIndex)}
                        onChange={() => handleRowSelection(rowIndex)}
                      />
                    </td>
                  )}
                  
                  {columns.map((column) => {
                    const value = column.accessor
                      ? column.accessor(row, rowIndex)
                      : row[column.id];
                    
                    return (
                      <td
                        key={column.id}
                        className={cn(
                          'px-4 py-4 whitespace-nowrap text-sm',
                          column.rightAlign ? 'text-right' : 'text-left'
                        )}
                      >
                        {column.cell ? column.cell(value, row, rowIndex) : value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && totalPages > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Text variant="bodySmall">Rows per page:</Text>
            <select
              className="border border-neutral-300 rounded p-1 text-sm"
              value={perPage}
              onChange={(e) => onPerPageChange?.(Number(e.target.value))}
            >
              {[10, 25, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            
            <Text variant="bodySmall" className="ml-4">
              {Math.min((page - 1) * perPage + 1, totalCount || 0)} -{' '}
              {Math.min(page * perPage, totalCount || 0)} of {totalCount}
            </Text>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange?.(1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m11 17-5-5 5-5" />
                <path d="m18 17-5-5 5-5" />
              </svg>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(totalPages)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m13 17 5-5-5-5" />
                <path d="m6 17 5-5-5-5" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};