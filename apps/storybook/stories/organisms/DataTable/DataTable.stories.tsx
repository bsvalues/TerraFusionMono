import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from '../../../../../packages/ui/organisms/DataTable';
import { Button } from '../../../../../packages/ui/atoms/Button';
import { Badge } from '../../../../../packages/ui/atoms/Badge';
import { useState } from 'react';

const meta: Meta<typeof DataTable> = {
  title: 'TerraFusion/Organisms/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataTable>;

// Mock data for the table
const mockData = [
  {
    id: 1,
    parcelId: 'P1001',
    crop: 'Corn',
    area: 45.7,
    health: 'Good',
    lastUpdated: '2025-03-15T12:30:00',
    status: 'Active',
  },
  {
    id: 2,
    parcelId: 'P1002',
    crop: 'Wheat',
    area: 32.1,
    health: 'Excellent',
    lastUpdated: '2025-03-12T10:15:00',
    status: 'Active',
  },
  {
    id: 3,
    parcelId: 'P1003',
    crop: 'Soybeans',
    area: 28.9,
    health: 'Poor',
    lastUpdated: '2025-03-10T09:45:00',
    status: 'Inactive',
  },
  {
    id: 4,
    parcelId: 'P1004',
    crop: 'Cotton',
    area: 52.3,
    health: 'Fair',
    lastUpdated: '2025-03-08T14:20:00',
    status: 'Active',
  },
  {
    id: 5,
    parcelId: 'P1005',
    crop: 'Rice',
    area: 18.5,
    health: 'Good',
    lastUpdated: '2025-03-05T11:10:00',
    status: 'Active',
  },
];

// Column definitions
const columns = [
  {
    id: 'parcelId',
    header: 'Parcel ID',
    accessor: (row) => row.parcelId,
  },
  {
    id: 'crop',
    header: 'Crop Type',
    accessor: (row) => row.crop,
    sortable: true,
  },
  {
    id: 'area',
    header: 'Area (ha)',
    accessor: (row) => row.area,
    cell: (value) => value.toFixed(1),
    rightAlign: true,
    sortable: true,
  },
  {
    id: 'health',
    header: 'Crop Health',
    accessor: (row) => row.health,
    cell: (value) => {
      const colorMap = {
        'Excellent': 'success',
        'Good': 'success',
        'Fair': 'warning',
        'Poor': 'error',
      };
      return (
        <Badge variant={colorMap[value] || 'default'}>
          {value}
        </Badge>
      );
    },
    sortable: true,
  },
  {
    id: 'lastUpdated',
    header: 'Last Updated',
    accessor: (row) => row.lastUpdated,
    cell: (value) => new Date(value).toLocaleDateString(),
    sortable: true,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (row) => row.status,
    cell: (value) => (
      <Badge variant={value === 'Active' ? 'primary' : 'secondary'}>
        {value}
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: (_, row) => (
      <div className="flex items-center gap-2">
        <Button size="xs" variant="outline">View</Button>
        <Button size="xs" variant="outline">Edit</Button>
      </div>
    ),
  },
];

export const Default: Story = {
  args: {
    columns,
    data: mockData,
  },
};

export const WithPagination: Story = {
  args: {
    columns,
    data: mockData,
    pagination: true,
    page: 1,
    perPage: 10,
    totalCount: mockData.length,
  },
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    emptyPlaceholder: 'No parcels found for the current filter criteria.',
  },
};

export const Error: Story = {
  args: {
    columns,
    data: [],
    error: 'An error occurred while fetching the data. Please try again later.',
  },
};

export const Selectable: Story = {
  render: (args) => {
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    return (
      <div>
        <DataTable
          {...args}
          columns={columns}
          data={mockData}
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
        />
        {selectedRows.length > 0 && (
          <div className="mt-4 p-4 border border-neutral-200 rounded">
            <h4 className="font-medium text-sm mb-2">Selected Rows:</h4>
            <pre className="text-xs bg-neutral-50 p-2 rounded overflow-auto">
              {JSON.stringify(
                selectedRows.map((idx) => mockData[idx]),
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    );
  },
};

export const SortableInteractive: Story = {
  render: (args) => {
    const [sortedData, setSortedData] = useState(mockData);
    const [sortConfig, setSortConfig] = useState<{
      id: string;
      direction: 'asc' | 'desc' | null;
    } | null>(null);

    const handleSortChange = (id: string, direction: 'asc' | 'desc' | null) => {
      setSortConfig({ id, direction });
      
      if (!direction) {
        setSortedData([...mockData]);
        return;
      }
      
      const sorted = [...sortedData].sort((a, b) => {
        if (a[id] === b[id]) return 0;
        
        const comparison = a[id] < b[id] ? -1 : 1;
        return direction === 'asc' ? comparison : -comparison;
      });
      
      setSortedData(sorted);
    };
    
    return (
      <DataTable
        {...args}
        columns={columns}
        data={sortedData}
        onSortChange={handleSortChange}
        initialSort={sortConfig || undefined}
      />
    );
  },
};

export const WithFilteringAndPagination: Story = {
  render: (args) => {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(2);
    const [filterValue, setFilterValue] = useState('');
    
    // Filter the data based on the filter value
    const filteredData = mockData.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(filterValue.toLowerCase())
      )
    );
    
    // Calculate pagination
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    return (
      <div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter data..."
            value={filterValue}
            onChange={(e) => {
              setFilterValue(e.target.value);
              setPage(1); // Reset to first page when filtering
            }}
            className="px-4 py-2 border border-neutral-300 rounded-md w-full max-w-sm"
          />
        </div>
        
        <DataTable
          {...args}
          columns={columns}
          data={paginatedData}
          page={page}
          perPage={perPage}
          totalCount={filteredData.length}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          pagination
        />
      </div>
    );
  },
};