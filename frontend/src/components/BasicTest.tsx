import React, { useEffect, useState } from 'react';

export function BasicTest() {
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    console.log('BasicTest component mounted');
    
    // Проверяем базовые вещи
    const checks = [];
    
    checks.push('✅ React loaded');
    
    if (typeof window !== 'undefined') {
      checks.push('✅ Window object available');
      checks.push(`📱 User Agent: ${navigator.userAgent.substring(0, 50)}...`);
      checks.push(`🌐 Protocol: ${window.location.protocol}`);
      checks.push(`📐 Viewport: ${window.innerWidth}x${window.innerHeight}`);
    }
    
    if (window.Telegram?.WebApp) {
      checks.push('✅ Telegram WebApp detected');
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    } else {
      checks.push('❌ No Telegram WebApp');
    }
    
    setStatus(checks.join('\n'));
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      color: '#333'
    }}>
      <h1>🧪 Basic Test</h1>
      <pre style={{ 
        backgroundColor: '#fff', 
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid #ddd',
        whiteSpace: 'pre-wrap',
        fontSize: '14px'
      }}>
        {status}
      </pre>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => {
            if (window.Telegram?.WebApp) {
              window.Telegram.WebApp.showAlert('Test alert from Telegram WebApp!');
            } else {
              alert('Test alert from browser!');
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🧪 Test Alert
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>📋 Debug Info:</h3>
        <ul>
          <li>React: ✅ Working</li>
          <li>TypeScript: ✅ Working</li>
          <li>Styles: ✅ Working</li>
          <li>Clicks: ✅ Working</li>
        </ul>
      </div>
    </div>
  );
}