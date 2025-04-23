import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BillingPortalLinkProps extends ButtonProps {
  buttonText?: string;
}

export function BillingPortalLink({ 
  buttonText = "Manage Billing", 
  className,
  variant = "default",
  ...props 
}: BillingPortalLinkProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/billing/create-portal-session');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create billing portal session');
      }
      
      const { url } = await response.json();
      
      // Redirect to the Stripe Billing Portal
      window.location.href = url;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to open billing portal',
        variant: "destructive",
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