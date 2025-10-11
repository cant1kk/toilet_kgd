import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { geocodeAddress, validateAddress, formatAddress, GeocodingResult } from '../services/geocoding';
import { telegramService } from '../services/telegram';
import { Toilet } from '../types';

interface AddToiletModalProps {
  show: boolean;
  onHide: () => void;
  onAdd: (toilet: Omit<Toilet, 'id' | 'approved' | 'created_at'>) => void;
  initialPosition?: { lat: number; lng: number } | null;
  isTelegram: boolean;
}

const AddToiletModal: React.FC<AddToiletModalProps> = ({
  show,
  onHide,
  onAdd,
  initialPosition,
  isTelegram,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: initialPosition?.lat || 54.710,
    longitude: initialPosition?.lng || 20.510,
    type: 'free' as Toilet['type'],
    price: '',
    description: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  // Обновление координат при изменении initialPosition
  useEffect(() => {
    if (initialPosition) {
      setFormData(prev => ({
        ...prev,
        latitude: initialPosition.lat,
        longitude: initialPosition.lng,
      }));
      
      // Автоматически определяем адрес по кооратам
      handleReverseGeocoding(initialPosition.lat, initialPosition.lng);
    }
  }, [initialPosition]);

  // Обратное геокодирование - получение адреса по кооратам
  const handleReverseGeocoding = async (lat: number, lng: number) => {
    try {
      setAddressLoading(true);
      // Обратное геокодирование через Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`
      );
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }
      
      const data = await response.json();
      const address = data.display_name || '';
      if (address) {
        setFormData(prev => ({
          ...prev,
          address,
        }));
      }
    } catch (err) {
      console.warn('Failed to get address from coordinates:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  // Геокодирование - получение коорат по адресу
  const handleAddressChange = async (address: string) => {
    setFormData(prev => ({ ...prev, address }));
    
    if (address.length > 5) {
      try {
        setLoading(true);
        const result = await geocodeAddress(address);
        if (result) {
          setFormData(prev => ({
            ...prev,
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
          }));
        }
      } catch (err) {
        console.warn('Failed to geocode address:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Валидация
    if (!formData.name.trim()) {
      setError('Название обязательно для заполнения');
      if (isTelegram) {
        telegramService.impactOccurred('heavy');
      }
      return;
    }

    if (!formData.address.trim()) {
      setError('Адрес обязателен для заполнения');
      if (isTelegram) {
        telegramService.impactOccurred('heavy');
      }
      return;
    }

    // Для платных туалетов цена обязательна
    if (formData.type === 'paid' && !formData.price.trim()) {
      setError('Для платных туалетов необходимо указать цену');
      if (isTelegram) {
        telegramService.impactOccurred('heavy');
      }
      return;
    }

    try {
      setLoading(true);
      
      const toiletData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        type: formData.type,
        price: formData.type === 'paid' ? formData.price.trim() : undefined,
        description: formData.description.trim() || undefined,
      };

      await onAdd(toiletData);
      
      // Сброс формы
      setFormData({
        name: '',
        address: '',
        latitude: 54.710,
        longitude: 20.510,
        type: 'free',
        price: '',
        description: '',
      });

      if (isTelegram) {
        telegramService.notificationOccurred('success');
      }
    } catch (err) {
      console.error('Error submitting toilet:', err);
      setError('Не удалось добавить точку. Попробуйте позже.');
      
      if (isTelegram) {
        telegramService.impactOccurred('heavy');
      }
    } finally {
      setLoading(false);
    }
  };

  // Обработка изменения полей формы
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      className={isTelegram ? 'telegram-modal' : ''}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {isTelegram ? '➕ Добавить точку' : 'Добавить новую точку'}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Название *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Например: ТЦ Европа"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Адрес *</Form.Label>
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Например: ул. Киевская, 1, Калининград"
                value={formData.address}
                onChange={(e) => handleAddressChange(e.target.value)}
                disabled={loading || addressLoading}
                required
              />
              {addressLoading && (
                <div className="position-absolute end-0 top-50 translate-middle-y me-2">
                  <Spinner animation="border" size="sm" />
                </div>
              )}
            </div>
            <Form.Text className="text-muted">
              Коораты определяются автоматически
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Тип *</Form.Label>
            <Form.Select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              disabled={loading}
              required
            >
              <option value="free">Бесплатный</option>
              <option value="paid">Платный</option>
              <option value="purchase_required">Только для покупателей</option>
            </Form.Select>
          </Form.Group>

          {formData.type === 'paid' && (
            <Form.Group className="mb-3">
              <Form.Label>Цена *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Например: 50 рублей"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                disabled={loading}
                required
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Описание (необязательно)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Дополнительная информация: часы работы, особенности и т.д."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Координаты</Form.Label>
            <div className="row">
              <div className="col-6">
                <Form.Control
                  type="number"
                  step="any"
                  placeholder="Широта"
                  value={formData.latitude}
                  onChange={(e) => handleChange('latitude', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="col-6">
                <Form.Control
                  type="number"
                  step="any"
                  placeholder="Долгота"
                  value={formData.longitude}
                  onChange={(e) => handleChange('longitude', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <Form.Text className="text-muted">
              Определяются автоматически по адресу
            </Form.Text>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="secondary"
            onClick={onHide}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="d-flex align-items-center gap-2"
          >
            {loading && <Spinner animation="border" size="sm" />}
            {loading ? 'Добавление...' : 'Добавить точку'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddToiletModal;