import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, FileJson, Code, Play, Upload, Download, ExternalLink, Book, Video } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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

interface PluginCompletionStepProps {
  pluginData: PluginData;
}

export default function PluginCompletionStep({ pluginData }: PluginCompletionStepProps) {
  const downloadManifest = () => {
    const manifest = {
      name: pluginData.name,
      version: pluginData.version,
      description: pluginData.description,
      entryPoint: pluginData.entryPoint,
      ...(pluginData.hasQuotas ? {
        quotas: {
          cpuMs: pluginData.cpuMs,
          memKb: pluginData.memKb
        }
      } : {})
    };
    
    // Create a download link for the manifest
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const downloadPluginCode = () => {
    // Create a download link for the plugin code
    const blob = new Blob([pluginData.code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pluginData.entryPoint;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
        <p className="text-lg text-muted-foreground">
          You've completed the TerraFusion plugin creation tutorial
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Tutorial Summary</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                  <FileJson className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">1. Create Manifest</h4>
                  <p className="text-sm text-muted-foreground">
                    You defined your plugin's metadata and resource quotas
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                  <Code className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">2. Write Plugin Code</h4>
                  <p className="text-sm text-muted-foreground">
                    You wrote the JavaScript code for your plugin functionality
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                  <Play className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">3. Test Your Plugin</h4>
                  <p className="text-sm text-muted-foreground">
                    You tested your plugin with sample data in a sandbox environment
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">4. Publish Plugin</h4>
                  <p className="text-sm text-muted-foreground">
                    You prepared your plugin for publication to the marketplace
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <h4 className="font-medium">Download Your Files</h4>
              <div className="flex flex-col md:flex-row gap-2">
                <Button variant="outline" onClick={downloadManifest} className="flex-1">
                  <Download className="mr-2 h-4 w-4" /> manifest.json
                </Button>
                <Button variant="outline" onClick={downloadPluginCode} className="flex-1">
                  <Download className="mr-2 h-4 w-4" /> {pluginData.entryPoint}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 h-full">
            <h3 className="text-lg font-medium mb-4">Next Steps</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Button variant="outline" size="sm" className="mt-0.5 h-8 w-8 p-0">
                  <Book className="h-4 w-4" />
                </Button>
                <div>
                  <h4 className="font-medium">Read the Documentation</h4>
                  <p className="text-sm text-muted-foreground mb-1">
                    Explore detailed plugin development guides
                  </p>
                  <Button variant="link" className="h-auto p-0 text-sm" asChild>
                    <a href="#" target="_blank">
                      View Documentation <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Button variant="outline" size="sm" className="mt-0.5 h-8 w-8 p-0">
                  <Video className="h-4 w-4" />
                </Button>
                <div>
                  <h4 className="font-medium">Watch Advanced Tutorials</h4>
                  <p className="text-sm text-muted-foreground mb-1">
                    Learn advanced plugin development techniques
                  </p>
                  <Button variant="link" className="h-auto p-0 text-sm" asChild>
                    <a href="#" target="_blank">
                      View Tutorials <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Button variant="outline" size="sm" className="mt-0.5 h-8 w-8 p-0">
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <div>
                  <h4 className="font-medium">Join the Developer Community</h4>
                  <p className="text-sm text-muted-foreground mb-1">
                    Connect with other TerraFusion plugin developers
                  </p>
                  <Button variant="link" className="h-auto p-0 text-sm" asChild>
                    <a href="#" target="_blank">
                      Join Community <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
            
            <Alert className="mt-6 bg-blue-50 border-blue-200">
              <AlertTitle className="text-blue-800">Developer Dashboard</AlertTitle>
              <AlertDescription className="text-blue-700">
                <p className="mb-2">Track your plugin's performance and manage updates from the developer dashboard</p>
                <Button asChild size="sm" className="mt-1">
                  <a href="/developer/dashboard">
                    Go to Dashboard
                  </a>
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground mb-3">
          Want to create another plugin? You can start the tutorial again anytime.
        </p>
        <Button asChild>
          <a href="/marketplace">
            Explore Marketplace
          </a>
        </Button>
      </div>
    </div>
  );
}