import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Notification } from '../types';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../lib/db';

interface NotificationCenterProps {
  userId: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotes = async () => {
    if (userId) {
      const data = await getNotifications(userId);
      setNotifications(data);
    }
  };

  useEffect(() => {
    fetchNotes();
    // Simulate polling
    const interval = setInterval(fetchNotes, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(userId, id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-beatmap-dark animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-beatmap-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h3 className="font-bold text-sm">Notificações</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] text-beatmap-primary hover:text-white transition-colors flex items-center gap-1"
              >
                <Check size={12} /> Marcar todas como lidas
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="mx-auto mb-2 opacity-50" size={24} />
                <p className="text-xs">Nenhuma notificação por enquanto.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`p-4 hover:bg-white/5 transition-colors relative group ${notif.is_read ? 'opacity-60' : 'bg-white/[0.02]'}`}
                  >
                    <div className="flex gap-3">
                       {notif.image_url && (
                           <img src={notif.image_url} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                       )}
                       <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start mb-1">
                               <h4 className={`text-sm ${notif.is_read ? 'font-medium' : 'font-bold text-white'}`}>{notif.title}</h4>
                               <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                                   {new Date(notif.created_at).toLocaleDateString()}
                               </span>
                           </div>
                           <p className="text-xs text-gray-400 line-clamp-2">{notif.message}</p>
                       </div>
                    </div>
                    
                    {!notif.is_read && (
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleMarkRead(notif.id)}
                                className="p-1.5 bg-beatmap-primary/20 hover:bg-beatmap-primary text-beatmap-primary hover:text-white rounded-full transition-colors"
                                title="Marcar como lida"
                            >
                                <Check size={12} />
                            </button>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};