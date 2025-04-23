import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, MapPin, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { ParcelCard } from './parcel-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export function ParcelList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Query to fetch all parcels
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/parcels'],
  });

  // Handle viewing a parcel on the map
  const handleViewParcel = (id: number) => {
    setLocation(`/map?parcel=${id}`);
  };

  // Handle editing a parcel
  const handleEditParcel = (id: number) => {
    setLocation(`/parcels/${id}/edit`);
  };

  // Handle deleting a parcel (after confirmation)
  const handleDeleteParcel = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this parcel? This action cannot be undone.')) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/parcels/${id}`);
      
      // Invalidate the parcels query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/parcels'] });
      
      toast({
        title: 'Parcel Deleted',
        description: 'The parcel has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete parcel',
        variant: 'destructive',
      });
    }
  };

  // Filter parcels based on search term and status filter
  const filteredParcels = () => {
    if (!data || !data.parcels) return [];

    return data.parcels.filter((parcel: any) => {
      // Filter by search term
      const matchesSearch = 
        searchTerm === '' || 
        parcel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (parcel.description && parcel.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by status
      const matchesStatus = statusFilter === 'all' || parcel.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  // Render loading skeletons
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Parcels</h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Parcel
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Parcels</h2>
          <Button onClick={() => setLocation('/parcels/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Parcel
          </Button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4 dark:bg-red-900/10 dark:border-red-900/30">
          <p className="text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : 'Failed to load parcels'}
          </p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/parcels'] })}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const parcels = filteredParcels();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Parcels</h2>
        <Button onClick={() => setLocation('/parcels/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Parcel
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search parcels..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {parcels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No parcels found</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by adding your first parcel'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button 
              className="mt-4"
              onClick={() => setLocation('/parcels/new')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Parcel
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {parcels.map((parcel: any) => (
            <ParcelCard
              key={parcel.id}
              parcelId={parcel.id}
              onView={handleViewParcel}
              onEdit={handleEditParcel}
              onDelete={handleDeleteParcel}
            />
          ))}
        </div>
      )}
    </div>
  );
}