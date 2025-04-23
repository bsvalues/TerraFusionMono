import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { InfoIcon, DollarSign, Upload, CheckCircle2, BarChart, Users, ShieldCheck } from 'lucide-react';

interface PluginData {
  name: string;
  version: string;
  description: string;
  entryPoint: string;
  code: string;
  hasQuotas: boolean;
  cpuMs: number;
  memKb: number;
}

interface PluginPublishStepProps {
  pluginData: PluginData;
}

export default function PluginPublishStep({ pluginData }: PluginPublishStepProps) {
  const [pricing, setPricing] = useState<'free' | 'paid' | 'subscription'>('free');
  const [price, setPrice] = useState<string>('0');
  const [categories, setCategories] = useState<string[]>(['utility']);
  const [bundleSize, setBundleSize] = useState<string>('');
  const [additionalDescription, setAdditionalDescription] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  const mockUpload = () => {
    setStatus('uploading');
    setUploadProgress(0);
    
    // Simulate an upload process
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 5 + Math.floor(Math.random() * 10);
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => setStatus('success'), 500);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Publish Your Plugin</h3>
        <p className="text-sm text-muted-foreground">
          Configure how your plugin will appear in the TerraFusion marketplace.
        </p>
      </div>
      
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Publishing Process</AlertTitle>
        <AlertDescription>
          Once published, your plugin will be available to all TerraFusion users based on your pricing model.
          You can update or remove your plugin at any time from the developer dashboard.
        </AlertDescription>
      </Alert>
      
      {status === 'success' ? (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg text-green-800">Plugin Submitted Successfully</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-green-700">
              Your plugin <strong>{pluginData.name}</strong> has been submitted to the TerraFusion marketplace.
              The review process typically takes 1-2 business days.
            </p>
            
            <Alert className="bg-white border-green-200">
              <InfoIcon className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">What's Next?</AlertTitle>
              <AlertDescription className="text-green-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>You'll receive an email notification when your plugin is approved</li>
                  <li>You can track the review status in your developer dashboard</li>
                  <li>Make sure to respond to any review comments promptly</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Card className="bg-white">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <BarChart className="h-8 w-8 text-blue-500 mb-2" />
                  <h4 className="font-medium text-sm">Track Analytics</h4>
                  <p className="text-xs text-muted-foreground">
                    See your plugin performance
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Users className="h-8 w-8 text-purple-500 mb-2" />
                  <h4 className="font-medium text-sm">User Feedback</h4>
                  <p className="text-xs text-muted-foreground">
                    Monitor reviews and ratings
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <ShieldCheck className="h-8 w-8 text-green-500 mb-2" />
                  <h4 className="font-medium text-sm">Version Management</h4>
                  <p className="text-xs text-muted-foreground">
                    Publish updates any time
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Marketplace Information</h4>
              
              <div className="space-y-2">
                <Label htmlFor="plugin-categories">Categories</Label>
                <Select defaultValue="utility" onValueChange={(val) => setCategories([val])}>
                  <SelectTrigger id="plugin-categories">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utility">Utility</SelectItem>
                    <SelectItem value="data-processing">Data Processing</SelectItem>
                    <SelectItem value="visualization">Visualization</SelectItem>
                    <SelectItem value="ai-ml">AI & Machine Learning</SelectItem>
                    <SelectItem value="geo-mapping">GIS & Mapping</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bundle-size">Plugin Bundle Size</Label>
                <Input 
                  id="bundle-size" 
                  value={bundleSize}
                  onChange={(e) => setBundleSize(e.target.value)}
                  placeholder="e.g., 52 KB"
                />
                <p className="text-xs text-muted-foreground">
                  The total size of your plugin and any included assets.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additional-description">Additional Description</Label>
                <Textarea 
                  id="additional-description"
                  value={additionalDescription}
                  onChange={(e) => setAdditionalDescription(e.target.value)}
                  placeholder="Provide additional details about your plugin's functionality, use cases, etc."
                  rows={3}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium">Pricing Model</h4>
              
              <RadioGroup value={pricing} onValueChange={(val: any) => setPricing(val)}>
                <div className="flex items-start space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="free" id="pricing-free" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="pricing-free" className="font-medium">Free</Label>
                    <p className="text-sm text-muted-foreground">
                      Available to all TerraFusion users at no cost
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="paid" id="pricing-paid" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="pricing-paid" className="font-medium">One-time Purchase</Label>
                    <p className="text-sm text-muted-foreground">
                      Users pay once to access your plugin permanently
                    </p>
                    {pricing === 'paid' && (
                      <div className="mt-2">
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number"
                            min="0.99"
                            step="0.50"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="subscription" id="pricing-subscription" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="pricing-subscription" className="font-medium">Subscription</Label>
                    <p className="text-sm text-muted-foreground">
                      Users pay a recurring fee to access your plugin
                    </p>
                    {pricing === 'subscription' && (
                      <div className="mt-2">
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number"
                            min="0.99"
                            step="0.50"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="pl-8"
                          />
                          <span className="absolute right-2 top-2 text-sm text-muted-foreground">/ month</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </RadioGroup>
              
              {pricing !== 'free' && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <InfoIcon className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700 text-sm">
                    TerraFusion takes a 15% commission on all plugin sales.
                    Payouts are processed monthly for all sales.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium">Legal & Publishing</h4>
              
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" />
                  <div>
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the TerraFusion Developer Terms of Service
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Your plugin must comply with our platform policies and guidelines.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox id="ownership" />
                  <div>
                    <Label htmlFor="ownership" className="text-sm">
                      I confirm that I have the rights to all plugin content
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      You must own or have permission to use all code and assets in your plugin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Publish Preview</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-medium text-lg">{pluginData.name}</h4>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary h-10 w-10 rounded-md flex items-center justify-center text-primary-foreground font-bold">
                      {pluginData.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Version {pluginData.version}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {categories.map(category => (
                          <span key={category} className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm">{pluginData.description}</p>
                {additionalDescription && (
                  <p className="text-sm text-muted-foreground">{additionalDescription}</p>
                )}
                
                <div className="flex items-center justify-between bg-muted p-2 rounded-md text-sm">
                  <span>Bundle Size</span>
                  <span className="font-medium">{bundleSize || 'Unknown'}</span>
                </div>
                
                <div className="flex items-center justify-between bg-muted p-2 rounded-md text-sm">
                  <span>Resource Limits</span>
                  <span className="font-medium">{pluginData.cpuMs}ms / {pluginData.memKb / 1024}MB</span>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Price</span>
                  <span className="font-bold">
                    {pricing === 'free' ? (
                      'Free'
                    ) : pricing === 'paid' ? (
                      `$${parseFloat(price) > 0 ? price : '0.00'}`
                    ) : (
                      `$${parseFloat(price) > 0 ? price : '0.00'}/month`
                    )}
                  </span>
                </div>
                
                {status === 'uploading' ? (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-center text-muted-foreground">
                      Uploading plugin ({uploadProgress}%)...
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={mockUpload} 
                    className="w-full"
                    disabled={!categories.length}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Publish Plugin
                  </Button>
                )}
              </CardContent>
            </Card>
            
            <Alert className="mt-6">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Review Process</AlertTitle>
              <AlertDescription>
                All plugins undergo a review process to ensure quality and security before being published to the marketplace.
                This typically takes 1-2 business days.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
    </div>
  );
}