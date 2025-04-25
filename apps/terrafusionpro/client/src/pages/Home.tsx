import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";

// Simplified version - removed AppraisalContext dependency
export default function Home() {
  const [_, setLocation] = useLocation();
  
  console.log("Home component rendering");

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AppraisalCore - Real Estate Appraisal Platform</h1>
        
        <button 
          onClick={() => console.log("Native button clicked")} 
          style={{ 
            padding: '10px 20px', 
            background: 'blue', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginBottom: '20px'
          }}
        >
          Test Native Button (Click Me)
        </button>
        
        <a 
          href="/form" 
          style={{ 
            padding: '10px 20px', 
            background: 'green', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: '4px',
            marginBottom: '20px',
            display: 'inline-block'
          }}
        >
          Test Native Link to Form Page
        </a>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to AppraisalCore</CardTitle>
              <CardDescription>
                The comprehensive real estate appraisal platform for desktop and mobile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                You don't have any active appraisal reports. Create a new one to get started or load a demo report.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    console.log("Load Demo Report clicked");
                    setLocation('/form');
                  }}
                >
                  Load Demo Report
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log("Create New Report clicked");
                    setLocation('/form');
                  }}
                >
                  Create New Report
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Desktop Form-Filler</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Complete appraisal forms with embedded spreadsheet-style worksheets that auto-calculate adjustments and market values.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Mobile Inspection</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Capture property details, photos, and measurements with our mobile app - even without internet connection.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Reports & Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Generate professional PDF reports and MISMO XML exports while ensuring compliance with industry standards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
