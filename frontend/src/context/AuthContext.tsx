import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthContextType, RegisterData } from '../types';
import { api } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            let parsedUser = JSON.parse(storedUser);
            // Ensure role is lowercase for frontend consistency
            if (parsedUser.role) {
                parsedUser.role = parsedUser.role.toLowerCase();
            }

            // Normalize even on mount to handle older session data
            if (parsedUser._id && !parsedUser.id) {
                parsedUser.id = parsedUser._id;
            }
            setUser(parsedUser);
        }
        setLoading(false);
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


    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        // Clear any other cached data
        sessionStorage.clear();
        // Force reload to clear all state
        window.location.href = '/';
    };

    const setAuthData = (data: { user: any; token: string }) => {
        const normalizedUser = { ...data.user, role: data.user.role.toLowerCase() };
        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        localStorage.setItem('authToken', data.token);
    };


    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                setAuthData,
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
