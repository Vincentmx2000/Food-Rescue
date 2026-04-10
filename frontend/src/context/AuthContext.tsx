import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthContextType, RegisterData } from '../types';
import { api } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('authToken');

            if (storedUser && token) {
                try {
                    let parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser); // Immediate set for responsiveness

                    // Fetch fresh data from backend
                    const freshUser = await api.getUserProfile(parsedUser.id);
                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));
                } catch (error) {
                    console.error('Failed to restore session', error);
                    // If token expired, we might want to logout, but for now we fallback to storedUser
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (email: string, password: string, role: string) => {
        try {
            // Clear any previous user data first
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
            sessionStorage.clear();

            const data = await api.login(email, password);
            const { user: userData, accessToken } = data;

            // Verify role matches
            if (userData.role.toLowerCase() !== role.toLowerCase()) {
                throw new Error('Invalid role for this user');
            }

            // Normalize role for frontend
            const normalizedUser = { ...userData, role: userData.role.toLowerCase() };

            setUser(normalizedUser);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            localStorage.setItem('authToken', accessToken);
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData: RegisterData) => {
        try {
            const data = await api.register(userData);
            const { user: newUser, accessToken } = data;

            // Normalize role for frontend
            const normalizedUser = { ...newUser, role: newUser.role.toLowerCase() };

            setUser(normalizedUser);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            localStorage.setItem('authToken', accessToken);
        } catch (error) {
            throw error;
        }
    };


    const logout = (redirectPath: string = '/') => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        // Clear any other cached data
        sessionStorage.clear();
        // Force reload to clear all state and redirect
        window.location.href = redirectPath;
    };

    const setAuthData = (data: { user: any; token: string }) => {
        const normalizedUser = { ...data.user, role: data.user.role.toLowerCase() };
        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        localStorage.setItem('authToken', data.token);
    };

    const refreshUser = () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                setAuthData,
                refreshUser,
                isAuthenticated: !!user,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
