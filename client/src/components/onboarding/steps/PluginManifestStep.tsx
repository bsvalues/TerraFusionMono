import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";

interface PluginData {
  name: string;
  version: string;
  description: string;
  entryPoint: string;
  hasQuotas: boolean;
  cpuMs: number;
  memKb: number;
}

interface PluginManifestStepProps {
  pluginData: PluginData;
  updatePluginData: (updates: Partial<PluginData>) => void;
}

export default function PluginManifestStep({ pluginData, updatePluginData }: PluginManifestStepProps) {
  const manifestPreview = `{
  "name": "${pluginData.name}",
  "version": "${pluginData.version}",
  "description": "${pluginData.description}",
  "entryPoint": "${pluginData.entryPoint}"${pluginData.hasQuotas ? `,
  "quotas": {
    "cpuMs": ${pluginData.cpuMs},
    "memKb": ${pluginData.memKb}
  }` : ''}
}`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create your plugin manifest</h3>
        <p className="text-sm text-muted-foreground">
          The manifest file defines your plugin's metadata and resource limits.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>What is a plugin manifest?</AlertTitle>
        <AlertDescription>
          A plugin manifest is a JSON file that describes your plugin to TerraFusion. 
          It includes basic information like name and version, as well as resource quotas 
          that determine how much CPU and memory your plugin can use.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plugin-name">Plugin Name</Label>
            <Input 
              id="plugin-name" 
              value={pluginData.name}
              onChange={(e) => updatePluginData({ name: e.target.value })}
              placeholder="my-awesome-plugin"
            />
            <p className="text-xs text-muted-foreground">
              Use lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plugin-version">Version</Label>
            <Input 
              id="plugin-version" 
              value={pluginData.version}
              onChange={(e) => updatePluginData({ version: e.target.value })}
              placeholder="1.0.0"
            />
            <p className="text-xs text-muted-foreground">
              Follow semantic versioning (e.g., 1.0.0).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plugin-description">Description</Label>
            <Textarea 
              id="plugin-description"
              value={pluginData.description}
              onChange={(e) => updatePluginData({ description: e.target.value })}
              placeholder="Describe what your plugin does"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plugin-entry">Entry Point</Label>
            <Input 
              id="plugin-entry" 
              value={pluginData.entryPoint}
              onChange={(e) => updatePluginData({ entryPoint: e.target.value })}
              placeholder="index.js"
            />
            <p className="text-xs text-muted-foreground">
              The main JavaScript file of your plugin.
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="plugin-quotas" 
                checked={pluginData.hasQuotas}
                onCheckedChange={(checked) => updatePluginData({ hasQuotas: checked })}
              />
              <Label htmlFor="plugin-quotas">Set Resource Quotas</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Define CPU and memory limits for your plugin.
            </p>
          </div>

          {pluginData.hasQuotas && (
            <div className="space-y-6 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="cpu-quota">CPU Time Limit</Label>
                  <span className="text-sm text-muted-foreground">{pluginData.cpuMs}ms</span>
                </div>
                <Slider
                  id="cpu-quota"
                  min={100}
                  max={5000}
                  step={100}
                  value={[pluginData.cpuMs]}
                  onValueChange={(value) => updatePluginData({ cpuMs: value[0] })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum CPU time your plugin can use (in milliseconds).
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="mem-quota">Memory Limit</Label>
                  <span className="text-sm text-muted-foreground">{pluginData.memKb / 1024}MB</span>
                </div>
                <Slider
                  id="mem-quota"
                  min={1024}
                  max={102400}
                  step={1024}
                  value={[pluginData.memKb]}
                  onValueChange={(value) => updatePluginData({ memKb: value[0] })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum memory your plugin can use (in kilobytes).
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="space-y-2">
            <Label>Manifest Preview</Label>
            <div className="rounded-md bg-black p-4">
              <pre className="text-white text-sm whitespace-pre-wrap break-all font-mono">
                {manifestPreview}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              This is how your manifest.json file will look.
            </p>
          </div>

          <Alert className="mt-6" variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Resource Quotas</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Higher resource quotas are available through premium subscriptions.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Free tier: Up to 1000ms CPU time and 10MB memory</li>
                <li>Standard tier: Up to 3000ms CPU time and 50MB memory</li>
                <li>Premium tier: Up to 5000ms CPU time and 100MB memory</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}