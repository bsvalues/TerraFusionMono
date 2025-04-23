import { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface BillingPortalLinkProps extends ButtonProps {
  buttonText?: string;
}

export function BillingPortalLink({
  buttonText = 'Manage Subscription',
  className,
  variant = 'outline',
  ...props
}: BillingPortalLinkProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      
      // Create a customer portal session from the server
      const response = await apiRequest('POST', '/api/billing/create-portal-session');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create billing portal session');
      }
      
      const { url } = await response.json();
      
      // Redirect to the Stripe Customer Portal
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No portal URL returned from the server');
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to open billing portal',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      variant={variant}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}