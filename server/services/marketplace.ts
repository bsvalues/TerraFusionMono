import { storage } from "../storage";
import { PluginProduct, InsertPluginProduct, UserPlugin, InsertUserPlugin } from "@shared/schema";
import Stripe from "stripe";

// Initialize Stripe if key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" }) 
  : undefined;

/**
 * Service for managing the plugin marketplace
 */
class MarketplaceService {
  /**
   * Get all plugin products
   */
  async getPluginProducts(): Promise<PluginProduct[]> {
    return await storage.getPluginProducts();
  }
  
  /**
   * Get plugin product by ID
   */
  async getPluginProduct(id: number): Promise<PluginProduct | undefined> {
    return await storage.getPluginProduct(id);
  }
  
  /**
   * Get all products for a specific plugin
   */
  async getPluginProductsByPluginId(pluginId: number): Promise<PluginProduct[]> {
    return await storage.getPluginProductsByPluginId(pluginId);
  }
  
  /**
   * Create a new plugin product
   */
  async createPluginProduct(product: InsertPluginProduct): Promise<PluginProduct> {
    // Create Stripe product and price if Stripe is available
    if (stripe) {
      try {
        // Create the product in Stripe
        const stripeProduct = await stripe.products.create({
          name: product.name,
          description: product.description || undefined,
          metadata: {
            pluginId: product.pluginId.toString(),
          },
        });
        
        // Create the price in Stripe
        const stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: Math.round(Number(product.price) * 100), // Convert to cents
          currency: 'usd',
          recurring: product.type === 'subscription' ? { interval: 'month' } : undefined,
        });
        
        // Add Stripe IDs to the product
        product.stripeProductId = stripeProduct.id;
        product.stripePriceId = stripePrice.id;
      } catch (error) {
        console.error('Error creating Stripe product and price:', error);
      }
    }
    
    // Create the product in the database
    return await storage.createPluginProduct(product);
  }
  
  /**
   * Update a plugin product
   */
  async updatePluginProduct(id: number, updates: Partial<PluginProduct>): Promise<PluginProduct | undefined> {
    const product = await storage.getPluginProduct(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    
    // Update Stripe product if we have Stripe connected and IDs
    if (stripe && product.stripeProductId) {
      try {
        // Update product in Stripe
        if (updates.name || updates.description) {
          await stripe.products.update(product.stripeProductId, {
            name: updates.name || product.name,
            description: updates.description || product.description || undefined,
          });
        }
        
        // Update price in Stripe if price changed and we have a price ID
        if (updates.price && product.stripePriceId) {
          // In Stripe, we can't update a price - we need to create a new one
          // and archive the old one
          const newStripePrice = await stripe.prices.create({
            product: product.stripeProductId,
            unit_amount: Math.round(Number(updates.price) * 100), // Convert to cents
            currency: 'usd',
            recurring: product.type === 'subscription' ? { interval: 'month' } : undefined,
          });
          
          // Archive the old price
          await stripe.prices.update(product.stripePriceId, { active: false });
          
          // Update price ID in the updates
          updates.stripePriceId = newStripePrice.id;
        }
      } catch (error) {
        console.error('Error updating Stripe product:', error);
      }
    }
    
    // Update the product in the database
    return await storage.updatePluginProduct(id, updates);
  }
  
  /**
   * Create a payment intent for a plugin product
   */
  async createPaymentIntent(productId: number, userId: number): Promise<{ clientSecret: string } | undefined> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    
    // Get the product
    const product = await storage.getPluginProduct(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    try {
      // Create a PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(product.price) * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          productId: productId.toString(),
          userId: userId.toString(),
          pluginId: product.pluginId.toString(),
        },
      });
      
      return { clientSecret: paymentIntent.client_secret! };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }
  
  /**
   * Complete a plugin purchase
   */
  async completePurchase(userId: number, productId: number, stripePaymentId: string): Promise<UserPlugin> {
    // Get the product
    const product = await storage.getPluginProduct(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Create the user plugin record
    const userPlugin = await storage.createUserPlugin({
      userId,
      pluginId: product.pluginId,
      productId,
      expiryDate: product.type === 'subscription' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined, // 30 days for subscriptions
      active: true,
      stripePaymentId,
    });
    
    // Log the purchase
    await storage.createLog({
      level: 'INFO',
      service: 'marketplace',
      message: `User ${userId} purchased plugin ${product.pluginId} (product: ${productId})`,
    });
    
    return userPlugin;
  }
  
  /**
   * Get all plugins purchased by a user
   */
  async getUserPlugins(userId: number): Promise<UserPlugin[]> {
    return await storage.getUserPlugins(userId);
  }
  
  /**
   * Check if a user has access to a plugin
   */
  async checkUserHasPlugin(userId: number, pluginId: number): Promise<boolean> {
    return await storage.checkUserHasPlugin(userId, pluginId);
  }
  
  /**
   * Initialize sample marketplace products if none exist
   */
  async initializeSampleProducts(): Promise<void> {
    const products = await storage.getPluginProducts();
    
    if (products.length === 0) {
      // Get available plugins
      const plugins = await storage.getPlugins();
      
      // Create default products for each plugin
      for (const plugin of plugins) {
        // Skip disabled plugins
        if (plugin.status === 'disabled') continue;
        
        // Create pricing tiers
        const productTiers = [
          {
            name: `${plugin.name} Standard`,
            description: `Standard edition of the ${plugin.name} plugin`,
            price: 49.99,
            type: 'one-time' as const,
            features: {
              items: [
                'Core functionality',
                'Standard support',
                'Documentation access'
              ]
            }
          },
          {
            name: `${plugin.name} Premium`,
            description: `Premium edition of the ${plugin.name} plugin with advanced features`,
            price: 99.99,
            type: 'one-time' as const,
            features: {
              items: [
                'All standard features',
                'Advanced functionality',
                'Email support',
                'Update notifications'
              ]
            }
          },
          // Subscription option
          {
            name: `${plugin.name} Enterprise`,
            description: `Enterprise subscription for the ${plugin.name} plugin with priority support`,
            price: 19.99,
            type: 'subscription' as const,
            features: {
              items: [
                'All premium features',
                'Priority support',
                'API access',
                'Custom integration assistance',
                'Monthly updates'
              ]
            }
          }
        ];
        
        // Create the products
        for (const tier of productTiers) {
          await this.createPluginProduct({
            pluginId: plugin.id,
            name: tier.name,
            description: tier.description,
            price: tier.price,
            type: tier.type,
            active: true,
            features: tier.features
          });
        }
      }
    }
  }
}

export const marketplaceService = new MarketplaceService();