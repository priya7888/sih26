import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  Mail, 
  Radio, 
  Clock, 
  MapPin, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function NotificationBell({ onNavigate, onOpenIncident }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [channelStatus, setChannelStatus] = useState(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications and unread count
  const loadNotifications = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.getNotifications(filterUnread, 50, 0);
      setNotifications(data.items || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.warn('Error loading notifications:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Channel status and push support check
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const status = await api.getNotificationChannelStatus();
        setChannelStatus(status);
      } catch (e) {}
    };
    fetchChannels();

    if ('Notification' in window) {
      setPushSubscribed(Notification.permission === 'granted');
    }
  }, []);

  // Periodic polling & sync on window focus
  useEffect(() => {
    loadNotifications(false);
    const interval = setInterval(() => {
      loadNotifications(false);
    }, 20000);

    const onFocus = () => loadNotifications(false);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [filterUnread]);

  // Request browser push notification permission
  const handleEnablePush = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushSubscribed(true);
        // Register mock/demo push subscription token with backend
        await api.savePushSubscription({
          endpoint: `https://push.safetyai.org/subscriber/${user?.id || 'client'}-${Date.now()}`,
          p256dh_key: 'BCkQ08sD698...',
          auth_key: '9_F-83...'
        });
      }
    } catch (err) {
      console.warn('Push registration error:', err);
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  // Open incident
  const handleOpenIncident = async (notif) => {
    if (!notif.is_read) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    const reportId = notif.report_id || notif.incident_report_id || notif.metadata_payload?.report_id;
    if (onOpenIncident && reportId) {
      onOpenIncident(reportId, notif);
    } else if (onNavigate) {
      onNavigate(reportId ? `/reports?id=${reportId}` : '/reports');
    }
  };

  const getNotificationIcon = (type, severity) => {
    if (type === 'ADMIN_SIF_ALERT' || type === 'ADMIN_ALERT' || severity === 'CRITICAL') {
      return <Flame className="w-4 h-4 text-rose-600" />;
    }
    if (type === 'ADMIN_CRITICAL_ALERT' || severity === 'HIGH') {
      return <ShieldAlert className="w-4 h-4 text-amber-600" />;
    }
    if (type === 'DISPATCH_RESPONDER' || type === 'RESPONSE_DISPATCH') {
      return <Radio className="w-4 h-4 text-blue-600" />;
    }
    if (type === 'ESCALATION_ADMIN' || type === 'ESCALATION') {
      return <AlertTriangle className="w-4 h-4 text-purple-600" />;
    }
    return <Bell className="w-4 h-4 text-slate-500" />;
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'ADMIN_ALERT':
      case 'ADMIN_SIF_ALERT':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide bg-rose-100 text-rose-700 font-mono">🚨 SIF ALERT</span>;
      case 'ADMIN_CRITICAL_ALERT':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide bg-amber-100 text-amber-800 font-mono">⚠️ HIGH RISK</span>;
      case 'RESPONSE_DISPATCH':
      case 'DISPATCH_RESPONDER':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide bg-blue-100 text-blue-700 font-mono">⚡ DISPATCH</span>;
      case 'ESCALATION':
      case 'ESCALATION_ADMIN':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide bg-purple-100 text-purple-700 font-mono">🛡️ ESCALATION</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 font-mono">NOTICE</span>;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(prev => !prev);
          if (!isOpen) loadNotifications(true);
        }}
        aria-label="Safety Notifications"
        title="Safety Incident Notifications"
        className="relative p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs group focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <Bell className="w-4 h-4 group-hover:scale-105 transition-transform" />
        
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white font-black text-[10px] font-mono rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in-50">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping pointer-events-none" />
          </>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[390px] sm:w-[440px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-3.5 bg-slate-50/90 border-b border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 tracking-tight font-heading">
                    Safety Notifications
                  </h3>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {unreadCount > 0 ? `${unreadCount} unread incident alerts` : 'All incident alerts reviewed'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                    className="p-1 px-2 text-[10px] font-bold text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => loadNotifications(true)}
                  title="Refresh notifications"
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/60 text-[11px]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterUnread(false)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                    !filterUnread 
                      ? 'bg-slate-900 text-white shadow-2xs' 
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterUnread(true)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                    filterUnread 
                      ? 'bg-slate-900 text-white shadow-2xs' 
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Delivery Channels status pill */}
              <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  In-App
                </span>
                <span>•</span>
                <span className={channelStatus?.channels?.email?.configured ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  Email {channelStatus?.channels?.email?.configured ? '✓' : '—'}
                </span>
                <span>•</span>
                <span className={pushSubscribed ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  Push {pushSubscribed ? '✓' : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Web Push Prompt (if not granted) */}
          {'Notification' in window && !pushSubscribed && (
            <div className="p-2.5 px-3 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-blue-900 text-[11px] leading-tight">
                <Radio className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Enable desktop push alerts for instant SIF escalations</span>
              </div>
              <button
                type="button"
                onClick={handleEnablePush}
                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notification List Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/90 custom-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                Checking for incident dispatches...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                <ShieldAlert className="w-6 h-6 mx-auto text-slate-300" />
                <div className="font-bold text-slate-700 text-xs">All clear!</div>
                <div className="text-[11px]">No active safety incident notifications for your account.</div>
              </div>
            ) : (
              notifications.map((notif) => {
                const meta = notif.metadata_payload || {};
                const isCrit = notif.severity === 'CRITICAL' || notif.notification_type === 'ADMIN_SIF_ALERT';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleOpenIncident(notif)}
                    className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 relative group ${
                      !notif.is_read ? 'bg-blue-50/25' : 'bg-white'
                    }`}
                  >
                    {/* Unread indicator bar */}
                    {!notif.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                    )}

                    <div className="flex items-start gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCrit ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                      }`}>
                        {getNotificationIcon(notif.notification_type, notif.severity)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Tags line */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getTypeBadge(notif.notification_type)}
                            {meta.operating_unit && (
                              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                                {meta.operating_unit}
                              </span>
                            )}
                            {meta.risk_score !== undefined && (
                              <span className={`text-[9px] font-black font-mono px-1.5 py-0.2 rounded ${
                                meta.risk_score >= 70 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                Risk: {meta.risk_score}/100
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {formatTime(notif.created_at)}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {notif.title}
                        </h4>

                        {/* Message */}
                        <p className="text-[11px] text-slate-600 leading-snug line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>

                        {/* Bottom Actions & Channel Status */}
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/80 text-[10px]">
                          <div className="flex items-center gap-2 text-slate-400">
                            {meta.reporter_name && (
                              <span>By: <strong className="text-slate-600 font-medium">{meta.reporter_name}</strong></span>
                            )}
                            {notif.incident_report_id && (
                              <span className="font-mono text-slate-500 font-bold">#{notif.incident_report_id}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!notif.is_read && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkAsRead(notif.id, e)}
                                title="Mark read"
                                className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <span className="text-blue-600 font-bold text-[10px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                              <span>Open</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Role: <strong className="text-slate-700 font-semibold">{user?.role_name || user?.role || 'User'}</strong></span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onNavigate) onNavigate('/reports');
              }}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              View All Incident Records →
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
