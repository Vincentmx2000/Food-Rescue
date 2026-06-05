import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { api } from '../services/api.js';

const NotificationContext = createContext(undefined);

export const NotificationProvider = ({ children }) => {

    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const data = await api.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        fetchNotifications();

        // Check for new notifications periodically
        const interval = setInterval(fetchNotifications, 10000); // 10s polling

        return () => clearInterval(interval);
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await api.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const addNotification = (notif) => {
        const newNotif = {
            ...notif,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            read: false,
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    const clearAll = async () => {
        try {
            await api.clearNotifications();
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
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
