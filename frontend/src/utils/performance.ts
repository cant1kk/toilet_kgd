import React from 'react';

// Утилиты для оптимизации производительности

// Дебаунс функция для оптимизации частых вызовов
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Троттл функция для ограничения частоты вызовов
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Ленивая загрузка изображений
export function lazyLoadImage(imgElement: HTMLImageElement, src: string) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        imgElement.src = src;
        observer.unobserve(imgElement);
      }
    });
  });
  
  observer.observe(imgElement);
}

// Оптимизация прокрутки
export function smoothScrollTo(element: HTMLElement, target: number, duration: number = 300) {
  const start = element.scrollTop;
  const change = target - start;
  const startTime = performance.now();
  
  function animateScroll(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    element.scrollTop = start + change * easeInOutQuad(progress);
    
    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  }
  
  function easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  
  requestAnimationFrame(animateScroll);
}

// Кэширование данных в localStorage с истечением срока
export function cacheWithExpiry(key: string, data: any, ttl: number = 300000) { // 5 минут по умолчанию
  const item = {
    data,
    expiry: Date.now() + ttl,
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
}

export function getCachedData(key: string): any | null {
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    const item = JSON.parse(itemStr);
    
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.data;
  } catch (error) {
    console.warn('Failed to get cached data:', error);
    return null;
  }
}

// Оптимизация рендеринга списков
export function virtualizeList<T>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactNode,
  containerHeight: number,
  itemHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEnd = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  
  return {
    visibleItems: visibleItems.map((item, index) => 
      renderItem(item, visibleStart + index)
    ),
    totalHeight: items.length * itemHeight,
    offsetY: visibleStart * itemHeight,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => 
      setScrollTop(e.currentTarget.scrollTop),
  };
}

// Предзагрузка критических ресурсов
export function preloadCriticalResources(resources: string[]) {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    
    if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
      link.as = 'image';
    }
    
    document.head.appendChild(link);
  });
}

// Оптимизация для мобильных устройств
export function optimizeForMobile() {
  // Предотвращение масштабирования при двойном тапе
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
  
  // Оптимизация viewport
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }
}

// Мониторинг производительности
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${end - start} milliseconds`);
  }
  
  return end - start;
}

// Оптимизация для Telegram WebApp
export function optimizeForTelegram() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    // Отключаем анимации при медленном соединении
    const connection = (navigator as any).connection;
    if (connection && (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      document.documentElement.style.setProperty('--reduce-motion', 'reduce');
    }
    
    // Оптимизация для маленьких экранов
    const isSmallScreen = window.innerWidth <= 360;
    if (isSmallScreen) {
      document.documentElement.classList.add('small-screen');
    }
  }
}

// Bundle size optimization
export function loadScriptAsync(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// Memory optimization
export function cleanup() {
  // Очистка неиспользуемых ресурсов
  if ('gc' in window) {
    (window as any).gc();
  }
  
  // Очистка event listeners
  const elements = document.querySelectorAll('*');
  elements.forEach(element => {
    const clone = element.cloneNode(true);
    element.parentNode?.replaceChild(clone, element);
  });
}