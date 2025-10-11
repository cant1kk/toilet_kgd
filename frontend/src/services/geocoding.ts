// Геокодинг через OpenStreetMap Nominatim API (бесплатный)
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

export interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    county?: string;
    state?: string;
  };
}

// Cache для геокодинга
const geocodeCache = new Map<string, GeocodingResult>();

// Simple debounce implementation
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  let timeoutId: NodeJS.Timeout;
  let lastResolve: ((value: ReturnType<T>) => void) | null = null;
  
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      lastResolve = resolve as any;
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          if (lastResolve) {
            lastResolve(result);
          }
        } catch (error) {
          if (lastResolve) {
            lastResolve(error as any);
          }
        }
      }, delay);
    });
  };
};

const geocodeAddressInternal = async (address: string): Promise<GeocodingResult | null> => {
  try {
    // Проверяем кэш
    if (geocodeCache.has(address)) {
      return geocodeCache.get(address)!;
    }

    // Добавляем "Калининград" для точности поиска
    const searchQuery = `${address}, Калининград, Россия`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут
    
    const response = await fetch(
      `${NOMINATIM_API}?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=ru`,
      {
        headers: {
          'User-Agent': 'ToiletFinder Kaliningrad App'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    
    if (data.length === 0) {
      return null;
    }

    const result = data[0] as GeocodingResult;
    // Сохраняем в кэш
    geocodeCache.set(address, result);
    return result;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Экспортируем debounced версию
export const geocodeAddress = debounce(geocodeAddressInternal, 500);

// Валидация формата адреса
export const validateAddress = (address: string): boolean => {
  // Базовая проверка - должен содержать улицу и номер дома
  const streetPatterns = [
    /^[а-яА-ЯёЁ\s]+\s+\d+/i,  // ул. Ленина 15
    /^[а-яА-ЯёЁ\s]+\s+[а-яА-ЯёЁ]+\s+\d+/i,  // Ленинский проспект 30
    /^[а-яА-ЯёЁ\s]+\s+д\.?\s*\d+/i,  // ул. Ленина д.15
  ];

  return streetPatterns.some(pattern => pattern.test(address.trim()));
};

// Форматирование адреса для отображения
export const formatAddress = (address: string): string => {
  return address.trim().replace(/\s+/g, ' ');
};