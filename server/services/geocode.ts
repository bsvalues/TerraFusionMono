import { db } from "../db";
import { geocodeCalls, insertGeocodeCallSchema } from "@shared/schema";
import { log } from "../vite";
import * as z from "zod";

/**
 * Service for geocoding addresses with usage tracking for metered billing
 */
class GeocodeService {
  private batchInserts: z.infer<typeof insertGeocodeCallSchema>[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  /**
   * Geocode an address and track the usage for metered billing
   */
  async geocodeAddress(tenantId: number, address: string): Promise<{ lat: number; lng: number }> {
    const startTime = Date.now();
    
    try {
      // Simulate geocoding process
      // In a real implementation, this would call a geocoding API
      const result = this.simulateGeocode(address);
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Track the usage for metered billing
      await this.trackUsage({
        tenantId,
        address,
        success: true,
        responseTime,
        chargeStatus: 'pending'
      });
      
      return result;
    } catch (error) {
      // Calculate response time even for failures
      const responseTime = Date.now() - startTime;
      
      // Track the failed usage
      await this.trackUsage({
        tenantId,
        address,
        success: false,
        responseTime,
        chargeStatus: 'pending'
      });
      
      throw error;
    }
  }
  
  /**
   * Track usage of the geocoding service for metered billing
   * Uses a batched insert approach for better performance
   */
  private async trackUsage(data: z.infer<typeof insertGeocodeCallSchema>): Promise<void> {
    // Add to batch
    this.batchInserts.push(data);
    
    // If batch is large enough, flush immediately
    if (this.batchInserts.length >= 100) {
      this.flushBatch();
      return;
    }
    
    // Otherwise set a timeout to flush soon
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushBatch(), 5000);
    }
  }
  
  /**
   * Flush the batch of usage tracking inserts to the database
   */
  private async flushBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    if (this.batchInserts.length === 0) {
      return;
    }
    
    const batchToInsert = [...this.batchInserts];
    this.batchInserts = [];
    
    try {
      await db.insert(geocodeCalls).values(batchToInsert);
      log(`Inserted ${batchToInsert.length} geocode call records for metered billing`, 'geocode');
    } catch (error) {
      log(`Failed to insert geocode call records: ${error}`, 'error');
      
      // Put the failed batch back in the queue to retry
      this.batchInserts.push(...batchToInsert);
      
      // Set a timeout to retry
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.flushBatch(), 10000);
      }
    }
  }
  
  /**
   * Simulate a geocoding process (for demo purposes)
   */
  private simulateGeocode(address: string): { lat: number; lng: number } {
    // Simple geocoding simulation for demo
    // In a real implementation, this would call a geocoding service
    
    // Generate a deterministic but seemingly random lat/lng based on the address
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = ((hash << 5) - hash) + address.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Generate latitude between -90 and 90
    const lat = (hash % 18000) / 100 - 90;
    
    // Generate longitude between -180 and 180
    const lng = ((hash >> 16) % 36000) / 100 - 180;
    
    return { lat, lng };
  }
}

export const geocodeService = new GeocodeService();