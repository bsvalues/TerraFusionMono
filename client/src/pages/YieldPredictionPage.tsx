import React from 'react';
import YieldPredictionForm from '../components/crop-analysis/YieldPredictionForm';
import CropAnalysisNav from '../components/crop-analysis/CropAnalysisNav';

const YieldPredictionPage: React.FC = () => {
  return (
    <div className="py-6 px-4 space-y-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Crop Yield Prediction</h1>
          <p className="text-gray-500 mt-2">
            Use AI to predict potential crop yields based on current conditions and historical data
          </p>
        </div>
        
        <CropAnalysisNav />
        
        <YieldPredictionForm />
      </div>
    </div>
  );
};

export default YieldPredictionPage;