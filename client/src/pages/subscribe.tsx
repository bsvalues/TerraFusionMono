import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'wouter';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

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
          return_url: window.location.origin,
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
          title: "Subscription Created",
          description: "You are now subscribed!",
        });
      }
    } catch (err) {
      console.error('Subscription error:', err);
      toast({
        title: "Subscription Failed",
        description: "An unexpected error occurred during subscription setup.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4 pt-6">
        <PaymentElement />
      </CardContent>
      <CardFooter className="pt-4">
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Subscribe Now'
          )}
        </Button>
      </CardFooter>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [subscriptionDetails, setSubscriptionDetails] = useState({
    name: "Premium Plugin Access",
    price: "$19.99/month",
    features: [
      "Access to all premium plugins",
      "Priority support",
      "Early access to new features"
    ]
  });

  useEffect(() => {
    // Create subscription as soon as the page loads
    const fetchSubscription = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("POST", "/api/get-or-create-subscription");
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create subscription');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating subscription:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to initialize subscription',
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="container py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Setting Up Subscription</CardTitle>
            <CardDescription>Please wait while we prepare your subscription...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-10">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Subscription Error</CardTitle>
            <CardDescription>There was a problem setting up your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
          <CardFooter>
            <Link href="/marketplace">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Marketplace
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="container py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Subscription Initialization Failed</CardTitle>
            <CardDescription>Unable to initialize subscription process</CardDescription>
          </CardHeader>
          <CardContent>
            <p>We couldn't initialize the subscription process. Please try again later.</p>
          </CardContent>
          <CardFooter>
            <Link href="/marketplace">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Marketplace
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="container py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{subscriptionDetails.name}</CardTitle>
          <CardDescription>
            <span className="text-lg font-medium">{subscriptionDetails.price}</span> - Subscribe to unlock premium features
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <ul className="space-y-2">
            {subscriptionDetails.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <span className="bg-primary/10 text-primary p-1 rounded-full mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
        <Separator />
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SubscribeForm />
        </Elements>
      </Card>
    </div>
  );
};