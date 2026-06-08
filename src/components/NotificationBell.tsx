'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import NotificationDetailModal, { type NotificationDetail } from './NotificationDetailModal';

interface Notification extends NotificationDetail {
  // Identico a NotificationDetail, mantenuto per compatibilita' con il parent
}

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

  /**
   * Callback condiviso con NotificationDetailModal: aggiorna state parent
   * (notifications + unreadCount) quando il modal segna la notifica come
   * letta. useCallback per stabilita' referenziale.
   */
  const handleMarkedRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge();
    }
  }, []);

  const openNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setOpen(false);
  };

  const closeDetail = useCallback(() => {
    setSelectedNotification(null);
  }, []);

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
  const iconSize = bellSize === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Notifiche"
          className={`${sizeClasses} relative flex items-center justify-center rounded-full hover:bg-gray-100 transition`}
        >
          <Bell className={`${iconSize} text-gray-700`} />
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
                  type="button"
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
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" aria-hidden="true" />
                  <p>Nessuna notifica</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => openNotification(notification)}
                    className={`block w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${
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
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          apiPath={apiPath}
          onClose={closeDetail}
          onMarkedRead={handleMarkedRead}
        />
      )}
    </>
  );
}
