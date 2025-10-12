import WebApp from '@twa-dev/sdk';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramInitData {
  query_id?: string;
  user?: TelegramUser;
  auth_date: number;
  hash: string;
}

class TelegramService {
  private isInitialized = false;
  private user: TelegramUser | null = null;
  private mainButtonCallback: (() => void) | null = null;
  private backButtonCallback: (() => void) | null = null;

  init() {
    if (typeof window !== 'undefined' && !this.isInitialized) {
      try {
        // Проверяем, что мы в Telegram WebApp
        if (!window.Telegram?.WebApp) {
          console.warn('Not in Telegram WebApp environment');
          return;
        }

        WebApp.ready();
        WebApp.expand();
        
        // Включаем подтверждение закрытия
        if (WebApp.enableClosingConfirmation) {
          WebApp.enableClosingConfirmation();
        }
        
        // Устанавливаем тему
        if (WebApp.colorScheme) {
          document.documentElement.setAttribute('data-theme', WebApp.colorScheme);
        }

        // Применяем цветовую схему Telegram
        this.applyTelegramTheme();

        // Получаем данные пользователя
        if (WebApp.initDataUnsafe.user) {
          this.user = WebApp.initDataUnsafe.user;
        }

        // Настройка кнопки "Назад"
        if (WebApp.BackButton && WebApp.BackButton.onClick) {
          WebApp.BackButton.onClick(() => {
            if (this.backButtonCallback) {
              this.backButtonCallback();
            } else {
              window.history.back();
            }
          });
        }

        // Настройка главной кнопки с улучшенной поддержкой
        if (WebApp.MainButton && WebApp.MainButton.setParams) {
          WebApp.MainButton.setParams({
            text: 'Продолжить',
            color: WebApp.themeParams?.button_color || '#007bff',
            text_color: WebApp.themeParams?.button_text_color || '#ffffff'
          });
          
          // Устанавливаем обработчик по умолчанию
          if (WebApp.MainButton.onClick) {
            WebApp.MainButton.onClick(() => {
              if (this.mainButtonCallback) {
                this.mainButtonCallback();
              } else {
                WebApp.MainButton.hide();
              }
            });
          }
        }
        
        // Проверяем поддержку геолокации в Telegram
        this.checkGeolocationSupport();

        // Адаптируем viewport для Telegram
        this.adaptViewport();

        this.isInitialized = true;
        console.log('Telegram WebApp initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Telegram WebApp:', error);
      }
    }
  }

  private checkGeolocationSupport() {
    // Проверяем, поддерживает ли Telegram WebApp геолокацию
    if (navigator.geolocation) {
      console.log('Geolocation is supported in this Telegram WebApp');
      
      // Проверяем HTTPS
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        console.log('Secure context detected - geolocation should work');
      } else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('Localhost detected - geolocation should work');
      } else {
        console.warn('Insecure context - geolocation may not work');
      }
    } else {
      console.warn('Geolocation is not supported in this Telegram WebApp');
    }
  }

  private applyTelegramTheme() {
    if (!this.isInitialized || !WebApp.themeParams) return;

    const themeParams = WebApp.themeParams;
    const root = document.documentElement;

    // Применяем цвета из Telegram
    if (themeParams.bg_color) {
      root.style.setProperty('--tg-bg-color', themeParams.bg_color);
      document.body.style.backgroundColor = themeParams.bg_color;
    }
    
    if (themeParams.text_color) {
      root.style.setProperty('--tg-text-color', themeParams.text_color);
      document.body.style.color = themeParams.text_color;
    }
    
    if (themeParams.hint_color) {
      root.style.setProperty('--tg-hint-color', themeParams.hint_color);
    }
    
    if (themeParams.button_color) {
      root.style.setProperty('--tg-button-color', themeParams.button_color);
    }
    
    if (themeParams.button_text_color) {
      root.style.setProperty('--tg-button-text-color', themeParams.button_text_color);
    }

    // Устанавливаем data-theme атрибут для CSS
    const colorScheme = WebApp.colorScheme || 'light';
    root.setAttribute('data-theme', colorScheme);
    
    if (colorScheme === 'dark') {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  }

  private adaptViewport() {
    if (!this.isInitialized) return;

    // Адаптация для мобильных устройств в Telegram
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.height = '100vh';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.bottom = '0';

    // Обрабатываем изменение viewport
    if (WebApp.onEvent) {
      WebApp.onEvent('viewportChanged', () => {
        const height = WebApp.viewportHeight;
        document.documentElement.style.setProperty('--tg-viewport-height', `${height}px`);
      });
    }
  }

  getUser(): TelegramUser | null {
    return this.user;
  }

  isTelegramApp(): boolean {
    return typeof window !== 'undefined' && window.Telegram?.WebApp !== undefined;
  }

  // Управление главной кнопкой
  showMainButton() {
    if (this.isInitialized && WebApp.MainButton && WebApp.MainButton.show) {
      WebApp.MainButton.show();
    }
  }

  hideMainButton() {
    if (this.isInitialized && WebApp.MainButton && WebApp.MainButton.hide) {
      WebApp.MainButton.hide();
    }
  }

  setMainButtonParams(params: { text?: string; color?: string; text_color?: string }) {
    if (this.isInitialized && WebApp.MainButton && WebApp.MainButton.setParams) {
      WebApp.MainButton.setParams(params);
    }
  }

  setMainButtonCallback(callback: () => void) {
    this.mainButtonCallback = callback;
  }

  clearMainButtonCallback() {
    this.mainButtonCallback = null;
  }

  // Управление кнопккой "Назад"
  showBackButton() {
    if (this.isInitialized && WebApp.BackButton && WebApp.BackButton.show) {
      WebApp.BackButton.show();
    }
  }

  hideBackButton() {
    if (this.isInitialized && WebApp.BackButton && WebApp.BackButton.hide) {
      WebApp.BackButton.hide();
    }
  }

  setBackButtonCallback(callback: () => void) {
    this.backButtonCallback = callback;
  }

  clearBackButtonCallback() {
    this.backButtonCallback = null;
  }

  // Всплывающие окна
  showAlert(message: string) {
    if (this.isInitialized && this.isTelegramApp() && WebApp.showAlert) {
      try {
        WebApp.showAlert(message);
      } catch (error) {
        console.warn('WebApp.showAlert not supported, fallback to alert:', error);
        alert(message);
      }
    } else {
      alert(message);
    }
  }

  showConfirm(message: string, callback?: (confirmed: boolean) => void) {
    if (this.isInitialized && this.isTelegramApp() && WebApp.showConfirm) {
      try {
        WebApp.showConfirm(message, callback);
      } catch (error) {
        console.warn('WebApp.showConfirm not supported, fallback to confirm:', error);
        const confirmed = window.confirm(message);
        if (callback) callback(confirmed);
      }
    } else {
      const confirmed = window.confirm(message);
      if (callback) callback(confirmed);
    }
  }

  // Открытие ссылок
  openLink(url: string) {
    if (this.isInitialized && WebApp.openLink) {
      WebApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  openTelegramLink(url: string) {
    if (this.isInitialized && WebApp.openTelegramLink) {
      WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  // Управление приложением
  close() {
    if (this.isInitialized && WebApp.close) {
      WebApp.close();
    }
  }

  ready() {
    if (this.isInitialized && WebApp.ready) {
      WebApp.ready();
    }
  }

  expand() {
    if (this.isInitialized && WebApp.expand) {
      WebApp.expand();
    }
  }

  // Тема и оформление
  getThemeParams() {
    if (this.isInitialized) {
      return WebApp.themeParams;
    }
    return {};
  }

  getColorScheme() {
    if (this.isInitialized) {
      return WebApp.colorScheme;
    }
    return 'light';
  }

  getViewportHeight() {
    if (this.isInitialized) {
      return WebApp.viewportHeight;
    }
    return window.innerHeight;
  }

  // Данные и события
  sendData(data: string) {
    if (this.isInitialized && WebApp.sendData) {
      WebApp.sendData(data);
    }
  }

  openInvoice(url: string, callback?: (status: string) => void) {
    if (this.isInitialized && WebApp.openInvoice) {
      WebApp.openInvoice(url, callback);
    }
  }

  setHeaderColor(color: `#${string}` | 'bg_color' | 'secondary_bg_color') {
    if (this.isInitialized && WebApp.setHeaderColor) {
      WebApp.setHeaderColor(color);
    }
  }

  setBackgroundColor(color: `#${string}` | 'bg_color' | 'secondary_bg_color') {
    if (this.isInitialized && WebApp.setBackgroundColor) {
      WebApp.setBackgroundColor(color);
    }
  }

  // Haptic feedback
  impactOccurred(style: 'light' | 'medium' | 'heavy' = 'medium') {
    if (this.isInitialized && this.isTelegramApp() && WebApp.HapticFeedback) {
      WebApp.HapticFeedback.impactOccurred(style);
    }
  }

  notificationOccurred(type: 'error' | 'success' | 'warning') {
    if (this.isInitialized && this.isTelegramApp() && WebApp.HapticFeedback) {
      WebApp.HapticFeedback.notificationOccurred(type);
    }
  }

  selectionChanged() {
    if (this.isInitialized && this.isTelegramApp() && WebApp.HapticFeedback) {
      WebApp.HapticFeedback.selectionChanged();
    }
  }

  // Получение initData для отправки на сервер
  getInitData(): string | null {
    if (this.isInitialized) {
      return WebApp.initData;
    }
    return null;
  }

  // Специальный метод для запроса геолокации в Telegram WebApp
  requestGeolocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Геолокация не поддерживается'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 600000
      };

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        options
      );
    });
  }

  // Проверка доступности геолокации
  isGeolocationAvailable(): boolean {
    return !!navigator.geolocation;
  }

  // Показать кнопку для запроса геолокации
  showGeolocationButton(callback: () => void) {
    if (this.isInitialized && WebApp.MainButton) {
      this.setMainButtonParams({
        text: '📍 Определить местоположение',
        color: '#007bff'
      });
      
      this.setMainButtonCallback(() => {
        callback();
        // Скрываем кнопку после использования
        setTimeout(() => {
          this.hideMainButton();
        }, 2000);
      });
      
      this.showMainButton();
    }
  }

  // Показать кнопку повторного запроса геолокации
  showRetryGeolocationButton(callback: () => void) {
    if (this.isInitialized && WebApp.MainButton) {
      this.setMainButtonParams({
        text: '🔄 Попробовать снова',
        color: '#dc3545'
      });
      
      this.setMainButtonCallback(() => {
        callback();
      });
      
      this.showMainButton();
    }
  }
}

export const telegramService = new TelegramService();