import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Check, AlertCircle, Tag } from "lucide-react";
import { PluginProduct } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Marketplace() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<PluginProduct | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Fetch plugin products
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/marketplace/products'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Group products by plugin
  const productsByPlugin: Record<number, PluginProduct[]> = {};
  if (products) {
    products.forEach((product: PluginProduct) => {
      if (!productsByPlugin[product.pluginId]) {
        productsByPlugin[product.pluginId] = [];
      }
      productsByPlugin[product.pluginId].push(product);
    });
  }
  
  // Handle checkout click
  const handleCheckout = async (product: PluginProduct) => {
    setSelectedProduct(product);
    
    try {
      // Attempt to create a payment intent
      // This will redirect to login if not authenticated
      const response = await apiRequest('POST', '/api/marketplace/create-payment-intent', {
        productId: product.id
      });
      
      if (response.ok) {
        const data = await response.json();
        // Show checkout component and pass the client secret
        setShowCheckout(true);
        
        // This would normally trigger the Stripe checkout component
        // but for now we'll just show a success message
        toast({
          title: "Payment Initiated",
          description: `Ready to process payment for ${product.name}`,
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to initiate payment",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to payment service",
      });
    }
  };
  
  // Render feature bullet points
  const renderFeatures = (product: PluginProduct) => {
    if (!product.features || !product.features.items) return null;
    
    return (
      <ul className="mt-2 space-y-1">
        {product.features.items.map((feature: string, index: number) => (
          <li key={index} className="flex items-start">
            <Check className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    );
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No plugins available</h2>
          <p className="text-muted-foreground max-w-md">
            There are currently no plugins available in the marketplace. Please check back later.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Plugin Marketplace</h1>
        <p className="text-muted-foreground text-lg">
          Extend your TerraFusion platform with additional plugins and features
        </p>
      </div>
      
      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Plugins</TabsTrigger>
          <TabsTrigger value="one-time">One-time Purchase</TabsTrigger>
          <TabsTrigger value="subscription">Subscriptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {Object.keys(productsByPlugin).map((pluginIdStr) => {
            const pluginId = parseInt(pluginIdStr);
            const pluginProducts = productsByPlugin[pluginId];
            
            // Skip if no products in this category
            if (pluginProducts.length === 0) return null;
            
            return (
              <div key={pluginId} className="mb-12">
                <div className="flex items-center mb-4">
                  <h2 className="text-2xl font-bold">{pluginProducts[0]?.name.split(' ')[0]} Plugin</h2>
                  <Badge variant="outline" className="ml-3">
                    {pluginProducts.length} {pluginProducts.length === 1 ? 'option' : 'options'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pluginProducts.map((product) => (
                    <Card key={product.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="mb-1">{product.name}</CardTitle>
                            <CardDescription>{product.description}</CardDescription>
                          </div>
                          {product.type === 'subscription' ? (
                            <Badge>Subscription</Badge>
                          ) : (
                            <Badge variant="outline">One-time</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="flex items-baseline mb-4">
                          <span className="text-3xl font-bold">${product.price}</span>
                          {product.type === 'subscription' && (
                            <span className="ml-1 text-muted-foreground">/month</span>
                          )}
                        </div>
                        
                        <Separator className="my-4" />
                        {renderFeatures(product)}
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          onClick={() => handleCheckout(product)}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {product.type === 'subscription' ? 'Subscribe' : 'Purchase'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>
        
        <TabsContent value="one-time">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter((product: PluginProduct) => product.type === 'one-time')
              .map((product: PluginProduct) => (
                <Card key={product.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="mb-1">{product.name}</CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        <Tag className="w-3 h-3 mr-1" />
                        One-time
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-baseline mb-4">
                      <span className="text-3xl font-bold">${product.price}</span>
                    </div>
                    
                    <Separator className="my-4" />
                    {renderFeatures(product)}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => handleCheckout(product)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Purchase
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="subscription">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter((product: PluginProduct) => product.type === 'subscription')
              .map((product: PluginProduct) => (
                <Card key={product.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="mb-1">{product.name}</CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                      </div>
                      <Badge>Subscription</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-baseline mb-4">
                      <span className="text-3xl font-bold">${product.price}</span>
                      <span className="ml-1 text-muted-foreground">/month</span>
                    </div>
                    
                    <Separator className="my-4" />
                    {renderFeatures(product)}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => handleCheckout(product)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Subscribe
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* This would be replaced with the Stripe Elements checkout component */}
      {showCheckout && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Complete Your Purchase</CardTitle>
              <CardDescription>
                {selectedProduct.name} - ${selectedProduct.price}
                {selectedProduct.type === 'subscription' && '/month'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground mb-4">
                This is a placeholder for the Stripe checkout form.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowCheckout(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowCheckout(false);
                toast({
                  title: "Purchase Complete",
                  description: `You have successfully purchased ${selectedProduct.name}`,
                });
              }}>
                Complete Purchase
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}