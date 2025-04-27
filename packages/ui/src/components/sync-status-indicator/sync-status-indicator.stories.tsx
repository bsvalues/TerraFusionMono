import type { Meta, StoryObj } from '@storybook/react';
import { SyncStatusIndicator } from './sync-status-indicator';

const meta: Meta<typeof SyncStatusIndicator> = {
  title: 'Components/SyncStatusIndicator',
  component: SyncStatusIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['syncing', 'synced', 'offline', 'error', 'delayed'],
    },
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    lastSynced: {
      control: 'date',
    },
    pendingChanges: {
      control: { type: 'number', min: 0 },
    },
    clickable: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SyncStatusIndicator>;

/**
 * Indicator showing synced status
 */
export const Synced: Story = {
  args: {
    status: 'synced',
    lastSynced: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    pendingChanges: 0,
    clickable: true,
  },
};

/**
 * Indicator showing syncing status with progress
 */
export const Syncing: Story = {
  args: {
    status: 'syncing',
    progress: 45,
    lastSynced: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
    pendingChanges: 12,
    clickable: true,
  },
};

/**
 * Indicator showing offline status
 */
export const Offline: Story = {
  args: {
    status: 'offline',
    lastSynced: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
    pendingChanges: 8,
    clickable: true,
  },
};

/**
 * Indicator showing error status
 */
export const Error: Story = {
  args: {
    status: 'error',
    lastSynced: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    pendingChanges: 3,
    clickable: true,
  },
};

/**
 * Indicator showing delayed status
 */
export const Delayed: Story = {
  args: {
    status: 'delayed',
    lastSynced: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    pendingChanges: 15,
    clickable: true,
  },
};

/**
 * Indicator without pending changes count
 */
export const NoPendingChanges: Story = {
  args: {
    status: 'synced',
    lastSynced: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    pendingChanges: 0,
    clickable: true,
  },
};

/**
 * Indicator without last synced time
 */
export const NoLastSynced: Story = {
  args: {
    status: 'offline',
    lastSynced: null,
    pendingChanges: 5,
    clickable: true,
  },
};

/**
 * Non-clickable indicator
 */
export const NonClickable: Story = {
  args: {
    status: 'synced',
    lastSynced: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    pendingChanges: 0,
    clickable: false,
  },
};