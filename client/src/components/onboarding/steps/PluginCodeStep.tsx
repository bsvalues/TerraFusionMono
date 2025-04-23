import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Info, LightbulbIcon } from "lucide-react";

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

interface PluginCodeStepProps {
  pluginData: PluginData;
  updatePluginData: (updates: Partial<PluginData>) => void;
}

export default function PluginCodeStep({ pluginData, updatePluginData }: PluginCodeStepProps) {
  const simpleTemplateCode = `module.exports = {
  // This function will be called when your plugin is used
  analyze: function(data) {
    // Your plugin code here
    console.log("Processing data:", data);

    // Return the results
    return { 
      result: "Analysis complete",
      score: 0.85,
      categories: ["residential", "urban"]
    };
  }
};`;

  const advancedTemplateCode = `module.exports = {
  // Initialize the plugin (called once when plugin is loaded)
  initialize: function() {
    console.log("Plugin initialized");
    // You can set up state or resources here
    this.cache = new Map();
    return { status: "ready" };
  },

  // Main analysis function (called for each request)
  analyze: function(data) {
    // Input validation
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid input data");
    }

    // Process the data
    const result = this.processData(data);
    
    // Cache the result for future use
    if (data.id) {
      this.cache.set(data.id, result);
    }

    return result;
  },

  // Helper function for data processing
  processData: function(data) {
    // Check cache first
    if (data.id && this.cache.has(data.id)) {
      return this.cache.get(data.id);
    }

    // Compute result
    const score = Math.random();
    const categories = ["residential", "urban"];
    
    if (data.size > 5000) {
      categories.push("large-parcel");
    }

    return {
      timestamp: new Date().toISOString(),
      score,
      categories,
      metadata: {
        processingTime: Date.now(),
        version: "${pluginData.version}"
      }
    };
  },

  // Clean up resources when plugin is unloaded
  cleanup: function() {
    console.log("Plugin cleanup");
    this.cache.clear();
    return { status: "shutdown_complete" };
  }
};`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Write Your Plugin Code</h3>
        <p className="text-sm text-muted-foreground">
          Now it's time to write the code for your TerraFusion plugin.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Plugin Structure</AlertTitle>
        <AlertDescription>
          <p>Your plugin must export an object with at least an <code className="text-xs bg-muted rounded px-1">analyze</code> function. This function will be called when your plugin is used.</p>
          <p className="mt-1">You can also export <code className="text-xs bg-muted rounded px-1">initialize</code> and <code className="text-xs bg-muted rounded px-1">cleanup</code> functions for setup and teardown.</p>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="editor">Code Editor</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="editor" className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="plugin-code">Your Plugin Code</Label>
            <Textarea 
              id="plugin-code"
              value={pluginData.code}
              onChange={(e) => updatePluginData({ code: e.target.value })}
              className="font-mono h-[400px]"
            />
            <p className="text-xs text-muted-foreground">
              Write JavaScript code for your plugin. Only the standard Node.js modules are available.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="templates" className="space-y-4 mt-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div 
              className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
              onClick={() => updatePluginData({ code: simpleTemplateCode })}
            >
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">Simple Template</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Basic plugin with just an analyze function. Good for beginners.
              </p>
              <div className="bg-muted rounded-md p-2 overflow-x-auto">
                <pre className="text-xs">
                  <code>{simpleTemplateCode.split('\n').slice(0, 8).join('\n')}...</code>
                </pre>
              </div>
            </div>
            
            <div 
              className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
              onClick={() => updatePluginData({ code: advancedTemplateCode })}
            >
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-5 w-5 text-purple-500" />
                <h4 className="font-medium">Advanced Template</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Full-featured plugin with initialization, caching, and cleanup.
              </p>
              <div className="bg-muted rounded-md p-2 overflow-x-auto">
                <pre className="text-xs">
                  <code>{advancedTemplateCode.split('\n').slice(0, 8).join('\n')}...</code>
                </pre>
              </div>
            </div>
          </div>

          <Alert className="mt-4" variant="default">
            <LightbulbIcon className="h-4 w-4" />
            <AlertTitle>Tips for Plugin Development</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Keep your code lightweight to stay within resource quotas</li>
                <li>Use caching for repeated operations</li>
                <li>Add thorough error handling</li>
                <li>Validate input data before processing</li>
                <li>Use descriptive function and variable names</li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      <div className="bg-muted rounded-md p-4">
        <h4 className="text-sm font-medium mb-2">Available Resources</h4>
        <p className="text-sm text-muted-foreground mb-2">
          Your plugin runs in a secure sandbox with the following limitations:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>CPU time: {pluginData.cpuMs}ms maximum</li>
          <li>Memory: {pluginData.memKb / 1024}MB maximum</li>
          <li>No file system access</li>
          <li>No network access</li>
          <li>Standard JavaScript APIs only</li>
          <li>console.log/error/warn for debugging</li>
        </ul>
      </div>
    </div>
  );
}