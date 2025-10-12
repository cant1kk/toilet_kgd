import React, { useEffect, useState } from 'react';

export function EnvironmentCheck() {
  const [envInfo, setEnvInfo] = useState<string>('');

  useEffect(() => {
    const info = [];
    
    // Проверяем URL
    info.push(`📍 Current URL: ${window.location.href}`);
    info.push(`🌐 Protocol: ${window.location.protocol}`);
    info.push(`🏷️ Domain: ${window.location.hostname}`);
    
    // Проверяем Telegram WebApp
    if (window.Telegram?.WebApp) {
      info.push('✅ Telegram WebApp object found');
      info.push(`📱 WebApp version: ${window.Telegram.WebApp.version || 'unknown'}`);
      info.push(`🎨 Theme: ${window.Telegram.WebApp.colorScheme || 'unknown'}`);
      
      // Получаем данные пользователя
      if (window.Telegram.WebApp.initDataUnsafe.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        info.push(`👤 User: ${user.first_name} ${user.last_name || ''} (@${user.username || 'no-username'})`);
      } else {
        info.push('❌ No user data available');
      }
      
      // Проверяем initData
      if (window.Telegram.WebApp.initData) {
        info.push('🔑 initData available');
      } else {
        info.push('❌ No initData');
      }
      
    } else {
      info.push('❌ No Telegram WebApp object');
      info.push('🔍 Checking window.Telegram...');
      if (window.Telegram) {
        info.push('✅ window.Telegram exists but no WebApp');
      } else {
        info.push('❌ window.Telegram is undefined');
      }
    }
    
    // Проверяем пользовательский агент
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('telegram')) {
      info.push('📱 Telegram detected in User-Agent');
    } else {
      info.push('🌐 Regular browser detected');
    }
    
    // Проверяем iOS/Android
    if (ua.includes('iphone') || ua.includes('ipad')) {
      info.push('🍎 iOS device');
    } else if (ua.includes('android')) {
      info.push('🤖 Android device');
    } else {
      info.push('💻 Desktop');
    }
    
    setEnvInfo(info.join('\n'));
    
    // Если это Telegram, инициализируем
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      // Показываем alert для проверки
      setTimeout(() => {
        window.Telegram.WebApp.showAlert('Telegram WebApp initialized successfully!');
      }, 1000);
    }
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace',
      backgroundColor: '#000',
      color: '#0f0',
      minHeight: '100vh',
      fontSize: '12px',
      whiteSpace: 'pre-wrap'
    }}>
      <h1 style={{ color: '#0f0' }}>🔍 Environment Check</h1>
      <div style={{ 
        backgroundColor: '#111', 
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid #0f0',
        marginTop: '20px'
      }}>
        {envInfo}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => {
            if (window.Telegram?.WebApp) {
              window.Telegram.WebApp.showAlert('Telegram WebApp is working!');
            } else {
              alert('No Telegram WebApp available');
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0f0',
            color: '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        >
          🧪 Test Telegram Alert
        </button>
      </div>
    </div>
  );
}