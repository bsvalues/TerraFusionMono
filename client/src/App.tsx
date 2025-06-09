// Simplified App.tsx for direct applications display
import { useState, useEffect } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import axios from "axios";

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Simple application card component
function AppCard({ app }: { app: any }) {
  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '16px',
      margin: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      maxWidth: '300px'
    }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 'bold' }}>{app.displayName}</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <span style={{ 
          background: app.status === 'active' ? '#4caf50' : '#ff9800',
          color: 'white',
          fontSize: '12px', 
          padding: '2px 8px',
          borderRadius: '12px'
        }}>
          {app.status}
        </span>
        <span style={{ fontSize: '12px', color: '#666' }}>v{app.version}</span>
      </div>
      <p style={{ fontSize: '14px', color: '#444', marginBottom: '16px' }}>{app.description}</p>
      <button style={{
        background: '#1a73e8',
        color: 'white',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '100%'
      }}>Open</button>
    </div>
  );
}

function DirectApplicationsView() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get('/api/applications')
      .then(response => {
        console.log('Applications data:', response.data);
        setApplications(response.data.applications || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications. ' + err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading applications...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', padding: '20px', border: '1px solid #f88', borderRadius: '4px' }}>{error}</div>;
  }

  if (!applications || applications.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>No applications found.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px' }}>TerraFusion Applications</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {applications.map(app => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DirectApplicationsView />
    </QueryClientProvider>
  );
}

export default App;
