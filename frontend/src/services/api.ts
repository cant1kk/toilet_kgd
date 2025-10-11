import axios from 'axios';
import { Toilet, ToiletFormData, Admin, User } from '../types';
import { telegramService } from './telegram';

// Базовый URL API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Создаем экземпляр axios с настройками
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Если мы в Telegram, добавляем initData
    if (telegramService.isTelegramApp()) {
      const initData = window.Telegram?.WebApp?.initData;
      if (initData) {
        config.headers['X-Telegram-Init-Data'] = initData;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Перехватчик для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек, удаляем его
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Если в Telegram, можно показать сообщение и закрыть приложение
      if (telegramService.isTelegramApp()) {
        telegramService.showAlert('Сессия истекла. Пожалуйста, перезапустите приложение.');
      }
    }
    return Promise.reject(error);
  }
);

// Интерфейсы

// API функции
export const toiletAPI = {
  // Получение всех туалетов
  getAll: async (): Promise<Toilet[]> => {
    const response = await api.get('/toilets');
    return response.data;
  },

  // Получение утвержденных туалетов
  getApproved: async (): Promise<Toilet[]> => {
    const response = await api.get('/toilets/approved');
    return response.data;
  },

  // Добавление нового туалета
  add: async (toilet: Omit<Toilet, 'id' | 'approved' | 'created_at'>): Promise<Toilet> => {
    const response = await api.post('/toilets', toilet);
    return response.data;
  },

  // Обновление туалета
  update: async (id: number, toilet: Partial<Toilet>): Promise<Toilet> => {
    const response = await api.put(`/toilets/${id}`, toilet);
    return response.data;
  },

  // Удаление туалета
  delete: async (id: number): Promise<void> => {
    await api.delete(`/toilets/${id}`);
  },

  // Поиск близлежащих туалетов
  findNearby: async (lat: number, lon: number, radius: number = 5000): Promise<Toilet[]> => {
    const response = await api.get(`/toilets/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
    return response.data;
  },
};

// API аутентификации
export const authAPI = {
  // Вход администратора
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  // Регистрация администратора
  register: async (username: string, password: string) => {
    const response = await api.post('/auth/register', { username, password });
    return response.data;
  },

  // Telegram аутентификация
  telegramAuth: async () => {
    if (!telegramService.isTelegramApp()) {
      throw new Error('Not in Telegram WebApp');
    }

    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) {
      throw new Error('No init data available');
    }

    const response = await api.post('/telegram/auth', { initData });
    return response.data;
  },

  // Получение информации о текущем пользователе
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/telegram/me');
    return response.data;
  },
};

// API администратора
export const adminAPI = {
  // Получение статистики
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Получение всех туалетов (включая неутвержденные)
  getAllToilets: async (): Promise<Toilet[]> => {
    const response = await api.get('/admin/toilets');
    return response.data;
  },

  // Утверждение туалета
  approveToilet: async (id: number): Promise<Toilet> => {
    const response = await api.put(`/admin/toilets/${id}/approve`);
    return response.data;
  },

  // Отклонение туалета
  rejectToilet: async (id: number): Promise<void> => {
    await api.delete(`/admin/toilets/${id}`);
  },
};

export default api;