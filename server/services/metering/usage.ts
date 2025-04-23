import { db } from "../../db";
import { geocodeCalls } from "@shared/schema";
import { log } from "../../vite";
import { storage } from "../../storage";
import Stripe from "stripe";
import { eq, and, sql, count } from "drizzle-orm";

// Check if Stripe key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set. Metered billing will not work properly.');
}

// Create Stripe instance
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
  : null;

// Check if price ID for geocoding is available
if (!process.env.STRIPE_GEOCODE_PRICE) {
  console.warn('STRIPE_GEOCODE_PRICE is not set. Metered billing for geocoding will not work properly.');
}

/**
 * Service for managing usage metering and reporting to Stripe
 */
class UsageService {
  /**
   * Aggregate geocode calls by customer and report to Stripe
   * Intended to be run by a scheduled job (e.g., nightly cron)
   */
  async aggregateGeocodeUsage(dryRun: boolean = false): Promise<{ 
    success: boolean;
    tenants: number;
    totalCalls: number;
    errors: string[];
  }> {
    const result = {
      success: true,
      tenants: 0,
      totalCalls: 0,
      errors: [] as string[]
    };
    
    if (!stripe || !process.env.STRIPE_GEOCODE_PRICE) {
      const error = 'Stripe configuration is missing. Cannot report usage.';
      log(error, 'error');
      result.success = false;
      result.errors.push(error);
      return result;
    }
    
    try {
      // Find all pending geocode calls grouped by tenant
      const tenantUsages = await db
        .select({
          tenantId: geocodeCalls.tenantId,
          callCount: count(geocodeCalls.id),
        })
        .from(geocodeCalls)
        .where(and(
          eq(geocodeCalls.success, true),
          eq(geocodeCalls.chargeStatus, 'pending')
        ))
        .groupBy(geocodeCalls.tenantId);
      
      result.tenants = tenantUsages.length;
      
      // Process each tenant's usage
      for (const usage of tenantUsages) {
        try {
          const user = await storage.getUser(usage.tenantId);
          
          if (!user || !user.stripeSubscriptionId) {
            const error = `Tenant ${usage.tenantId} does not have an active subscription.`;
            log(error, 'error');
            result.errors.push(error);
            continue;
          }
          
          // Find the subscription item ID for the geocode product
          let subscriptionItems;
          try {
            const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
              expand: ['items.data']
            });
            
            subscriptionItems = subscription.items.data;
          } catch (error) {
            const errorMsg = `Failed to retrieve subscription for tenant ${usage.tenantId}: ${error}`;
            log(errorMsg, 'error');
            result.errors.push(errorMsg);
            continue;
          }
          
          // Find the specific subscription item for the geocode product
          const geocodeItem = subscriptionItems.find(
            item => item.price.id === process.env.STRIPE_GEOCODE_PRICE
          );
          
          if (!geocodeItem) {
            const error = `Tenant ${usage.tenantId} does not have the geocode product in their subscription.`;
            log(error, 'error');
            result.errors.push(error);
            continue;
          }
          
          // Report usage to Stripe
          if (!dryRun) {
            try {
              await stripe.subscriptionItems.createUsageRecord(
                geocodeItem.id,
                {
                  quantity: usage.callCount,
                  timestamp: Math.floor(Date.now() / 1000),
                  action: 'increment'
                }
              );
              
              // Update charge status for processed records
              await db
                .update(geocodeCalls)
                .set({ chargeStatus: 'charged' })
                .where(and(
                  eq(geocodeCalls.tenantId, usage.tenantId),
                  eq(geocodeCalls.success, true),
                  eq(geocodeCalls.chargeStatus, 'pending')
                ));
            } catch (error) {
              const errorMsg = `Failed to report usage for tenant ${usage.tenantId}: ${error}`;
              log(errorMsg, 'error');
              result.errors.push(errorMsg);
              continue;
            }
          }
          
          log(`${dryRun ? '[DRY RUN] Would report' : 'Reported'} ${usage.callCount} geocode calls for tenant ${usage.tenantId}`, 'metering');
          result.totalCalls += usage.callCount;
        } catch (error) {
          const errorMsg = `Error processing tenant ${usage.tenantId}: ${error}`;
          log(errorMsg, 'error');
          result.errors.push(errorMsg);
        }
      }
      
      return result;
    } catch (error) {
      const errorMsg = `Failed to aggregate geocode usage: ${error}`;
      log(errorMsg, 'error');
      result.success = false;
      result.errors.push(errorMsg);
      return result;
    }
  }
  
  /**
   * Get usage statistics for a specific tenant
   */
  async getTenantUsageStats(tenantId: number): Promise<{
    total: number;
    pending: number;
    charged: number;
    failed: number;
  }> {
    // Get total calls
    const [totalResult] = await db
      .select({ count: count() })
      .from(geocodeCalls)
      .where(eq(geocodeCalls.tenantId, tenantId));
    
    // Get pending calls
    const [pendingResult] = await db
      .select({ count: count() })
      .from(geocodeCalls)
      .where(and(
        eq(geocodeCalls.tenantId, tenantId),
        eq(geocodeCalls.chargeStatus, 'pending')
      ));
    
    // Get charged calls
    const [chargedResult] = await db
      .select({ count: count() })
      .from(geocodeCalls)
      .where(and(
        eq(geocodeCalls.tenantId, tenantId),
        eq(geocodeCalls.chargeStatus, 'charged')
      ));
    
    // Get failed calls
    const [failedResult] = await db
      .select({ count: count() })
      .from(geocodeCalls)
      .where(and(
        eq(geocodeCalls.tenantId, tenantId),
        eq(geocodeCalls.chargeStatus, 'failed')
      ));
    
    return {
      total: totalResult.count,
      pending: pendingResult.count,
      charged: chargedResult.count,
      failed: failedResult.count
    };
  }
}

export const usageService = new UsageService();