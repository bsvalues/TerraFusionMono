import React, { useCallback, useState } from 'react';
import { UploadCloud, File, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ImportFile, ImportType } from './types';

type FileUploadProps = {
  importType: ImportType;
  onFilesAccepted: (files: ImportFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export function FileUpload({
  importType,
  onFilesAccepted,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = ['.csv', '.xlsx', '.xls']
}: FileUploadProps) {
  const [files, setFiles] = useState<ImportFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      
      // Convert FileList to array
      const newFiles = Array.from(fileList).filter(file => {
        // Check file type
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedFileTypes.includes(fileExt) && !acceptedFileTypes.includes('*')) {
          setError(`File type not accepted. Please upload ${acceptedFileTypes.join(', ')} files.`);
          return false;
        }
        
        // Check file size
        if (file.size > maxSize) {
          setError(`File too large. Maximum size is ${formatFileSize(maxSize)}.`);
          return false;
        }
        
        return true;
      });
      
      if (files.length + newFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed.`);
        return;
      }
      
      // Create preview of first few rows for CSV files
      const importFiles: ImportFile[] = await Promise.all(
        newFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop()?.toLowerCase();
          let preview = undefined;
          
          // For CSV files, create a preview
          if (fileExt === 'csv') {
            const text = await file.text();
            const rows = text.split('\\n').slice(0, 5);
            preview = rows.map(row => row.split(','));
          }
          
          return {
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            preview
          };
        })
      );
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setUploadProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          const allFiles = [...files, ...importFiles];
          setFiles(allFiles);
          onFilesAccepted(allFiles);
        }
      }, 100);
    },
    [files, maxFiles, maxSize, acceptedFileTypes, onFilesAccepted]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (e.dataTransfer.files) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
    onFilesAccepted(updatedFiles);
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? 'border-primary bg-primary/10' : 'border-muted'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
        <div className="mt-4">
          <p className="text-sm font-medium">
            Drag and drop files here or click to browse
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {acceptedFileTypes.join(', ')} files up to {formatFileSize(maxSize)}
          </p>
        </div>
        <input
          id="fileUpload"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={acceptedFileTypes.join(',')}
          multiple={maxFiles > 1}
        />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          Select Files
        </Button>
      </div>

      {error && (
        <div className="flex items-center p-4 text-red-800 bg-red-100 rounded-md">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Selected Files</h3>
          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}