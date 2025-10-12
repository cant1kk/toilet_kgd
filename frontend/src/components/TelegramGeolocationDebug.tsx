import React, { useState, useEffect } from 'react';
import { telegramService } from '../services/telegram';

interface TelegramGeolocationDebugProps {
  onLocationFound: (lat: number, lon: number) => void;
}

export function TelegramGeolocationDebug({ onLocationFound }: TelegramGeolocationDebugProps) {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${info}`]);
  };

  const testGeolocation = async () => {
    setIsLoading(true);
    setDebugInfo([]);
    
    addDebugInfo('Начинаем тест геолокации...');
    
    // Проверяем окружение
    if (!telegramService.isTelegramApp()) {
      addDebugInfo('❌ Не в Telegram WebApp');
      setIsLoading(false);
      return;
    }
    
    addDebugInfo('✅ Telegram WebApp обнаружен');
    
    // Проверяем поддержку геолокации
    if (!telegramService.isGeolocationAvailable()) {
      addDebugInfo('❌ Геолокация не поддерживается');
      setIsLoading(false);
      return;
    }
    
    addDebugInfo('✅ Геолокация поддерживается');
    
    // Проверяем HTTPS
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      addDebugInfo('✅ HTTPS соединение');
    } else {
      addDebugInfo('⚠️ Небезопасное соединие (не HTTPS)');
    }
    
    // Пытаемся получить геолокацию
    addDebugInfo('📍 Запрашиваем геолокацию...');
    
    try {
      const position = await telegramService.requestGeolocation();
      addDebugInfo(`✅ Геолокация получена: ${position.coords.latitude}, ${position.coords.longitude}`);
      addDebugInfo(`📊 Точность: ${position.coords.accuracy}м`);
      
      onLocationFound(position.coords.latitude, position.coords.longitude);
      
      if (telegramService.isTelegramApp()) {
        telegramService.notificationOccurred('success');
      }
    } catch (error: any) {
      addDebugInfo(`❌ Ошибка геолокации: ${error.message}`);
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          addDebugInfo('🚫 Доступ запрещен пользователем');
          break;
        case error.POSITION_UNAVAILABLE:
          addDebugInfo('📍 Местоположение недоступно');
          break;
        case error.TIMEOUT:
          addDebugInfo('⏰ Время ожидания истекло');
          break;
      }
      
      if (telegramService.isTelegramApp()) {
        telegramService.notificationOccurred('error');
      }
    }
    
    setIsLoading(false);
  };

  const clearDebug = () => {
    setDebugInfo([]);
  };

  return (
    <div className="telegram-geolocation-debug p-4 bg-gray-100 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-3">🔍 Отладка геолокации Telegram</h3>
      
      <div className="flex gap-2 mb-3">
        <button
          onClick={testGeolocation}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '🔄 Тестирование...' : '🧪 Тестировать геолокацию'}
        </button>
        
        <button
          onClick={clearDebug}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          🗑️ Очистить
        </button>
      </div>
      
      {debugInfo.length > 0 && (
        <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-64 overflow-y-auto">
          {debugInfo.map((info, index) => (
            <div key={index}>{info}</div>
          ))}
        </div>
      )}
      
      <div className="mt-3 text-sm text-gray-600">
        <p><strong>Советы:</strong></p>
        <ul className="list-disc list-inside">
          <li>Убедитесь, что приложение открыто через Telegram</li>
          <li>Проверьте, что у вас включена геолокация в настройках телефона</li>
          <li>Разрешите доступ к геолокации для Telegram</li>
          <li>Убедитесь, что сайт работает по HTTPS</li>
        </ul>
      </div>
    </div>
  );
}