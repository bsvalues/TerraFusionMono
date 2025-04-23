import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { networkService } from '../services/network.service';

interface SyncStatusProps {
  lastSynced: Date | null;
  isSyncing: boolean;
}

export function SyncStatus({ lastSynced, isSyncing }: SyncStatusProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = networkService.addListener((status) => {
      setIsOnline(status);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Format the last synced time
  const getLastSyncedText = () => {
    if (!lastSynced) {
      return 'Never synced';
    }

    // Format the date as a readable string
    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - lastSynced.getTime()) / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]} />
      <Text style={styles.statusText}>
        {isOnline ? 'Online' : 'Offline'}
      </Text>
      {isSyncing ? (
        <View style={styles.syncingContainer}>
          <ActivityIndicator size="small" color="#0066cc" />
          <Text style={styles.syncingText}>Syncing...</Text>
        </View>
      ) : (
        <Text style={styles.lastSyncedText}>
          Last synced: {getLastSyncedText()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontWeight: 'bold',
    marginRight: 12,
  },
  syncingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncingText: {
    marginLeft: 4,
    color: '#0066cc',
  },
  lastSyncedText: {
    color: '#757575',
    fontSize: 12,
  },
});