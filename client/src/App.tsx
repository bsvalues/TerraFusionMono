// Minimal App.tsx - Performance Optimized Version
import { useState, useEffect } from "react";

function SimpleApp() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading complete
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Simple loading indicator
  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        background: '#f5f5f5'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #e0e0e0',
          borderTopColor: '#3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <p style={{ marginTop: '20px', color: '#666' }}>Loading TerraFusion...</p>
      </div>
    );
  }

  // Simple dashboard content
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '10px 0',
        borderBottom: '1px solid #eaeaea'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>TerraFusion Platform</h1>
        <div>
          <button style={{
            background: '#3498db',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}>
            Dashboard
          </button>
        </div>
      </header>

      <main>
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#444', marginBottom: '15px' }}>Welcome to TerraFusion</h2>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Your integrated platform for property assessment, GIS, and AI-powered analytics.
            This is a lightweight version of the dashboard showing basic functionality.
          </p>
        </section>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Tool Cards */}
          {['AI Assistant', 'Property Valuation', 'GIS Explorer', 'Data Import'].map((tool) => (
            <div key={tool} style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 10px', color: '#333' }}>{tool}</h3>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Access the {tool.toLowerCase()} functionality.
              </p>
              <button style={{
                background: '#f5f5f5',
                border: '1px solid #ddd',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Open
              </button>
            </div>
          ))}
        </div>

        {/* Status Section */}
        <section style={{ 
          background: 'white', 
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px', color: '#333' }}>System Status</h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {[
              { name: 'Database', status: 'Online' },
              { name: 'AI Services', status: 'Online' },
              { name: 'GIS Services', status: 'Online' },
              { name: 'Analytics', status: 'Online' }
            ].map((service) => (
              <div key={service.name} style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: service.status === 'Online' ? '#4caf50' : '#f44336',
                  marginRight: '8px'
                }} />
                <span>{service.name}: {service.status}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default SimpleApp;
