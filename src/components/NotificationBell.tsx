'use client';

import { useState, useEffect, useRef } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  DONATION_CONFIRMED: 'Conferma donazione',
  REQUEST_APPROVED: 'Richiesta approvata',
  REQUEST_REJECTED: 'Richiesta rifiutata',
  OBJECT_AVAILABLE: 'Oggetto disponibile',
  OBJECT_RESERVED: 'Oggetto riservato',
  OBJECT_DELIVERED: 'Oggetto consegnato',
  OBJECT_WITHDRAWN: 'Oggetto ritirato',
  REPORT_RECEIVED: 'Segnalazione ricevuta',
  REPORT_RESOLVED: 'Segnalazione risolta',
  MESSAGE_FROM_OPERATOR: 'Messaggio dall\'ente',
  NEW_REQUEST: 'Nuova richiesta',
  NEW_REPORT: 'Nuova segnalazione',
  GOODS_REQUEST_CREATED: 'Richiesta beni creata',
  GOODS_REQUEST_APPROVED: 'Richiesta beni approvata',
  GOODS_REQUEST_REJECTED: 'Richiesta beni rifiutata',
  GOODS_REQUEST_FULFILLED: 'Richiesta beni soddisfatta',
  GOODS_OFFER_RECEIVED: 'Offerta ricevuta',
};

export default function NotificationBell({ apiPath, bellSize = 'md' }: { apiPath: string; bellSize?: 'sm' | 'md' }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(apiPath);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        const count = data.unreadCount || 0;
        setUnreadCount(count);
        // Update app badge on home screen
        if ('setAppBadge' in navigator) {
          if (count > 0) {
            navigator.setAppBadge(count);
          } else {
            navigator.clearAppBadge();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(apiPath, { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const openNotification = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await fetch(`${apiPath}/${notification.id}`, { method: 'PATCH' });
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      if ('clearAppBadge' in navigator && unreadCount <= 1) {
        navigator.clearAppBadge();
      }
    }
    setSelectedNotification(notification);
    setOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sizeClasses = bellSize === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = bellSize === 'sm' ? 'text-lg' : 'text-xl';

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className={`${sizeClasses} relative flex items-center justify-center rounded-full hover:bg-gray-100 transition`}
        >
          <span className={iconSize}>🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-900">Notifiche</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Segna tutte lette
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <span className="text-3xl block mb-2">🔔</span>
                  <p>Nessuna notifica</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => openNotification(notification)}
                    className={`block p-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                      )}
                      <div className={!notification.read ? 'ml-0' : 'ml-4'}>
                        <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            if (!selectedNotification.read) {
              fetch(`${apiPath}/${selectedNotification.id}`, { method: 'PATCH' });
              setNotifications(prev => prev.map(n => n.id === selectedNotification.id ? { ...n, read: true } : n));
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
            setSelectedNotification(null);
          }} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <button
              onClick={() => {
                if (!selectedNotification.read) {
                  fetch(`${apiPath}/${selectedNotification.id}`, { method: 'PATCH' });
                  setNotifications(prev => prev.map(n => n.id === selectedNotification.id ? { ...n, read: true } : n));
                  setUnreadCount(prev => Math.max(0, prev - 1));
                }
                setSelectedNotification(null);
              }}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>

            <div className="pr-8">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {TYPE_LABELS[selectedNotification.type] || selectedNotification.type}
              </p>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{selectedNotification.title}</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedNotification.message}</p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {formatDate(selectedNotification.createdAt)}
              </p>
              {selectedNotification.link && (
                <a
                  href={selectedNotification.link}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  onClick={() => {
                    if (!selectedNotification.read) {
                      fetch(`${apiPath}/${selectedNotification.id}`, { method: 'PATCH' });
                      setNotifications(prev => prev.map(n => n.id === selectedNotification.id ? { ...n, read: true } : n));
                      setUnreadCount(prev => Math.max(0, prev - 1));
                    }
                    setSelectedNotification(null);
                  }}
                >
                  Vai al contenuto →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}