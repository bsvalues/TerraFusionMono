import React from 'react';
import AdvancedAnalysisForm from '../components/crop-analysis/AdvancedAnalysisForm';
import CropAnalysisNav from '../components/crop-analysis/CropAnalysisNav';

const AdvancedCropAnalysisPage: React.FC = () => {
  return (
    <div className="py-6 px-4 space-y-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Advanced Crop Analysis</h1>
          <p className="text-gray-500 mt-2">
            Perform comprehensive multi-image analysis with environmental context for detailed insights
          </p>
        </div>
        
        <CropAnalysisNav />
        
        <AdvancedAnalysisForm />
      </div>
    </div>
  );
};

export default AdvancedCropAnalysisPage;