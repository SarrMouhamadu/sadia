import { useState, useEffect, useRef } from 'react';
import { Bell, ChevronDown, Settings, LogOut, Key, Check, Package, Wallet, Users, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';
import { dashboardService, type Notification } from '../../services/dashboard.service';
import { useAuthContext } from '../context/AuthContext';

import type { UserRole } from '../services/auth.service';

interface HeaderProps {
  userRole: UserRole;
  onNavigateToProfile?: () => void;
}

export function Header({ userRole, onNavigateToProfile }: HeaderProps) {
  const { user, logout } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const roleLabels: Record<UserRole, string> = {
    ADMIN: 'Administrateur',
    ASSISTANT: 'Assistant'
  };

  useEffect(() => {
    loadNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await dashboardService.getNotifications({ limit: 10 });
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dashboardService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'STOCK_ALERTE':
      case 'STOCK_RUPTURE':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'STOCK_MOUVEMENT':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'SALARY_CREATED':
      case 'SALARY_PAID':
        return <Wallet className="w-4 h-4 text-emerald-500" />;
      case 'WORKER_CREATED':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-gray-600">
          Bienvenue, <span className="font-semibold text-gray-900">{user?.prenom} {user?.nom}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-8 text-center text-gray-500">
                    Chargement...
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-emerald-50/50' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg ${!notif.is_read ? 'bg-white' : 'bg-gray-100'}`}>
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notif.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notif.created_at)}</p>
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune notification</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.prenom} {user?.nom}</p>
              <Badge variant="outline" className="mt-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                {roleLabels[userRole]}
              </Badge>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-700 font-semibold">
                {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <p className="font-medium text-gray-900">{user?.prenom} {user?.nom}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              <div className="p-2">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigateToProfile?.();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Modifier le mot de passe
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigateToProfile?.();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Mon profil
                </button>
              </div>

              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
