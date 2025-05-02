import React from 'react';
import { Helmet } from 'react-helmet';
import ParcelMap from '../components/map/ParcelMap';

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
        
        <ParcelMap height="700px" />
      </div>
    </>
  );
}