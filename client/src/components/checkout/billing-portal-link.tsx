import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CreditCardIcon, Loader2Icon } from 'lucide-react';

interface BillingPortalLinkProps {
  buttonText?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

/**
 * Button component that redirects to the Stripe Billing Portal
 */
export function BillingPortalLink({
  buttonText = 'Manage Subscription',
  buttonVariant = 'outline',
  className = '',
}: BillingPortalLinkProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePortalRedirect = async () => {
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/billing/create-portal-session', {});
      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe Billing Portal
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      toast({
        title: 'Error accessing billing portal',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePortalRedirect}
      disabled={isLoading}
      variant={buttonVariant}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <CreditCardIcon className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
}