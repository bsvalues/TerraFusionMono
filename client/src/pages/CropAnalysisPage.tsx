import React from 'react';
import CropAnalysisForm from '../components/crop-analysis/CropAnalysisForm';
import CropAnalysisNav from '../components/crop-analysis/CropAnalysisNav';

const CropAnalysisPage: React.FC = () => {
  return (
    <div className="py-6 px-4 space-y-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Crop Health Analysis</h1>
          <p className="text-gray-500 mt-2">
            Analyze your crop images with AI to detect health issues and get personalized recommendations
          </p>
        </div>
        
        <CropAnalysisNav />
        
        <CropAnalysisForm />
      </div>
    </div>
  );
};

export default CropAnalysisPage;