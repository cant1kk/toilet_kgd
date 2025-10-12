import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, X, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { telegramService } from '../services/telegram';

interface GeolocationHandlerProps {
  onLocationUpdate: (lat: number, lon: number) => void;
}

export function GeolocationHandler({ onLocationUpdate }: GeolocationHandlerProps) {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  const handleLocationUpdate = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    onLocationUpdate(latitude, longitude);
    
    if (telegramService.isTelegramApp()) {
      telegramService.notificationOccurred('success');
    }
  }, [onLocationUpdate]);

  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    console.warn('Geolocation error:', error);
    
    let message = 'Не удалось определить ваше местоположение';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Доступ к геолокации запрещен. Пожалуйста, разрешите доступ в настройках.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Информация о местоположении недоступна.';
        break;
      case error.TIMEOUT:
        message = 'Время ожидания геолокации истекло.';
        break;
    }
    
    setError(message);
    
    if (telegramService.isTelegramApp()) {
      telegramService.showAlert(message);
      telegramService.notificationOccurred('error');
    }
  }, []);

  const requestLocationWithTelegramButton = () => {
    if (telegramService.isTelegramApp()) {
      // Показываем инструкцию сначала
      telegramService.showAlert(
        'Для определения вашего местоположения нажмите на синюю кнопку внизу экрана. Это поможет нам показать ближайшие туалеты.'
      );
      
      // Используем новый метод для показа кнопки геолокации
      telegramService.showGeolocationButton(() => {
        console.log('Telegram main button clicked - requesting geolocation');
        requestLocation();
      });
    } else {
      requestLocation();
    }
  };

  const requestLocation = async () => {
    console.log('Starting geolocation request...');
    
    if (!telegramService.isGeolocationAvailable()) {
      const errorMsg = 'Ваш браузер не поддерживает геолокацию';
      setError(errorMsg);
      setShowPermissionPrompt(true);
      
      if (telegramService.isTelegramApp()) {
        telegramService.showAlert(errorMsg);
      }
      return;
    }

    setIsLoading(true);
    setError('');
    console.log('Geolocation is available, requesting position...');

    try {
      // Используем специальный метод для Telegram
      const position = await telegramService.requestGeolocation();
      console.log('Geolocation successful:', position);
      handleLocationUpdate(position);
      setIsLoading(false);
      setShowPermissionPrompt(false);
      
      // В Telegram скрываем главную кнопку после успеха
      if (telegramService.isTelegramApp()) {
        telegramService.hideMainButton();
      }
    } catch (error: any) {
      console.error('Geolocation failed:', error);
      handleLocationError(error);
      setIsLoading(false);
      
      // В Telegram показываем кнопку повторного запроса при ошибке
      if (telegramService.isTelegramApp()) {
        telegramService.showRetryGeolocationButton(() => {
          console.log('Retry button clicked - requesting geolocation again');
          requestLocation();
        });
      }
    }
  };

  useEffect(() => {
    // Проверяем поддержку геолокации
    if (!navigator.geolocation) {
      setError('Ваш браузер не поддерживает геолокацию');
      setShowPermissionPrompt(true);
      return;
    }

    // Для Telegram WebApp сразу показываем кнопку запроса
    if (telegramService.isTelegramApp()) {
      console.log('Telegram WebApp detected, showing geolocation button');
      setTimeout(() => {
        requestLocationWithTelegramButton();
        setHasBeenShown(true);
      }, 1000);
      return;
    }

    // Для обычного браузера проверяем разрешения
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          requestLocation();
        } else if (result.state === 'prompt' && !hasBeenShown) {
          setTimeout(() => {
            setShowPermissionPrompt(true);
            setHasBeenShown(true);
          }, 1500);
        }
      }).catch(() => {
        if (!hasBeenShown) {
          setTimeout(() => {
            requestLocation();
            setHasBeenShown(true);
          }, 1500);
        }
      });
    } else {
      if (!hasBeenShown) {
        setTimeout(() => {
          requestLocation();
          setHasBeenShown(true);
        }, 1500);
      }
    }
  }, [hasBeenShown, telegramService.isTelegramApp()]);

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && (userAgent.includes('mobile') || userAgent.includes('android'))) {
      return {
        title: 'Chrome на мобильном',
        steps: [
          'Нажмите на три точки ⋮ в правом верхнем углу',
          'Выберите "Настройки" → "Конфиденциальность и безопасность"',
          'Нажмите "Настройки сайтов" → "Местоположение"',
          'Включите "Доступ к местоположению"',
          'Обновите страницу и разрешите доступ'
        ]
      };
    } else if (userAgent.includes('chrome')) {
      return {
        title: 'Chrome на компьютере',
        steps: [
          'Нажмите на иконку замка или "i" слева от адресной строки',
          'В меню "Разрешения" найдите "Местоположение"',
          'Выберите "Разрешить"',
          'Обновите страницу'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        title: 'Firefox',
        steps: [
          'Нажмите на иконку замка слева от地址ной строки',
          'В разделе "Разрешения" найдите "Доступ к вашему местоположению"',
          'Измените на "Разрешить"',
          'Обновите страницу'
        ]
      };
    } else if (userAgent.includes('safari')) {
      return {
        title: 'Safari',
        steps: [
          'Нажмите на "aA" или иконку замка в адресной строке',
          'Найдите "Местоположение"',
          'Выберите "Разрешить"',
          'Обновите страницу'
        ]
      };
    } else if (userAgent.includes('edg')) {
      return {
        title: 'Edge',
        steps: [
          'Нажмите на иконку замка слева от адресной строки',
          'В меню "Разрешения" найдите "Местоположение"',
          'Выберите "Разрешить"',
          'Обновите страницу'
        ]
      };
    } else {
      return {
        title: 'Ваш браузер',
        steps: [
          'Найдите настройки разрешений в адресной строке',
          'Включите доступ к геолокации',
          'Обновите страницу'
        ]
      };
    }
  };

  const getMobileSystemInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) {
      return {
        title: 'Настройки Android',
        steps: [
          'Откройте "Настройки" → "Безопасность и конфидenциальность"',
          'Выберите "Местоположение" (или "Доступ к местоположению")',
          'Включите "Использовать местоположение"',
          'Найдите ваш браузер в списке приложений и разрешите доступ'
        ]
      };
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('mac')) {
      return {
        title: 'Настройки iOS',
        steps: [
          'Откройте "Настройки" → "Конфиденциальность и безопасность"',
          'Выберите "Службы геолокации"',
          'Включите "Службы геолокации"',
          'Найдите ваш браузер в списке приложений и выберите "При использовании"'
        ]
      };
    }
    return null;
  };

  const instructions = getBrowserInstructions();
  const mobileInstructions = getMobileSystemInstructions();

  if (!showPermissionPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--tg-bg-color,#ffffff)] rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-[var(--tg-hint-color,#999999)]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--tg-text-color,#000000)]">
                Включите геолокацию
              </h3>
              <p className="text-sm text-[var(--tg-hint-color,#666666)] mt-1">
                Чтобы мы могли показать ваше местоположение и ближайшие туалеты
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPermissionPrompt(false)}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {telegramService.isTelegramApp() ? (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                📱 Для Telegram:
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                Нажмите на синюю кнопкку внизу экрана "📍 Определить местоположение", чтобы предоставить доступ к вашему местоположению.
              </p>
              <Button
                onClick={requestLocationWithTelegramButton}
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? '📍 Обработка...' : '📍 Показать кнопку Telegram'}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => requestLocation()}
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? '📍 Запрос геолокации...' : '📍 Разрешить доступ к местоположению'}
            </Button>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Как включить геолокацию в {instructions.title}:
            </h4>
            <ol className="text-sm text-gray-700 space-y-1">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="font-medium text-blue-600">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {mobileInstructions && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                {mobileInstructions.title}:
              </h4>
              <ol className="text-sm text-gray-700 space-y-1">
                {mobileInstructions.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="font-medium text-orange-600">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>💡 Совет:</strong> Для лучшей точности включите GPS и убедитесь, что у вас есть подключение к интернету.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowPermissionPrompt(false)}
            className="w-full"
          >
            Продолжить без геолокации
          </Button>
        </div>
      </div>
    </div>
  );
}