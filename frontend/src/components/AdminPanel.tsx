import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { toiletAPI, adminAPI } from '../services/api';
import { Toilet } from '../types';
import { telegramService } from '../services/telegram';
import { useTelegramAuth } from '../hooks/useTelegramAuth';

interface AdminPanelProps {
  isTelegram: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isTelegram }) => {
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingToilet, setEditingToilet] = useState<Toilet | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { user, isAdmin } = useTelegramAuth();

  // Загрузка данных
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [toiletsData, statsData] = await Promise.all([
        adminAPI.getAllToilets(),
        adminAPI.getStats()
      ]);
      
      setToilets(toiletsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('Не удалось загрузить данные');
      
      if (isTelegram) {
        telegramService.showAlert('Ошибка загрузки данных');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // Утверждение туалета
  const handleApprove = async (id: number) => {
    try {
      setActionLoading(true);
      await adminAPI.approveToilet(id);
      
      setToilets(prev => 
        prev.map(t => t.id === id ? { ...t, approved: true } : t)
      );
      
      if (isTelegram) {
        telegramService.notificationOccurred('success');
      }
    } catch (err) {
      console.error('Error approving toilet:', err);
      
      if (isTelegram) {
        telegramService.showAlert('Не удалось утвердить точку');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Удаление туалета
  const handleDelete = async (id: number) => {
    const confirmMessage = 'Вы уверены, что хотите удалить эту точку?';
    
    const confirmed = isTelegram 
      ? await new Promise<boolean>((resolve) => {
          telegramService.showConfirm(confirmMessage, resolve);
        })
      : window.confirm(confirmMessage);
    
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await adminAPI.rejectToilet(id);
      
      setToilets(prev => prev.filter(t => t.id !== id));
      
      if (isTelegram) {
        telegramService.notificationOccurred('success');
      }
    } catch (err) {
      console.error('Error deleting toilet:', err);
      
      if (isTelegram) {
        telegramService.showAlert('Не удалось удалить точку');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Редактирование туалета
  const handleEdit = (toilet: Toilet) => {
    setEditingToilet(toilet);
    setShowEditModal(true);
  };

  // Сохранение изменений
  const handleSaveEdit = async () => {
    if (!editingToilet) return;

    try {
      setActionLoading(true);
      const updated = await toiletAPI.update(editingToilet.id!, editingToilet);
      
      setToilets(prev => 
        prev.map(t => t.id === editingToilet.id ? updated : t)
      );
      
      setShowEditModal(false);
      setEditingToilet(null);
      
      if (isTelegram) {
        telegramService.notificationOccurred('success');
      }
    } catch (err) {
      console.error('Error updating toilet:', err);
      
      if (isTelegram) {
        telegramService.showAlert('Не удалось обновить точку');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Проверка прав администратора
  if (!isAdmin) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">
          <h4>Доступ запрещен</h4>
          <p>У вас нет прав администратора для доступа к этой панели.</p>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">
          {error}
          <Button variant="outline-danger" className="ms-2" onClick={loadData}>
            Попробовать снова
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`container mt-4 ${isTelegram ? 'telegram-admin' : ''}`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Панель администратора</h2>
        <Button variant="primary" onClick={loadData} disabled={loading}>
          Обновить
        </Button>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-primary">{stats.total}</h3>
                <p className="mb-0">Всего точек</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3 mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-success">{stats.approved}</h3>
                <p className="mb-0">Утверждено</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3 mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-warning">{stats.pending}</h3>
                <p className="mb-0">На модерации</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3 mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-info">{stats.today}</h3>
                <p className="mb-0">Добавлено сегодня</p>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {/* Таблица туалетов */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Все точки ({toilets.length})</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Адрес</th>
                  <th>Тип</th>
                  <th>Статус</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {toilets.map((toilet) => (
                  <tr key={toilet.id}>
                    <td>{toilet.id}</td>
                    <td>{toilet.name}</td>
                    <td>{toilet.address}</td>
                    <td>
                      <Badge 
                        bg={
                          toilet.type === 'free' ? 'success' : 
                          toilet.type === 'paid' ? 'danger' : 'warning'
                        }
                      >
                        {toilet.type === 'free' ? 'Бесплатный' : 
                         toilet.type === 'paid' ? 'Платный' : 'За покупку'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={toilet.approved ? 'success' : 'warning'}>
                        {toilet.approved ? 'Утверждено' : 'На модерации'}
                      </Badge>
                    </td>
                    <td>
                      {new Date(toilet.created_at!).toLocaleDateString('ru-RU')}
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleEdit(toilet)}
                          disabled={actionLoading}
                        >
                          ✏️
                        </Button>
                        {!toilet.approved && (
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => handleApprove(toilet.id!)}
                            disabled={actionLoading}
                          >
                            ✅
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(toilet.id!)}
                          disabled={actionLoading}
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Модальное окно редактирования */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        size="lg"
        className={isTelegram ? 'telegram-modal' : ''}
      >
        <Modal.Header closeButton>
          <Modal.Title>Редактирование точки</Modal.Title>
        </Modal.Header>
        
        {editingToilet && (
          <Form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Название</Form.Label>
                <Form.Control
                  type="text"
                  value={editingToilet.name}
                  onChange={(e) => setEditingToilet({...editingToilet, name: e.target.value})}
                  disabled={actionLoading}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Адрес</Form.Label>
                <Form.Control
                  type="text"
                  value={editingToilet.address}
                  onChange={(e) => setEditingToilet({...editingToilet, address: e.target.value})}
                  disabled={actionLoading}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Тип</Form.Label>
                <Form.Select
                  value={editingToilet.type}
                  onChange={(e) => setEditingToilet({...editingToilet, type: e.target.value as Toilet['type']})}
                  disabled={actionLoading}
                >
                  <option value="free">Бесплатный</option>
                  <option value="paid">Платный</option>
                  <option value="purchase_required">Только для покупателей</option>
                </Form.Select>
              </Form.Group>

              {editingToilet.type === 'paid' && (
                <Form.Group className="mb-3">
                  <Form.Label>Цена</Form.Label>
                  <Form.Control
                    type="text"
                    value={editingToilet.price || ''}
                    onChange={(e) => setEditingToilet({...editingToilet, price: e.target.value})}
                    disabled={actionLoading}
                  />
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Описание</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editingToilet.description || ''}
                  onChange={(e) => setEditingToilet({...editingToilet, description: e.target.value})}
                  disabled={actionLoading}
                />
              </Form.Group>
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
                disabled={actionLoading}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={actionLoading}
              >
                {actionLoading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default AdminPanel;