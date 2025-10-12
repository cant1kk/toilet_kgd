import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toiletAPI } from '../services/api';
import { Toilet } from '../types';
import { telegramService } from '../services/telegram';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import TelegramGeolocationDebug from './TelegramGeolocationDebug';
import AddToiletModal from './AddToiletModal';
import Legend from './Legend';
import '../styles/map.css';

// Fix для иконок Leaflet в React
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPageProps {
  initialUserLocation?: { lat: number; lon: number } | null;
  isTelegram: boolean;
}

// Компонент для обработки событий карты
function MapEventHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const MapPage: React.FC<MapPageProps> = ({ initialUserLocation, isTelegram }) => {
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(initialUserLocation || null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useTelegramAuth();

  // Загрузка туалетов
  const loadToilets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await toiletAPI.getApproved();
      setToilets(data);
    } catch (err) {
      console.error('Error loading toilets:', err);
      setError('Не удалось загрузить данные о туалетах');
      
      if (isTelegram) {
        telegramService.showAlert('Не удалось загрузить данные. Попробуйте обновить страницу.');
      }
    } finally {
      setLoading(false);
    }
  }, [isTelegram]);

  useEffect(() => {
    loadToilets();
  }, [loadToilets]);

  // Получение геолокации пользователя
  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setUserLocation(location);
          
          // Поиск близлежащих туалетов
          findNearbyToilets(location.lat, location.lon);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          if (isTelegram) {
            telegramService.showAlert('Не удалось определить ваше местоположение');
          }
        }
      );
    }
  }, [userLocation, isTelegram]);

  //Поиск близлежащих туалетов
  const findNearbyToilets = async (lat: number, lon: number) => {
    try {
      const nearby = await toiletAPI.findNearby(lat, lon, 5000); // 5km radius
      if (nearby.length > 0) {
        setToilets(prev => {
          // Объединяем с существующими, удаляя дубликаты
          const existingIds = new Set(prev.map(t => t.id));
          const newToilets = nearby.filter(t => !existingIds.has(t.id));
          return [...prev, ...newToilets];
        });
        
        if (isTelegram) {
          telegramService.notificationOccurred('success');
        }
      }
    } catch (err) {
      console.error('Error finding nearby toilets:', err);
    }
  };

  // Обработка клика по карте
  const handleMapClick = (lat: number, lng: number) => {
    if (!user) {
      if (isTelegram) {
        telegramService.showAlert('Для добавления точек необходимо авторизоваться');
      } else {
        alert('Для добавления точек необходимо авторизоваться');
      }
      return;
    }

    setSelectedPosition({ lat, lng });
    setShowAddModal(true);
    
    if (isTelegram) {
      telegramService.impactOccurred('light');
    }
  };

  // Добавление нового туалета
  const handleAddToilet = async (toiletData: Omit<Toilet, 'id' | 'approved' | 'created_at'>) => {
    try {
      await toiletAPI.add(toiletData);
      setShowAddModal(false);
      setSelectedPosition(null);
      
      // Перезагружаем список
      await loadToilets();
      
      if (isTelegram) {
        telegramService.showAlert('Точка успешно добавлена и будет проверена модератором');
        telegramService.notificationOccurred('success');
      } else {
        alert('Точка successfully добавлена и будет проверена модератором');
      }
    } catch (err) {
      console.error('Error adding toilet:', err);
      
      if (isTelegram) {
        telegramService.showAlert('Не удалось добавить точку. Попробуйте позже.');
        telegramService.notificationOccurred('error');
      } else {
        alert('Не удалось добавить точку. Попробуйте позже.');
      }
    }
  };

  // Определение иконки маркера
  const getMarkerIcon = (type: Toilet['type']) => {
    const iconUrls = {
      free: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      paid: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      purchase_required: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    };

    return new Icon({
      iconUrl: iconUrls[type],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  };

  // Определение центра карты
  const getMapCenter = () => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lon] as [number, number];
    }
    // Центр Калининграда
    return [54.710, 20.510] as [number, number];
  };

  // Определение границ для показа всех маркеров
  const getMapBounds = () => {
    if (toilets.length === 0) return null;
    
    const bounds = new LatLngBounds([[toilets[0].latitude, toilets[0].longitude], [toilets[0].latitude, toilets[0].longitude]]);
    toilets.forEach(toilet => {
      bounds.extend([toilet.latitude, toilet.longitude]);
    });
    
    if (userLocation) {
      bounds.extend([userLocation.lat, userLocation.lon]);
    }
    
    return bounds;
  };

  if (loading) {
    return (
      <div className="map-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p>Загрузка карты...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-error">
        <div className="alert alert-danger">
          {error}
        </div>
        <button className="btn btn-primary" onClick={loadToilets}>
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className={`map-page ${isTelegram ? 'telegram-map' : ''}`}>
      {/* Отладочный компонент для Telegram */}
      {isTelegram && process.env.NODE_ENV === 'development' && (
        <TelegramGeolocationDebug onLocationFound={(lat: number, lon: number) => {
          setUserLocation({ lat, lon });
        }} />
      )}
      
      <MapContainer
        center={getMapCenter()}
        zoom={13}
        className="map-container"
        bounds={getMapBounds() || undefined}
        boundsOptions={{ padding: [50, 50] }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEventHandler onMapClick={handleMapClick} />

        {/* Маркер пользователя */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={new Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            })}
          >
            <Popup>
              <strong>Ваше местоположение</strong>
            </Popup>
          </Marker>
        )}

        {/* Маркеры туалетов */}
        {toilets.map((toilet) => (
          <Marker
            key={toilet.id}
            position={[toilet.latitude, toilet.longitude]}
            icon={getMarkerIcon(toilet.type)}
          >
            <Popup>
              <div className="toilet-popup">
                <h6>{toilet.name}</h6>
                <p className="mb-1">
                  <strong>Адрес:</strong> {toilet.address}
                </p>
                {toilet.price && (
                  <p className="mb-1">
                    <strong>Цена:</strong> {toilet.price}
                  </p>
                )}
                {toilet.description && (
                  <p className="mb-1">
                    <strong>Описание:</strong> {toilet.description}
                  </p>
                )}
                <p className="mb-0">
                  <span className={`badge bg-${toilet.type === 'free' ? 'success' : toilet.type === 'paid' ? 'danger' : 'warning'}`}>
                    {toilet.type === 'free' ? 'Бесплатный' : toilet.type === 'paid' ? 'Платный' : 'За покупку'}
                  </span>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Легенда */}
      <Legend isTelegram={isTelegram} />

      {/* Модальное окно добавления туалета */}
      <AddToiletModal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          setSelectedPosition(null);
        }}
        onAdd={handleAddToilet}
        initialPosition={selectedPosition}
        isTelegram={isTelegram}
      />

      {/* Отладочная информация для геолокации в Telegram */}
      {isTelegram && (
        <TelegramGeolocationDebug 
          onLocationFound={(lat: number, lon: number) => {
            setUserLocation({ lat, lon });
          }} 
        />
      )}
    </div>
  );
};

export default MapPage;