import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import api from '../../../services/api';
import './AdminNotifications.css';

const AdminNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  const pageSize = 20;

  const totalLabel = useMemo(() => {
    const n = Number(unreadCount || 0);
    if (n <= 0) return 'Aucune notification non lue';
    if (n === 1) return '1 notification non lue';
    return `${n} notifications non lues`;
  }, [unreadCount]);

  const load = async (nextPage = page) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/notifications?read=false&limit=${pageSize}&page=${nextPage}`);
      const arr = Array.isArray(res?.data?.notifications)
        ? res.data.notifications
        : (Array.isArray(res?.data) ? res.data : []);
      const total = Number(res?.data?.unreadCount || 0);
      setItems(arr);
      setUnreadCount(total);
    } catch (e) {
      setError('Impossible de charger les notifications.');
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const markRead = async (id) => {
    if (!id) return;
    try {
      await api.put(`/api/notifications/${id}/read`);
      setItems((prev) => prev.filter((x) => x._id !== id));
      setUnreadCount((v) => Math.max(0, Number(v || 0) - 1));
    } catch (e) {
      // silent
    }
  };

  const markAllRead = async () => {
    if (markingAll) return;
    try {
      setMarkingAll(true);
      await api.put('/api/notifications/read-all');
      setItems([]);
      setUnreadCount(0);
    } catch (e) {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <AdminLayout title="Notifications">
      <div className="admin-notifications-page">
        <div className="admin-notifications-page__header">
          <div>
            <div className="admin-notifications-page__title">Notifications</div>
            <div className="admin-notifications-page__sub">{totalLabel}</div>
          </div>
          <div className="admin-notifications-page__actions">
            <button
              type="button"
              className="admin-notifications-page__btn admin-notifications-page__btn--secondary"
              onClick={() => load(page)}
              disabled={loading}
            >
              Actualiser
            </button>
            <button
              type="button"
              className="admin-notifications-page__btn admin-notifications-page__btn--primary"
              onClick={markAllRead}
              disabled={loading || markingAll || items.length === 0}
            >
              {markingAll ? 'Mise à jour…' : 'Tout marquer comme lu'}
            </button>
          </div>
        </div>

        {loading && <div className="admin-notifications-page__empty">Chargement…</div>}
        {!loading && error && <div className="admin-notifications-page__empty admin-notifications-page__empty--error">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="admin-notifications-page__empty">Aucune notification</div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="admin-notifications-page__list" role="list">
            {items.map((n) => (
              <div className="admin-notifications-page__item" key={n._id} role="listitem">
                <div className="admin-notifications-page__item-main">
                  <div className="admin-notifications-page__item-title">{n.title || 'Notification'}</div>
                  <div className="admin-notifications-page__item-msg">{n.message || '—'}</div>
                  <div className="admin-notifications-page__item-meta">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString('fr-FR') : ''}
                  </div>
                </div>
                <div className="admin-notifications-page__item-actions">
                  <button
                    type="button"
                    className="admin-notifications-page__btn admin-notifications-page__btn--secondary"
                    onClick={() => markRead(n._id)}
                  >
                    Marquer comme lu
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="admin-notifications-page__footer">
          <button
            type="button"
            className="admin-notifications-page__btn admin-notifications-page__btn--secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
          >
            Précédent
          </button>
          <div className="admin-notifications-page__page">Page {page}</div>
          <button
            type="button"
            className="admin-notifications-page__btn admin-notifications-page__btn--secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading || items.length < pageSize}
          >
            Suivant
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
