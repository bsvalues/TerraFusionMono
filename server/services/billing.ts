import { storage } from "../storage";
import Stripe from "stripe";

// Initialize Stripe if key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-08-16" })
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
      // Log all events for audit purposes
      await storage.createLog({
        level: 'INFO',
        service: 'billing',
        message: `Processing Stripe webhook event: ${event.type} (${event.id})`
      });
      
      switch (event.type) {
        // Checkout session events
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
        
        case 'checkout.session.async_payment_succeeded': {
          const session = event.data.object as Stripe.Checkout.Session;
          await storage.createLog({
            level: 'INFO',
            service: 'billing',
            message: `Async payment succeeded for checkout session: ${session.id}`
          });
          break;
        }
        
        case 'checkout.session.async_payment_failed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await storage.createLog({
            level: 'WARN',
            service: 'billing',
            message: `Async payment failed for checkout session: ${session.id}`
          });
          break;
        }
        
        // Payment intent events
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          // Additional processing for standalone payment intents (not part of checkout)
          if (paymentIntent.metadata && paymentIntent.metadata.userId && paymentIntent.metadata.productId) {
            // This is a direct payment for a product
            const userId = parseInt(paymentIntent.metadata.userId);
            const productId = parseInt(paymentIntent.metadata.productId);
            
            // Check if the user already has this plugin
            const existingPlugin = await storage.checkUserHasPlugin(userId, productId);
            
            if (!existingPlugin) {
              try {
                // Look up the plugin product to get the actual product ID
                const pluginProducts = await storage.getPluginProductsByPluginId(productId);
                if (pluginProducts && pluginProducts.length > 0) {
                  // Get the first matching product (we could be more specific with price matching)
                  const product = pluginProducts[0];
                  
                  // Grant access to the plugin
                  await storage.createUserPlugin({
                    userId,
                    pluginId: productId,
                    productId: product.id,
                    active: true,
                    stripePaymentId: paymentIntent.id,
                    stripeProductId: product.stripeProductId || null
                  });
                  
                  await storage.createLog({
                    level: 'INFO',
                    service: 'billing',
                    message: `User ${userId} granted access to plugin ${productId} via payment intent ${paymentIntent.id}`
                  });
                } else {
                  await storage.createLog({
                    level: 'ERROR',
                    service: 'billing',
                    message: `No product found for plugin ${productId} when processing payment intent ${paymentIntent.id}`
                  });
                }
              } catch (error: any) {
                await storage.createLog({
                  level: 'ERROR',
                  service: 'billing',
                  message: `Error granting access to plugin ${productId}: ${error.message}`
                });
              }
            }
          }
          
          await storage.createLog({
            level: 'INFO',
            service: 'billing',
            message: `Payment intent succeeded: ${paymentIntent.id}`
          });
          break;
        }
        
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await storage.createLog({
            level: 'WARN',
            service: 'billing',
            message: `Payment failed: ${paymentIntent.id}, reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`
          });
          break;
        }
        
        // Invoice events
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          
          // Handle subscription renewal
          const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
          if (subscriptionId) {
            // Find user with this subscription
            const userId = await storage.getUserIdByStripeSubscriptionId(subscriptionId);
            if (userId) {
              // Update subscription status to active if needed
              await storage.updateStripeSubscriptionStatus(userId, 'active');
              
              // Ensure all associated plugins are active
              try {
                const userPlugins = await storage.getUserPlugins(userId);
                for (const plugin of userPlugins) {
                  if (!plugin.active) {
                    await storage.updateUserPlugin(plugin.id, { active: true });
                    
                    await storage.createLog({
                      level: 'INFO',
                      service: 'billing',
                      message: `Reactivated plugin ${plugin.pluginId} for user ${userId} after invoice payment`
                    });
                  }
                }
              } catch (error: any) {
                await storage.createLog({
                  level: 'ERROR',
                  service: 'billing',
                  message: `Error updating plugins for user ${userId}: ${error.message}`
                });
              }
              
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
        
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          
          const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
          if (subscriptionId) {
            const userId = await storage.getUserIdByStripeSubscriptionId(subscriptionId);
            if (userId) {
              // Update subscription status
              await storage.updateStripeSubscriptionStatus(userId, 'past_due');
              
              // Log the failure
              await storage.createLog({
                level: 'WARN',
                service: 'billing',
                message: `Invoice payment failed for user ${userId}, subscription ${subscriptionId}`
              });
            }
          }
          
          break;
        }
        
        // Subscription events
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          // This is usually handled by checkout.session.completed, but handle direct API-created subscriptions
          
          // Find the user by customer ID
          const customerId = subscription.customer as string;
          const users = await storage.getUserByStripeCustomerId(customerId);
          
          if (users && users.length > 0) {
            const userId = users[0].id;
            await storage.updateStripeSubscriptionId(userId, subscription.id);
            await storage.updateStripeSubscriptionStatus(userId, subscription.status);
            
            await storage.createLog({
              level: 'INFO',
              service: 'billing',
              message: `Subscription created for user ${userId}: ${subscription.id}`
            });
          }
          
          break;
        }
        
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          
          // Find user with this subscription
          const userId = await storage.getUserIdByStripeSubscriptionId(subscription.id);
          if (userId) {
            // Update subscription status
            await storage.updateStripeSubscriptionStatus(userId, subscription.status);
            
            await storage.createLog({
              level: 'INFO',
              service: 'billing',
              message: `Subscription updated for user ${userId}: ${subscription.id}, status: ${subscription.status}`
            });
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
            
            // Update any plugins tied to this subscription to be inactive
            const userPlugins = await storage.getUserPlugins(userId);
            for (const plugin of userPlugins) {
              // We don't track stripeSubscriptionId in userPlugins, but we can identify via metadata
              // or by checking the product type in the future if needed
              if (plugin.active) {
                await storage.updateUserPlugin(plugin.id, {
                  active: false
                });
              }
            }
            
            // Log the cancellation
            await storage.createLog({
              level: 'INFO',
              service: 'billing',
              message: `Subscription cancelled for user ${userId}: ${subscription.id}`,
            });
          }
          
          break;
        }
        
        // Customer events
        case 'customer.created':
        case 'customer.updated':
        case 'customer.deleted': {
          const customer = event.data.object as Stripe.Customer;
          
          // For audit purposes
          await storage.createLog({
            level: 'INFO',
            service: 'billing',
            message: `Customer ${event.type.split('.')[1]}: ${customer.id}`
          });
          
          break;
        }
        
        default:
          // Log unhandled event types
          await storage.createLog({
            level: 'INFO',
            service: 'billing',
            message: `Unhandled webhook event type: ${event.type}`
          });
      }
    } catch (error: any) {
      console.error(`Error processing webhook event ${event.type}:`, error);
      
      await storage.createLog({
        level: 'ERROR',
        service: 'billing',
        message: `Error processing webhook event ${event.type}: ${error.message}`
      });
      
      throw error;
    }
  }
}

export const billingService = new BillingService();