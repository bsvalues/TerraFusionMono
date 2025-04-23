import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BillingPortalLink } from "@/components/checkout/billing-portal-link";
import { format } from "date-fns";
import { CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";

export default function BillingPage() {
  // Fetch user subscription info
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/auth/profile'],
  });

  // Fetch user's active plugins
  const { data: plugins, isLoading: pluginsLoading } = useQuery({
    queryKey: ['/api/marketplace/user-plugins'],
  });

  // Loading state
  if (isLoading || pluginsLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Not authenticated state
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground max-w-md">
            Please log in to view your billing information.
          </p>
        </div>
      </div>
    );
  }

  // Subscription status
  const hasActiveSubscription = user.stripeSubscriptionId && user.stripeSubscriptionStatus === 'active';

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
        <p className="text-muted-foreground text-lg">
          Manage your subscription and view your purchased plugins
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscription status */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Your current subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {hasActiveSubscription ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                  <span className="font-medium">Active subscription</span>
                  <Badge variant="outline" className="ml-2">
                    {user.stripeSubscriptionStatus}
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
                  <span className="font-medium">No active subscription</span>
                </>
              )}
            </div>
            {user.stripeCustomerId && (
              <div className="mt-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Customer ID: {user.stripeCustomerId.slice(0, 8)}...</span>
                </div>
                {user.stripeSubscriptionId && (
                  <div className="mt-1">
                    Subscription ID: {user.stripeSubscriptionId.slice(0, 8)}...
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <BillingPortalLink 
              buttonText="Manage Subscription" 
              className="w-full"
            />
          </CardFooter>
        </Card>

        {/* Usage overview */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>Your resource consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">API Requests</span>
                  <span className="text-sm text-muted-foreground">75%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Storage</span>
                  <span className="text-sm text-muted-foreground">30%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Processing Time</span>
                  <span className="text-sm text-muted-foreground">50%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Purchased plugins */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Your Plugins</h2>
        {plugins && plugins.length > 0 ? (
          <Table>
            <TableCaption>List of your purchased and subscribed plugins</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Plugin Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plugins.map((plugin) => (
                <TableRow key={plugin.id}>
                  <TableCell className="font-medium">{plugin.name}</TableCell>
                  <TableCell>
                    <Badge variant={plugin.type === 'subscription' ? 'default' : 'outline'}>
                      {plugin.type === 'subscription' ? 'Subscription' : 'One-time'}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(plugin.purchaseDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <span className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      Active
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center text-center">
                <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-1">No Plugins Purchased</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  You haven't purchased any plugins yet. Visit the marketplace to extend your TerraFusion platform.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}