import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CreditCard } from "lucide-react";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscriptionForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/billing',
        },
      });

      if (error) {
        toast({
          title: "Subscription Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription Successful",
          description: "Thank you for subscribing!",
        });
        setLocation('/billing');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      toast({
        title: "Subscription Error",
        description: "An unexpected error occurred while processing your subscription",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={!stripe || isProcessing} className="w-full">
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Subscribe Now
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [subscriptionDetails, setSubscriptionDetails] = useState({
    name: "Premium Plan",
    price: "$19.99",
    interval: "month"
  });

  useEffect(() => {
    // Get or create subscription
    const fetchSubscription = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("POST", "/api/get-or-create-subscription");
        
        if (!response.ok) {
          throw new Error('Failed to create subscription');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
        
        // In a real implementation, we would fetch the subscription details
        // setSubscriptionDetails(data.subscriptionDetails);
      } catch (error) {
        console.error('Error creating subscription:', error);
        toast({
          title: "Subscription Error",
          description: "Unable to initialize the subscription process. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [toast]);

  return (
    <div className="container mx-auto p-6 max-w-lg">
      <Button 
        variant="outline" 
        className="mb-6"
        onClick={() => setLocation('/marketplace')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Subscribe to {subscriptionDetails.name}</CardTitle>
          <CardDescription>
            {subscriptionDetails.price}/{subscriptionDetails.interval} - Enter your payment information to start your subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscriptionForm />
            </Elements>
          ) : (
            <div className="text-center py-4 text-red-500">
              Unable to initialize subscription. Please try again later.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}