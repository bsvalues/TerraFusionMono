import React from 'react';
import { Badge } from '@/components/ui/badge';

interface SyncStatusPanelProps {
  className?: string;
}

export default function SyncStatusPanel({ className = '' }: SyncStatusPanelProps) {
  return (
    <Badge variant="outline" className="flex items-center">
      <span>Sync Status</span>
    </Badge>
  );
}