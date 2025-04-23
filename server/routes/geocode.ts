import { Request, Response } from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';
import { z } from 'zod';
import { db } from '../db';
import { geocodeCalls } from '@shared/schema';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Schema for geocode search
const geocodeSearchSchema = z.object({
  address: z.string().min(3),
});

// Mock geocoding API response structure
// In a real implementation, this would be replaced with a call to a geocoding service like Google Maps, Mapbox, etc.
interface GeocodingResponse {
  address: string;
  lat: number;
  lng: number;
  formattedAddress: string;
  confidence: number;
  components: {
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    street?: string;
    houseNumber?: string;
  };
}

/**
 * Geocoding request handler
 */
export async function searchHandler(req: Request, res: Response) {
  try {
    // Validate request body
    const validation = geocodeSearchSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid request data', 
        errors: validation.error.flatten() 
      });
    }
    
    const { address } = validation.data;
    
    // In a real implementation, call an external geocoding service here
    // For demo purposes, we'll simulate a geocoding response with realistic data
    
    // Simulate geocoding latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate a deterministic lat/lng based on the address string for demo purposes
    // This ensures the same address always returns the same coordinates
    const addressSeed = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const latBase = (addressSeed % 170) - 85; // range: -85 to 85
    const lngBase = (addressSeed % 360) - 180; // range: -180 to 180
    
    // Add some decimals for realism
    const lat = latBase + (Math.sin(addressSeed) * 0.01);
    const lng = lngBase + (Math.cos(addressSeed) * 0.01);
    
    // Simulate different confidence levels based on address length and content
    let confidence = 0.7 + (Math.min(address.length, 30) / 100);
    
    // Higher confidence for addresses with numbers (like street addresses)
    if (/\d/.test(address)) {
      confidence += 0.1;
    }
    
    // Higher confidence for addresses with common keywords
    if (/street|avenue|road|boulevard|lane|drive|way|plaza|square|park|st\.?|ave\.?|rd\.?|blvd\.?/i.test(address)) {
      confidence += 0.1;
    }
    
    // Cap confidence at 0.98 (nothing is 100% certain)
    confidence = Math.min(confidence, 0.98);
    
    // Parse the address into components (very simplified)
    const components: GeocodingResponse['components'] = {};
    
    // Extract potential city/state/zipcode patterns
    const cityStateMatch = address.match(/([A-Za-z\s]+),\s*([A-Z]{2})(?:\s+(\d{5}))?/);
    if (cityStateMatch) {
      components.city = cityStateMatch[1].trim();
      components.state = cityStateMatch[2];
      if (cityStateMatch[3]) {
        components.postalCode = cityStateMatch[3];
      }
    }
    
    // Extract potential street number and name
    const streetMatch = address.match(/^(\d+)\s+([^,]+)/);
    if (streetMatch) {
      components.houseNumber = streetMatch[1];
      components.street = streetMatch[2].trim();
    }
    
    // Default country (would be determined by the geocoding service in reality)
    components.country = "United States";
    
    // Construct a formatted address based on components
    let formattedAddress = address;
    if (components.street && components.city && components.state) {
      formattedAddress = `${components.houseNumber || ''} ${components.street}, ${components.city}, ${components.state} ${components.postalCode || ''}`.trim();
    }
    
    // Create the geocoding response
    const response: GeocodingResponse = {
      address,
      lat,
      lng,
      formattedAddress,
      confidence,
      components
    };
    
    // In a production environment, we would record the geocode call in the database
    // Currently we're just logging the query for demonstration purposes
    const userId = req.user?.id || 1; // Default to tenant ID 1 if not authenticated
    console.log(`Geocoding request for address: "${address}" by tenant ID: ${userId}`);
    
    // If we have a price ID, record usage with Stripe for metered billing
    if (process.env.STRIPE_GEOCODE_PRICE && userId) {
      try {
        const user = await storage.getUser(userId);
        
        if (user?.stripeCustomerId && user?.stripeSubscriptionId) {
          // Report usage to Stripe for metered billing
          try {
            // Find the subscription item based on the price ID
            const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
            const item = subscription.items.data.find(
              item => item.price.id === process.env.STRIPE_GEOCODE_PRICE
            );
            
            if (item) {
              // Report usage on the specific subscription item
              await stripe.subscriptionItems.createUsageRecord(
                item.id, // Use the subscription item ID, not the price ID
                {
                  quantity: 1, // One geocode call
                  timestamp: 'now',
                  action: 'increment',
                }
              );
            }
          } catch (subError) {
            console.error('Error reporting usage record:', subError);
          }
        }
      } catch (stripeError) {
        console.error('Error reporting usage to Stripe:', stripeError);
        // We still want to return the geocoding result even if Stripe fails
      }
    }
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Geocoding error:', error);
    return res.status(500).json({ message: 'Error processing geocoding request' });
  }
}

/**
 * Get geocoding usage metrics
 */
export async function getMetricsHandler(req: Request, res: Response) {
  try {
    // Skip authentication check completely for demo purposes
    
    // Since we don't have any geocode calls in the DB yet, we'll use demo data
    // for display purposes that show typical usage patterns
    
    // In a real implementation, these would come from database queries
    // matching the user/tenant ID and appropriate date ranges
    
    const totalCalls = 124;
    
    // Get calls this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const callsThisMonth = 32;
    
    // Get calls today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const callsToday = 5;
    
    // Set the cost per call (in dollars)
    const costPerCall = 0.0001; // $0.0001 per call (one-tenth of a cent)
    
    // Calculate estimated charge
    const estimatedCharge = callsThisMonth * costPerCall;
    
    // Get the last billing date (first day of current month)
    const lastBillingDate = startOfMonth.toISOString();
    
    return res.status(200).json({
      totalCalls,
      callsThisMonth,
      callsToday,
      lastBillingDate,
      costPerCall,
      estimatedCharge,
      currency: 'USD'
    });
  } catch (error) {
    console.error('Error fetching geocode metrics:', error);
    return res.status(500).json({ message: 'Error processing metrics request' });
  }
}