import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { telegramService } from '../services/telegram';

interface User {
  id: number;
  telegram_id?: number;
  username: string;
  isAdmin?: boolean;
}

export const useTelegramAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Проверяем, есть ли сохраненный токен
        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
          // Проверяем валидность токена
          try {
            const currentUser = await authAPI.getCurrentUser();
            setUser(currentUser);
            setLoading(false);
            return;
          } catch (err) {
            // Токен невалидный, удаляем его
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        }

        // Если мы в Telegram, пытаемся аутентифицироваться
        if (telegramService.isTelegramApp()) {
          const authData = await authAPI.telegramAuth();
          
          // Сохраняем токен и данные пользователя
          localStorage.setItem('authToken', authData.token);
          localStorage.setItem('user', JSON.stringify(authData.user));
          
          setUser(authData.user);
          
          // Показываем уведомление об успешной аутентификации
          telegramService.notificationOccurred('success');
        } else {
          // Вне Telegram просто устанавливаем загрузку в false
          console.log('Running outside Telegram WebApp - skipping authentication');
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        
        if (telegramService.isTelegramApp()) {
          telegramService.notificationOccurred('error');
          telegramService.showAlert('Ошибка аутентификации. Пожалуйста, попробуйте позже.');
        } else {
          console.error('Authentication error:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
    
    if (telegramService.isTelegramApp()) {
      telegramService.showAlert('Вы вышли из системы');
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    logout,
  };
};