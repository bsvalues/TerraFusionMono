import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { Search, Filter, ArrowDownUp, Package } from 'lucide-react';
import PluginInstaller from '@/components/PluginInstaller';

interface Plugin {
  id: number;
  name: string;
  description: string;
  status: string;
  version: string;
  author: string;
  size: string;
  price?: string;
  tags: string[];
  isInstalled: boolean;
}

interface Product {
  id: number;
  pluginId: number;
  name: string;
  description: string;
  price: number;
  status: string;
  type: 'one-time' | 'subscription';
  stripeProductId: string;
  stripePriceId: string;
}

export default function PluginMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('name');
  const [activeTab, setActiveTab] = useState('marketplace');
  
  // Fetch available plugins from the marketplace
  const { data: marketplacePlugins, isLoading: marketplaceLoading } = useQuery({
    queryKey: ['/api/marketplace/products'],
    select: (data: any) => {
      return data.map((product: Product) => ({
        id: product.pluginId,
        name: product.name,
        description: product.description,
        price: product.price > 0 ? `$${product.price.toFixed(2)}` : undefined,
        version: '1.0.0', // Would come from the product data in a real app
        author: 'TerraFusion',
        status: product.status,
        size: '1.2 MB', // Would come from the product data in a real app
        tags: ['visualization', 'analytics', 'mapping'],
        isInstalled: false,
      }));
    },
  });
  
  // Fetch installed plugins for the current user
  const { data: installedPlugins, isLoading: installedLoading } = useQuery({
    queryKey: ['/api/user/plugins'],
    select: (data: any) => {
      // Add UI-specific properties to the installed plugins
      return data.map((plugin: any) => ({
        id: plugin.pluginId,
        name: plugin.name || 'Unknown Plugin',
        version: plugin.version || '1.0.0',
        description: plugin.description || 'No description available',
        author: plugin.author || 'Unknown Author',
        status: plugin.status || 'active',
        size: plugin.size || '1.2 MB',
        tags: plugin.tags || ['plugin'],
        isInstalled: true,
      }));
    },
  });
  
  // Combine and filter plugins based on search query and filters
  const filteredPlugins = React.useMemo(() => {
    const plugins = activeTab === 'marketplace' 
      ? (marketplacePlugins || []) 
      : (installedPlugins || []);
    
    return plugins
      .filter((plugin: Plugin) => {
        const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = categoryFilter === 'all' || 
          (plugin.tags && plugin.tags.includes(categoryFilter));
        
        return matchesSearch && matchesCategory;
      })
      .sort((a: Plugin, b: Plugin) => {
        switch (sortOrder) {
          case 'name': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          case 'newest': return -1; // In a real app, would sort by creation date
          case 'oldest': return 1; // In a real app, would sort by creation date
          default: return 0;
        }
      });
  }, [marketplacePlugins, installedPlugins, searchQuery, categoryFilter, sortOrder, activeTab]);

  // Handle installation completion
  const handleInstallComplete = () => {
    // Refetch installed plugins after successful installation
    // queryClient.invalidateQueries({ queryKey: ['/api/user/plugins'] });
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Plugin Marketplace</h1>
        <p className="text-lg text-muted-foreground">
          Discover and install plugins to enhance your TerraFusion experience
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="installed">My Plugins</TabsTrigger>
        </TabsList>
        
        <div className="my-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plugins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="min-w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="visualization">Visualization</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="mapping">Mapping</SelectItem>
                  <SelectItem value="data">Data Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="min-w-[160px]">
                  <ArrowDownUp className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <TabsContent value="marketplace">
          {marketplaceLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading marketplace plugins...</p>
              </div>
            </div>
          ) : filteredPlugins.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No plugins found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlugins.map((plugin: Plugin) => (
                <PluginInstaller
                  key={plugin.id}
                  pluginId={plugin.id}
                  name={plugin.name}
                  version={plugin.version}
                  description={plugin.description}
                  author={plugin.author}
                  isInstalled={plugin.isInstalled}
                  size={plugin.size}
                  price={plugin.price}
                  tags={plugin.tags}
                  onInstallComplete={handleInstallComplete}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="installed">
          {installedLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading installed plugins...</p>
              </div>
            </div>
          ) : filteredPlugins.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No plugins installed</h3>
              <p className="text-muted-foreground">
                Visit the marketplace to discover and install plugins.
              </p>
              <Button 
                className="mt-4"
                onClick={() => setActiveTab('marketplace')}
              >
                Browse Marketplace
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlugins.map((plugin: Plugin) => (
                <Card key={plugin.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{plugin.name}</h3>
                      <p className="text-sm text-muted-foreground">{plugin.author} • v{plugin.version}</p>
                    </div>
                    <Badge variant={plugin.status === 'active' ? 'success' : 'outline'}>
                      {plugin.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <p className="mb-4">{plugin.description}</p>
                  
                  <div className="flex gap-2 flex-wrap mb-4">
                    {plugin.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-auto">
                    <Button variant="outline" className="flex-1">Configure</Button>
                    <Button 
                      variant={plugin.status === 'active' ? 'destructive' : 'default'}
                      className="flex-1"
                    >
                      {plugin.status === 'active' ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}