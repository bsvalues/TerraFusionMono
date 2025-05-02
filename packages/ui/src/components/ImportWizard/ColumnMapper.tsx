import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImportColumn, ImportFile, MappingConfig } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Check, RefreshCw } from 'lucide-react';

type ColumnMapperProps = {
  files: ImportFile[];
  requiredTargetColumns: Record<string, { name: string; dataType: string; required: boolean }>;
  onMappingComplete: (mapping: MappingConfig) => void;
  initialMapping?: MappingConfig;
};

export function ColumnMapper({
  files,
  requiredTargetColumns,
  onMappingComplete,
  initialMapping
}: ColumnMapperProps) {
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [mappedColumns, setMappedColumns] = useState<Record<string, ImportColumn>>({});
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [autoMapped, setAutoMapped] = useState(false);

  // Extract source columns from the first file's preview or headers
  useEffect(() => {
    if (files.length > 0 && files[0].preview) {
      // Use the first row as headers
      const headers = files[0].preview[0];
      setSourceColumns(headers);
      setPreviewData(files[0].preview.slice(1));
    }
  }, [files]);

  // Auto-map columns on initial load or when specifically requested
  const autoMapColumns = () => {
    const newMappedColumns: Record<string, ImportColumn> = {};
    
    // Try to match columns by name (case-insensitive)
    Object.entries(requiredTargetColumns).forEach(([key, targetCol]) => {
      const sourceColIdx = sourceColumns.findIndex(
        (col) => col.toLowerCase() === targetCol.name.toLowerCase()
      );
      
      if (sourceColIdx !== -1) {
        newMappedColumns[key] = {
          sourceIndex: sourceColIdx,
          sourceName: sourceColumns[sourceColIdx],
          targetName: targetCol.name,
          required: targetCol.required,
          mapped: true,
          dataType: targetCol.dataType,
          sampleData: previewData[0]?.[sourceColIdx]
        };
      } else {
        // If not auto-mapped, still add the target column but marked as unmapped
        newMappedColumns[key] = {
          sourceIndex: -1,
          sourceName: '',
          targetName: targetCol.name,
          required: targetCol.required,
          mapped: false,
          dataType: targetCol.dataType
        };
      }
    });
    
    setMappedColumns(newMappedColumns);
    setAutoMapped(true);
  };

  // Apply initial mapping if provided
  useEffect(() => {
    if (initialMapping) {
      setSourceColumns(initialMapping.sourceColumns);
      setMappedColumns(initialMapping.targetColumns);
      setAutoMapped(initialMapping.autoMapped);
    } else if (sourceColumns.length > 0 && !autoMapped) {
      autoMapColumns();
    }
  }, [initialMapping, sourceColumns, autoMapped]);

  // Handle column mapping changes
  const handleColumnChange = (targetKey: string, sourceIndex: number) => {
    const targetColumn = requiredTargetColumns[targetKey];
    
    setMappedColumns({
      ...mappedColumns,
      [targetKey]: {
        ...mappedColumns[targetKey],
        sourceIndex,
        sourceName: sourceIndex >= 0 ? sourceColumns[sourceIndex] : '',
        mapped: sourceIndex >= 0,
        sampleData: sourceIndex >= 0 ? previewData[0]?.[sourceIndex] : undefined
      }
    });
  };

  // Check if all required columns are mapped
  const allRequiredMapped = Object.values(mappedColumns).every(
    (col) => !col.required || col.mapped
  );

  // Complete the mapping process
  const completeMapping = () => {
    onMappingComplete({
      sourceColumns,
      targetColumns: mappedColumns,
      autoMapped
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Map Columns</h3>
        <Button variant="outline" size="sm" onClick={autoMapColumns}>
          <RefreshCw className="mr-2 h-4 w-4" /> Auto-Map
        </Button>
      </div>
      
      {!allRequiredMapped && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Missing required mappings</p>
            <p className="text-xs text-amber-700 mt-1">
              Please map all required columns marked with <Badge variant="outline">Required</Badge> to proceed.
            </p>
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Column Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Target Column</TableHead>
                <TableHead className="w-1/3">Source Column</TableHead>
                <TableHead className="w-1/3">Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(mappedColumns).map(([key, column]) => (
                <TableRow key={key}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{column.targetName}</span>
                      {column.required && (
                        <Badge variant="outline" className="ml-2">Required</Badge>
                      )}
                      {column.mapped && (
                        <Check className="h-4 w-4 text-green-500 ml-2" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {column.dataType}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={column.sourceIndex >= 0 ? column.sourceIndex.toString() : ''}
                      onValueChange={(value) => handleColumnChange(key, parseInt(value, 10))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not mapped</SelectItem>
                        {sourceColumns.map((col, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {column.mapped && column.sampleData ? (
                      <span className="text-sm">{column.sampleData}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No preview available</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button
          onClick={completeMapping}
          disabled={!allRequiredMapped}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}