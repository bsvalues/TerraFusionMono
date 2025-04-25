import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Edit, Trash2, Plus, Pencil, Eye, RefreshCw, MapPin } from 'lucide-react';

// Define Comparable form schema based on our database schema
const comparableFormSchema = z.object({
  reportId: z.number(),
  compType: z.string().min(1, "Comparable type is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 characters"),
  proximityToSubject: z.string().optional(),
  salePrice: z.coerce.number().min(1, "Sale price is required"),
  pricePerSqFt: z.coerce.number().optional(),
  saleDate: z.string().min(1, "Sale date is required"),
  saleOrFinancingConcessions: z.string().optional(),
  locationRating: z.string().optional(),
  siteSize: z.coerce.number().optional(),
  siteUnit: z.string().default("sq ft"),
  view: z.string().optional(),
  design: z.string().optional(),
  quality: z.string().optional(),
  age: z.coerce.number().optional(),
  condition: z.string().optional(),
  aboveGradeRooms: z.coerce.number().optional(),
  bedrooms: z.coerce.number().min(0, "Bedrooms must be at least 0"),
  bathrooms: z.coerce.number().min(0, "Bathrooms must be at least 0"),
  grossLivingArea: z.coerce.number().min(100, "Gross living area must be at least 100 sq ft"),
  basement: z.string().optional(),
  basementFinished: z.string().optional(),
  functionalUtility: z.string().optional(),
  heatingCooling: z.string().optional(),
  garage: z.string().optional(),
  porchPatiosDeck: z.string().optional(),
});

// Define Adjustment form schema
const adjustmentFormSchema = z.object({
  reportId: z.number(),
  comparableId: z.number(),
  adjustmentType: z.string().min(1, "Adjustment type is required"),
  description: z.string().optional(),
  amount: z.coerce.number(),
});

// Types based on our schemas
type ComparableFormValues = z.infer<typeof comparableFormSchema>;
type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

type Comparable = ComparableFormValues & { id: number, adjustments?: Adjustment[] };
type Adjustment = AdjustmentFormValues & { id: number };
type Report = { id: number, propertyId: number, status: string, formType: string };
type Property = { 
  id: number, 
  address: string, 
  city: string, 
  state: string, 
  zipCode: string,
  propertyType: string,
  grossLivingArea: number,
  bedrooms: number,
  bathrooms: number
};

export default function CompsPage() {
  const [location, navigate] = useLocation();
  const [isComparableModalOpen, setIsComparableModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedComparableId, setSelectedComparableId] = useState<number | null>(null);
  const [selectedAdjustmentId, setSelectedAdjustmentId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock user ID (in a real app, this would come from auth context)
  const userId = 1;

  // Get report ID from URL if present
  const reportIdFromUrl = new URLSearchParams(location.split('?')[1]).get('reportId');
  
  useEffect(() => {
    if (reportIdFromUrl) {
      setSelectedReportId(Number(reportIdFromUrl));
    }
  }, [reportIdFromUrl]);

  // Form for adding/editing comparables
  const comparableForm = useForm<ComparableFormValues>({
    resolver: zodResolver(comparableFormSchema),
    defaultValues: {
      reportId: selectedReportId || 0,
      compType: 'sale',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      proximityToSubject: '',
      salePrice: 0,
      pricePerSqFt: 0,
      saleDate: new Date().toISOString().split('T')[0],
      siteSize: 0,
      siteUnit: 'sq ft',
      view: '',
      design: '',
      quality: '',
      age: 0,
      condition: '',
      aboveGradeRooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      grossLivingArea: 0,
      basement: '',
      heatingCooling: '',
      garage: '',
    }
  });

  // Form for adding/editing adjustments
  const adjustmentForm = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      reportId: selectedReportId || 0,
      comparableId: selectedComparableId || 0,
      adjustmentType: '',
      description: '',
      amount: 0,
    }
  });

  // Fetch reports for the user
  const reportsQuery = useQuery({
    queryKey: ['/api/reports'],
    queryFn: async () => {
      return apiRequest<Report[]>(`/api/reports?userId=${userId}`, {
        method: 'GET',
      });
    }
  });

  // Fetch selected report details
  const reportQuery = useQuery({
    queryKey: ['/api/reports', selectedReportId],
    enabled: !!selectedReportId,
    queryFn: async () => {
      return apiRequest<Report>(`/api/reports/${selectedReportId}`, {
        method: 'GET',
      });
    }
  });

  // Fetch property details for the report
  const propertyQuery = useQuery({
    queryKey: ['/api/properties', reportQuery.data?.propertyId],
    enabled: !!reportQuery.data?.propertyId,
    queryFn: async () => {
      return apiRequest<Property>(`/api/properties/${reportQuery.data?.propertyId}`, {
        method: 'GET',
      });
    }
  });

  // Fetch comparables for the selected report
  const comparablesQuery = useQuery({
    queryKey: ['/api/reports', selectedReportId, 'comparables'],
    enabled: !!selectedReportId,
    queryFn: async () => {
      return apiRequest<Comparable[]>(`/api/reports/${selectedReportId}/comparables`, {
        method: 'GET',
      });
    }
  });

  // Fetch single comparable for editing
  const comparableQuery = useQuery({
    queryKey: ['/api/comparables', selectedComparableId],
    enabled: !!selectedComparableId && isComparableModalOpen,
    queryFn: async () => {
      return apiRequest<Comparable>(`/api/comparables/${selectedComparableId}`, {
        method: 'GET',
      });
    }
  });

  // Fetch adjustments for a comparable
  const adjustmentsQuery = useQuery({
    queryKey: ['/api/comparables', selectedComparableId, 'adjustments'],
    enabled: !!selectedComparableId,
    queryFn: async () => {
      return apiRequest<Adjustment[]>(`/api/comparables/${selectedComparableId}/adjustments`, {
        method: 'GET',
      });
    }
  });

  // Fetch single adjustment for editing
  const adjustmentQuery = useQuery({
    queryKey: ['/api/adjustments', selectedAdjustmentId],
    enabled: !!selectedAdjustmentId && isAdjustmentModalOpen,
    queryFn: async () => {
      return apiRequest<Adjustment>(`/api/adjustments/${selectedAdjustmentId}`, {
        method: 'GET',
      });
    }
  });

  // Update forms when data is loaded
  useEffect(() => {
    if (comparableQuery.data) {
      comparableForm.reset(comparableQuery.data);
    }
  }, [comparableQuery.data]);

  useEffect(() => {
    if (adjustmentQuery.data) {
      adjustmentForm.reset(adjustmentQuery.data);
    }
  }, [adjustmentQuery.data]);

  // Create/update comparable mutation
  const comparableMutation = useMutation({
    mutationFn: async (data: ComparableFormValues) => {
      if (selectedComparableId) {
        return apiRequest<Comparable>(`/api/comparables/${selectedComparableId}`, {
          method: 'PUT',
          data,
        });
      } else {
        return apiRequest<Comparable>('/api/comparables', {
          method: 'POST',
          data,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports', selectedReportId, 'comparables'] });
      setIsComparableModalOpen(false);
      toast({
        title: selectedComparableId ? "Comparable updated" : "Comparable added",
        description: "Comparable property has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save comparable property. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Create/update adjustment mutation
  const adjustmentMutation = useMutation({
    mutationFn: async (data: AdjustmentFormValues) => {
      if (selectedAdjustmentId) {
        return apiRequest<Adjustment>(`/api/adjustments/${selectedAdjustmentId}`, {
          method: 'PUT',
          data,
        });
      } else {
        return apiRequest<Adjustment>('/api/adjustments', {
          method: 'POST',
          data,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comparables', selectedComparableId, 'adjustments'] });
      setIsAdjustmentModalOpen(false);
      toast({
        title: selectedAdjustmentId ? "Adjustment updated" : "Adjustment added",
        description: "Adjustment has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save adjustment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete comparable mutation
  const deleteComparableMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/comparables/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports', selectedReportId, 'comparables'] });
      toast({
        title: "Comparable deleted",
        description: "Comparable property has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete comparable property. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete adjustment mutation
  const deleteAdjustmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/adjustments/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comparables', selectedComparableId, 'adjustments'] });
      toast({
        title: "Adjustment deleted",
        description: "Adjustment has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete adjustment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Form submission handlers
  const onComparableSubmit = (data: ComparableFormValues) => {
    data.reportId = selectedReportId || 0;
    comparableMutation.mutate(data);
  };

  const onAdjustmentSubmit = (data: AdjustmentFormValues) => {
    data.reportId = selectedReportId || 0;
    data.comparableId = selectedComparableId || 0;
    adjustmentMutation.mutate(data);
  };

  // Handler for opening comparable modal
  const handleAddComparable = () => {
    setSelectedComparableId(null);
    comparableForm.reset({
      reportId: selectedReportId || 0,
      compType: 'sale',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      proximityToSubject: '',
      salePrice: 0,
      pricePerSqFt: 0,
      saleDate: new Date().toISOString().split('T')[0],
      siteSize: 0,
      siteUnit: 'sq ft',
      view: '',
      design: '',
      quality: '',
      age: 0,
      condition: '',
      aboveGradeRooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      grossLivingArea: 0,
      basement: '',
      heatingCooling: '',
      garage: '',
    });
    setIsComparableModalOpen(true);
  };

  // Handler for opening edit comparable modal
  const handleEditComparable = (id: number) => {
    setSelectedComparableId(id);
    setIsComparableModalOpen(true);
  };

  // Handler for opening adjustment modal
  const handleAddAdjustment = (comparableId: number) => {
    setSelectedComparableId(comparableId);
    setSelectedAdjustmentId(null);
    adjustmentForm.reset({
      reportId: selectedReportId || 0,
      comparableId: comparableId,
      adjustmentType: '',
      description: '',
      amount: 0,
    });
    setIsAdjustmentModalOpen(true);
  };

  // Handler for editing adjustment
  const handleEditAdjustment = (adjustmentId: number) => {
    setSelectedAdjustmentId(adjustmentId);
    setIsAdjustmentModalOpen(true);
  };

  // Handlers for deleting
  const handleDeleteComparable = (id: number) => {
    if (window.confirm('Are you sure you want to delete this comparable property?')) {
      deleteComparableMutation.mutate(id);
    }
  };

  const handleDeleteAdjustment = (id: number) => {
    if (window.confirm('Are you sure you want to delete this adjustment?')) {
      deleteAdjustmentMutation.mutate(id);
    }
  };

  // Dropdown options
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC', 'PR', 'VI'
  ];

  const compTypes = [
    'sale',
    'listing',
    'pending',
    'expired',
    'withdrawn'
  ];

  const locationRatings = [
    'N;Neutral',
    '+;Superior',
    '-;Inferior'
  ];

  const conditionTypes = [
    'C1;New construction',
    'C2;No deferred maintenance',
    'C3;Well maintained, limited wear',
    'C4;Minor deferred maintenance',
    'C5;Obvious deferred maintenance',
    'C6;Substantial damage/deterioration'
  ];

  const qualityTypes = [
    'Q1;Exceptional Quality',
    'Q2;Excellent Quality',
    'Q3;Good Quality',
    'Q4;Average Quality',
    'Q5;Fair Quality',
    'Q6;Poor Quality'
  ];

  const viewTypes = [
    'N;Neutral',
    'B;Beneficial',
    'A;Adverse'
  ];

  const utilityTypes = [
    'Good',
    'Average',
    'Fair',
    'Poor'
  ];

  const adjustmentTypes = [
    'Sales/Financing Concessions',
    'Date of Sale/Time',
    'Location',
    'Site/View',
    'Design/Appeal',
    'Quality of Construction',
    'Age/Condition',
    'Room Count',
    'Gross Living Area',
    'Basement',
    'Functional Utility',
    'Heating/Cooling',
    'Garage/Carport',
    'Porch/Patio/Deck',
    'Fireplace',
    'Pool',
    'Other'
  ];

  // Calculate sum of adjustments for a comparable
  const calculateTotalAdjustments = (comparableId: number): number => {
    if (!adjustmentsQuery.data) return 0;
    
    return adjustmentsQuery.data
      .filter(adj => adj.comparableId === comparableId)
      .reduce((sum, adj) => sum + adj.amount, 0);
  };

  // Calculate adjusted price for a comparable
  const calculateAdjustedPrice = (comparable: Comparable): number => {
    const totalAdjustment = calculateTotalAdjustments(comparable.id);
    return comparable.salePrice + totalAdjustment;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
  if (reportsQuery.isLoading) {
    return <div className="p-6">Loading reports...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Comparable Properties</h1>
          {propertyQuery.data && (
            <p className="text-muted-foreground">
              Subject Property: {propertyQuery.data.address}, {propertyQuery.data.city}, {propertyQuery.data.state} {propertyQuery.data.zipCode}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          {reportsQuery.data && reportsQuery.data.length > 0 && (
            <Select 
              value={selectedReportId?.toString() || ''} 
              onValueChange={(value) => {
                setSelectedReportId(Number(value));
                navigate(`/comps?reportId=${value}`);
              }}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a report" />
              </SelectTrigger>
              <SelectContent>
                {reportsQuery.data.map(report => (
                  <SelectItem key={report.id} value={report.id.toString()}>
                    Report #{report.id} ({report.formType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button 
            onClick={handleAddComparable}
            disabled={!selectedReportId}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Comparable
          </Button>
        </div>
      </div>

      {!selectedReportId && (
        <Alert>
          <AlertTitle>No report selected</AlertTitle>
          <AlertDescription>
            Please select an appraisal report to view and manage comparable properties.
          </AlertDescription>
        </Alert>
      )}

      {selectedReportId && comparablesQuery.isLoading && (
        <div>Loading comparable properties...</div>
      )}

      {selectedReportId && comparablesQuery.data && (
        <>
          {comparablesQuery.data.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No comparable properties have been added to this report yet.</p>
              <Button onClick={handleAddComparable}>Add Your First Comparable</Button>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Comparable Properties</CardTitle>
                <CardDescription>
                  {comparablesQuery.data.length} comparable properties for this appraisal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead>Sale Price</TableHead>
                      <TableHead>Size (sqft)</TableHead>
                      <TableHead>Beds/Baths</TableHead>
                      <TableHead>Sale Date</TableHead>
                      <TableHead>Adjustments</TableHead>
                      <TableHead>Final Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparablesQuery.data.map((comp) => (
                      <TableRow key={comp.id}>
                        <TableCell className="font-medium">
                          <div>
                            {comp.address}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {comp.city}, {comp.state} {comp.zipCode}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(comp.salePrice)}</TableCell>
                        <TableCell>{comp.grossLivingArea.toLocaleString()} sqft</TableCell>
                        <TableCell>{comp.bedrooms}/{comp.bathrooms}</TableCell>
                        <TableCell>{new Date(comp.saleDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex justify-between items-center">
                            <span className={calculateTotalAdjustments(comp.id) >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(calculateTotalAdjustments(comp.id))}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleAddAdjustment(comp.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(calculateAdjustedPrice(comp))}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditComparable(comp.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteComparable(comp.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* List of adjustments for the selected comparable */}
          {selectedComparableId && adjustmentsQuery.data && adjustmentsQuery.data.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Adjustments</CardTitle>
                <CardDescription>
                  Adjustments for Comparable #{selectedComparableId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adjustment Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustmentsQuery.data.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell>{adjustment.adjustmentType}</TableCell>
                        <TableCell>{adjustment.description || '-'}</TableCell>
                        <TableCell className={adjustment.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(adjustment.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditAdjustment(adjustment.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteAdjustment(adjustment.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Comparable modal */}
      <Dialog open={isComparableModalOpen} onOpenChange={setIsComparableModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedComparableId ? 'Edit Comparable Property' : 'Add Comparable Property'}
            </DialogTitle>
            <DialogDescription>
              {selectedComparableId 
                ? 'Update the details of this comparable property' 
                : 'Enter the details of a new comparable property for your appraisal'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...comparableForm}>
            <form onSubmit={comparableForm.handleSubmit(onComparableSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="property">Property Details</TabsTrigger>
                  <TabsTrigger value="additional">Additional Features</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={comparableForm.control}
                      name="compType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comparable Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {compTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="proximityToSubject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proximity to Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 0.5 miles SW" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={comparableForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={comparableForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {states.map(state => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="ZIP Code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={comparableForm.control}
                      name="salePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Price ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="saleDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="saleOrFinancingConcessions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale/Financing Concessions</FormLabel>
                          <FormControl>
                            <Input placeholder="Concessions" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="property" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={comparableForm.control}
                      name="locationRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Rating</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {locationRatings.map(rating => {
                                const [value, label] = rating.split(';');
                                return (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="siteSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Size</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="siteUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sq ft">Square Feet</SelectItem>
                              <SelectItem value="acres">Acres</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={comparableForm.control}
                      name="view"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>View</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select view" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {viewTypes.map(view => {
                                const [value, label] = view.split(';');
                                return (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="design"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Design/Style</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Colonial, Ranch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="quality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quality of Construction</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select quality" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {qualityTypes.map(quality => {
                                const [value, label] = quality.split(';');
                                return (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={comparableForm.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age (Years)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {conditionTypes.map(condition => {
                                const [value, label] = condition.split(';');
                                return (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="aboveGradeRooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Rooms</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={comparableForm.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrooms</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bathrooms</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.5" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="grossLivingArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gross Living Area (sq ft)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="additional" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={comparableForm.control}
                      name="basement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Basement</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Full, Partial, None" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="basementFinished"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Basement Finished Area</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 500 sq ft, 50%" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={comparableForm.control}
                      name="functionalUtility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Functional Utility</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select utility" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {utilityTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="heatingCooling"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heating/Cooling</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Central AC, Forced Air" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={comparableForm.control}
                      name="garage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Garage</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2-Car Attached" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={comparableForm.control}
                      name="porchPatiosDeck"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porch/Patio/Deck</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Covered Patio, Deck" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={comparableForm.control}
                    name="pricePerSqFt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Per Sq Ft ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be calculated automatically if left blank
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsComparableModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={comparableMutation.isPending}
                >
                  {comparableMutation.isPending 
                    ? "Saving..." 
                    : selectedComparableId ? "Update Comparable" : "Add Comparable"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Adjustment modal */}
      <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAdjustmentId ? 'Edit Adjustment' : 'Add Adjustment'}
            </DialogTitle>
            <DialogDescription>
              {selectedAdjustmentId 
                ? 'Update the details of this adjustment' 
                : 'Enter the details of a new adjustment for this comparable'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...adjustmentForm}>
            <form onSubmit={adjustmentForm.handleSubmit(onAdjustmentSubmit)} className="space-y-4">
              <FormField
                control={adjustmentForm.control}
                name="adjustmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {adjustmentTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={adjustmentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Adjustment for superior condition" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={adjustmentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.valueAsNumber;
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Use positive values for upward adjustments and negative values for downward adjustments
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAdjustmentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={adjustmentMutation.isPending}
                >
                  {adjustmentMutation.isPending 
                    ? "Saving..." 
                    : selectedAdjustmentId ? "Update Adjustment" : "Add Adjustment"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}