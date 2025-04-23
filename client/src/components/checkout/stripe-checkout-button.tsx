import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ShoppingCartIcon, Loader2Icon } from 'lucide-react';

interface StripeCheckoutButtonProps {
  priceId: string;
  mode?: 'payment' | 'subscription';
  buttonText?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  productName?: string;
}

/**
 * Button component that initiates a Stripe checkout session
 */
export function StripeCheckoutButton({
  priceId,
  mode = 'payment',
  buttonText = 'Buy Now',
  buttonVariant = 'default',
  className = '',
  productName = 'product'
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (!priceId) {
      toast({
        title: 'Error',
        description: 'No price ID specified',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/billing/create-checkout-session', {
        priceId,
        mode,
      });
      
      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      toast({
        title: 'Error creating checkout session',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      variant={buttonVariant}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <ShoppingCartIcon className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
}