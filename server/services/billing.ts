import { storage } from "../storage";
import Stripe from "stripe";

// Initialize Stripe if key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : undefined;

/**
 * Service for managing billing and subscriptions
 */
class BillingService {
  /**
   * Create a checkout session for a product
   */
  async createCheckoutSession(
    userId: number,
    priceId: string,
    mode: 'payment' | 'subscription' = 'payment',
    successUrl: string = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/marketplace/success`,
    cancelUrl: string = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/marketplace`
  ): Promise<{ url: string } | undefined> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Create or retrieve the Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.username,
        metadata: {
          userId: userId.toString(),
        },
      });
      stripeCustomerId = customer.id;
      
      // Update the user with the Stripe customer ID
      await storage.updateStripeCustomerId(userId, stripeCustomerId);
    }

    try {
      // Create the checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId.toString(),
        },
      });

      return { url: session.url || '' };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create a billing portal session for a customer
   */
  async createBillingPortalSession(
    userId: number,
    returnUrl: string = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/dashboard`
  ): Promise<{ url: string } | undefined> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Check if the user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      throw new Error('User does not have a Stripe customer ID');
    }

    try {
      // Create the billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      });

      return { url: session.url };
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      throw error;
    }
  }

  /**
   * Verify if a user has a subscription to a product
   */
  async verifySubscription(userId: number, productId: string): Promise<boolean> {
    if (!stripe) {
      return false;
    }

    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      return false;
    }

    // Check if the user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      return false;
    }

    try {
      // Get all subscriptions for the customer
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        expand: ['data.items.data.price.product'],
      });

      // Check if any subscription contains the product
      for (const subscription of subscriptions.data) {
        for (const item of subscription.items.data) {
          // @ts-ignore - Stripe types don't properly recognize expanded products
          const product = item.price.product as Stripe.Product;
          if (product.id === productId) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error verifying subscription:', error);
      return false;
    }
  }

  /**
   * Check if a user has purchased a one-time product
   */
  async verifyPurchase(userId: number, productId: string): Promise<boolean> {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      return false;
    }

    // Check if the user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      return false;
    }

    // For one-time purchases, we check our user_plugins table
    const userPlugins = await storage.getUserPlugins(userId);
    return userPlugins.some(plugin => plugin.active && plugin.stripeProductId === productId);
  }

  /**
   * Verify if a user has access to a product (subscription or one-time purchase)
   */
  async verifyAccess(userId: number, productId: string): Promise<boolean> {
    const hasSubscription = await this.verifySubscription(userId, productId);
    if (hasSubscription) {
      return true;
    }

    const hasPurchase = await this.verifyPurchase(userId, productId);
    return hasPurchase;
  }

  /**
   * Process a webhook event from Stripe
   */
  async processWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Extract metadata
          const userId = session.metadata?.userId;
          const productId = session.metadata?.productId;
          
          if (!userId || !productId) {
            console.log('Missing userId or productId in session metadata');
            return;
          }
          
          // Handle one-time purchase
          if (session.mode === 'payment') {
            const pluginProduct = await storage.getPluginProductByStripeProductId(productId);
            if (!pluginProduct) {
              throw new Error(`Product with Stripe ID ${productId} not found`);
            }
            
            // Create user plugin record
            await storage.createUserPlugin({
              userId: parseInt(userId),
              pluginId: pluginProduct.pluginId,
              productId: pluginProduct.id,
              active: true,
              stripePaymentId: session.payment_intent as string,
              stripeProductId: productId,
            });
            
            // Log the purchase
            await storage.createLog({
              level: 'INFO',
              service: 'billing',
              message: `User ${userId} purchased plugin ${pluginProduct.pluginId} (product: ${pluginProduct.id})`,
            });
          }
          
          // Handle subscription setup
          if (session.mode === 'subscription') {
            // Get user and update subscription ID if not already set
            const user = await storage.getUser(parseInt(userId));
            if (user && !user.stripeSubscriptionId && session.subscription) {
              await storage.updateStripeSubscriptionId(
                parseInt(userId),
                session.subscription as string
              );
              
              // Log the subscription
              await storage.createLog({
                level: 'INFO',
                service: 'billing',
                message: `User ${userId} subscribed to product ${productId}`,
              });
            }
          }
          
          break;
        }
        
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          
          // Handle subscription renewal
          if (invoice.subscription) {
            // Find user with this subscription
            const userId = await storage.getUserIdByStripeSubscriptionId(invoice.subscription as string);
            if (userId) {
              // Log the renewal
              await storage.createLog({
                level: 'INFO',
                service: 'billing',
                message: `Subscription renewed for user ${userId}, invoice ${invoice.id}`,
              });
            }
          }
          
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          
          // Find user with this subscription
          const userId = await storage.getUserIdByStripeSubscriptionId(subscription.id);
          if (userId) {
            // Clear the subscription ID
            await storage.updateStripeSubscriptionId(userId, null);
            
            // Log the cancellation
            await storage.createLog({
              level: 'INFO',
              service: 'billing',
              message: `Subscription cancelled for user ${userId}`,
            });
          }
          
          break;
        }
      }
    } catch (error) {
      console.error(`Error processing webhook event ${event.type}:`, error);
      throw error;
    }
  }
}

export const billingService = new BillingService();