import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CheckoutButtonProps extends ButtonProps {
  productId?: number;
  productType: 'one-time' | 'subscription';
  buttonText?: string;
}

export function CheckoutButton({
  productId,
  productType,
  buttonText = 'Purchase Now',
  className,
  variant = 'default',
  ...props
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      
      // Based on the product type, redirect to the appropriate page
      if (productType === 'subscription') {
        setLocation('/subscribe');
      } else {
        setLocation('/checkout');
      }
    } catch (error) {
      console.error('Error navigating to checkout:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to proceed to checkout',
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
          Processing...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}