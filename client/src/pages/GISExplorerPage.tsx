import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GISExplorerPage() {
  return (
    <>
      <Helmet>
        <title>GIS Explorer - TerraFusion</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">GIS Explorer</h1>
        <p className="mb-4 text-gray-700">
          Explore property boundaries and perform spatial analysis on the parcels.
          Select a parcel on the map and use the analysis tools to gain insights.
        </p>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>GIS Explorer</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Simplified version for testing - map display coming soon!</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}