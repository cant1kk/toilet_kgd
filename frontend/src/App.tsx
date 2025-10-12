import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './App.css';
import './styles/mobile.css';

import MapPage from './components/MapPage';
import AdminPanel from './components/AdminPanel';
import Navigation from './components/Navigation';
import { GeolocationHandler } from './components/GeolocationHandler';
import { SimpleMapTest } from './components/SimpleMapTest';
import { BasicTest } from './components/BasicTest';
import { telegramService } from './services/telegram';

// Объявление типов для Telegram WebApp API
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

function AppContent() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Инициализация Telegram WebApp
    const initializeTelegram = async () => {
      if (telegramService.isTelegramApp()) {
        telegramService.init();
        setIsTelegram(true);
        
        // Получаем данные пользователя Telegram
        const telegramUser = await telegramService.getUser();
        if (telegramUser) {
          console.log('Telegram user:', telegramUser);
        }
        
        // Управление кнопкой "Назад"
        telegramService.setBackButtonCallback(() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            telegramService.close();
          }
        });

        // Показываем/скрываем кнопку "Назад"
        if (location.pathname !== '/') {
          telegramService.showBackButton();
        } else {
          telegramService.hideBackButton();
        }
      }
      setIsInitialized(true);
    };

    initializeTelegram();
  }, []);

  useEffect(() => {
    if (isInitialized && isTelegram) {
      // Обновляем состояние кнопки "Назад" при изменении маршрута
      if (location.pathname !== '/') {
        telegramService.showBackButton();
      } else {
        telegramService.hideBackButton();
      }
    }
  }, [location.pathname, isInitialized, isTelegram]);

  const handleLocationUpdate = (lat: number, lon: number) => {
    setUserLocation({ lat, lon });
  };

  if (!isInitialized) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`App ${isTelegram ? 'telegram-app' : ''}`}>
      <GeolocationHandler onLocationUpdate={handleLocationUpdate} />
      {!isTelegram && <Navigation />}
      <Routes>
        <Route 
          path="/" 
          element={<BasicTest />} 
        />
        <Route 
          path="/admin" 
          element={<AdminPanel isTelegram={isTelegram} />} 
        />
      </Routes>
    </div>
  );
}

// Определяем компонент роутера в зависимости от среды
const AppWrapper = () => {
  const isTelegram = typeof window !== 'undefined' && window.Telegram?.WebApp !== undefined;
  
  if (isTelegram) {
    // Для Telegram используем HashRouter
    const { HashRouter } = require('react-router-dom');
    return (
      <HashRouter>
        <AppContent />
      </HashRouter>
    );
  } else {
    // Для обычного браузера используем BrowserRouter
    const { BrowserRouter } = require('react-router-dom');
    return (
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    );
  }
};

function App() {
  return <AppWrapper />;
}

export default App;
