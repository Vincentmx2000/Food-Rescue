import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Notification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        // Load notifications from localStorage
        const stored = localStorage.getItem(`notifications_${user.id}`);
        if (stored) {
            setNotifications(JSON.parse(stored));
        }

        // Check for new notifications periodically (simulated backend events)
        const interval = setInterval(() => {
            const pendingNotifs = localStorage.getItem(`pending_notifications_${user.id}`);
            if (pendingNotifs) {
                const newNotifs = JSON.parse(pendingNotifs) as Notification[];
                setNotifications(prev => {
                    const updated = [...newNotifs, ...prev];
                    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
                    return updated;
                });
                localStorage.removeItem(`pending_notifications_${user.id}`);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [user]);

    const markAsRead = (id: string) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
            if (user) localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
            return updated;
        });
    };

    const addNotification = (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
        const newNotif: Notification = {
            ...notif,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            read: false,
        };
        setNotifications(prev => {
            const updated = [newNotif, ...prev];
            if (user) localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
            return updated;
        });
    };

    const clearAll = () => {
        setNotifications([]);
        if (user) localStorage.removeItem(`notifications_${user.id}`);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, addNotification, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
