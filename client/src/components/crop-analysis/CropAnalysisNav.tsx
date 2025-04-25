import React from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Leaf, BarChart3, GanttChart } from 'lucide-react';

const CropAnalysisNav: React.FC = () => {
  const [location] = useLocation();
  
  return (
    <div className="mb-6">
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <Link href="/crop-analysis">
            <Button
              variant={location === '/crop-analysis' ? 'default' : 'ghost'}
              className={`w-full h-full p-4 rounded-none flex items-center justify-center gap-2 ${
                location === '/crop-analysis' ? 'bg-primary text-primary-foreground' : ''
              }`}
            >
              <Leaf className="h-4 w-4" />
              <span>Basic Analysis</span>
            </Button>
          </Link>
          
          <Link href="/advanced-crop-analysis">
            <Button
              variant={location === '/advanced-crop-analysis' ? 'default' : 'ghost'}
              className={`w-full h-full p-4 rounded-none flex items-center justify-center gap-2 ${
                location === '/advanced-crop-analysis' ? 'bg-primary text-primary-foreground' : ''
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Advanced Analysis</span>
            </Button>
          </Link>
          
          <Link href="/yield-prediction">
            <Button
              variant={location === '/yield-prediction' ? 'default' : 'ghost'}
              className={`w-full h-full p-4 rounded-none flex items-center justify-center gap-2 ${
                location === '/yield-prediction' ? 'bg-primary text-primary-foreground' : ''
              }`}
            >
              <GanttChart className="h-4 w-4" />
              <span>Yield Prediction</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CropAnalysisNav;