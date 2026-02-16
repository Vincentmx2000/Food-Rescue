import axios from 'axios';
import type { DashboardStats } from '../types';

// Create axios instance (for future real API integration)
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Helper to normalize data from MongoDB (_id to id)
const normalize = (data: any): any => {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(normalize);
    }
    if (typeof data === 'object') {
        const normalized = { ...data };
        if (normalized._id) {
            normalized.id = normalized._id.toString();
        }

        // Map backend fields to frontend expected fields
        if (normalized.address && !normalized.pickupLocation) {
            normalized.pickupLocation = normalized.address;
        }
        if (normalized.expiryTime && !normalized.expiryDate) {
            normalized.expiryDate = normalized.expiryTime;
        }
        if (normalized.donorId && typeof normalized.donorId === 'object' && normalized.donorId.name) {
            normalized.donorName = normalized.donorId.name;
        }
        if (normalized.assignedVolunteer) {
            normalized.volunteerId = typeof normalized.assignedVolunteer === 'object'
                ? (normalized.assignedVolunteer.id || normalized.assignedVolunteer._id)
                : normalized.assignedVolunteer;
        }

        if (normalized.claimedByNGO) {
            normalized.claimedBy = normalized.claimedByNGO.toString();
        }
        if (Array.isArray(normalized.images) && normalized.images.length > 0 && !normalized.imageUrl) {
            let img = normalized.images[0];
            if (img.startsWith('uploads/')) {
                const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
                img = `${baseUrl}/${img}`;
            }
            normalized.imageUrl = img;
        }

        // Status normalization removed to support new backend enums matches
        // if (normalized.status === 'AVAILABLE' || normalized.status === 'POSTED') {
        //     normalized.status = 'pending';
        // } else if (normalized.status === 'CLAIMED_BY_NGO') {
        //     normalized.status = 'claimed';
        // } else if (normalized.status === 'VOLUNTEER_ASSIGNED') {
        //     normalized.status = 'assigned';
        // } else if (normalized.status) {
        //     normalized.status = normalized.status.toUpperCase();
        // }

        // Handle distribution proof images - convert to full URLs if needed
        if (Array.isArray(normalized.distributionProofImages) && normalized.distributionProofImages.length > 0) {
            const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
            normalized.distributionProofImages = normalized.distributionProofImages.map((img: string) => {
                if (img.startsWith('uploads/') || img.startsWith('https://res.cloudinary.com/')) {
                    return img.startsWith('http') ? img : `${baseUrl}/${img}`;
                }
                return img;
            });
        }

        // Map User.isBlocked to User.status
        if (normalized.hasOwnProperty('isBlocked')) {
            normalized.status = normalized.isBlocked ? 'blocked' : 'active';
        }

        // Recursive normalization for populated fields
        if (normalized.donationId && typeof normalized.donationId === 'object' && normalized.donationId._id) {
            normalized.donationId = normalize(normalized.donationId);
        }
        if (normalized.ngoId && typeof normalized.ngoId === 'object' && normalized.ngoId._id) {
            normalized.ngoId = normalize(normalized.ngoId);
        }

        return normalized;
    }
    return data;
};


// API wrapper - switching to real API for auth as requested
export const api = {
    // Auth
    login: async (email: string, password: string) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const { user, accessToken } = response.data.data;
        return { user: normalize(user), accessToken };
    },
    register: async (userData: any) => {
        const response = await apiClient.post('/auth/register', userData);
        const { user, accessToken } = response.data.data;
        return { user: normalize(user), accessToken };
    },

    // Donations
    getDonations: async (filters?: any) => {
        let url = '/donations/available';

        if (filters?.isAdmin) {
            url = '/admin/donations';
        } else if (filters?.donorId) {
            url = '/donations/my-donations';
        } else if (filters?.claimedBy) {
            url = '/ngos/my-claims';
        } else if (filters?.volunteerId) {
            url = '/volunteers/tasks';
        }

        const response = await apiClient.get(url, { params: filters });
        const data = response.data.data;
        const donations = data.donations || data;
        return normalize(donations);
    },
    getDonationById: async (id: string) => {
        const response = await apiClient.get(`/donations/${id}`);
        return normalize(response.data.data);
    },
    createDonation: async (donationData: any) => {
        const formData = new FormData();
        Object.keys(donationData).forEach(key => {
            if (key === 'images' && Array.isArray(donationData[key])) {
                donationData[key].forEach((img: any) => formData.append('images', img));
            } else {
                formData.append(key, donationData[key]);
            }
        });
        const response = await apiClient.post('/donations', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return normalize(response.data.data);
    },
    deleteDonation: async (id: string) => {
        const response = await apiClient.delete(`/donations/${id}`);
        return response.data;
    },
    updateDonation: async (id: string, updates: any) => {
        const response = await apiClient.patch(`/donations/${id}`, updates);
        return normalize(response.data.data);
    },
    assignVolunteer: async (donationId: string, volunteerId: string, volunteerName?: string) => {
        const response = await apiClient.post('/ngos/assign-volunteer', { donationId, volunteerId, volunteerName });
        return response.data; // Return full response to access message
    },
    claimDonation: async (donationId: string, ngoId?: string, ngoName?: string) => {
        const response = await apiClient.post('/ngos/claim', { donationId, ngoId, ngoName });
        return normalize(response.data.data);
    },
    pickupDonation: async (donationId: string, taskId?: string) => {
        const response = await apiClient.patch('/volunteers/update-status', { donationId, taskId, status: 'PICKED_UP' });
        return normalize(response.data.data);
    },
    completeDonation: async (donationId: string, proofFiles?: any[], taskId?: string) => {
        // If it's an NGO uploading proof (Files), use the NGO endpoint
        if (proofFiles && proofFiles.length > 0 && proofFiles[0] instanceof File) {
            const formData = new FormData();
            formData.append('donationId', donationId);
            if (taskId) formData.append('taskId', taskId);
            proofFiles.forEach(file => formData.append('images', file));
            const response = await apiClient.post('/ngos/distribution-proof', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return normalize(response.data.data);
        }

        const response = await apiClient.patch('/volunteers/update-status', { donationId, taskId, status: 'DISTRIBUTED', proofImages: proofFiles });
        return normalize(response.data.data);
    },

    // Volunteer Tasks
    getAvailableTasks: async () => {
        const response = await apiClient.get('/volunteers/available-tasks');
        return normalize(response.data.data);
    },
    acceptTask: async (taskId: string, donationId?: string) => {
        const response = await apiClient.post('/volunteers/accept-task', { taskId, donationId });
        return normalize(response.data.data);
    },
    getAssignedTasks: async () => {
        const response = await apiClient.get('/volunteers/tasks');
        return normalize(response.data.data);
    },
    getRescueHistory: async () => {
        const response = await apiClient.get('/volunteers/history');
        return normalize(response.data.data);
    },

    // Users
    getUsers: async (role?: string) => {
        const url = role === 'volunteer' ? '/ngos/volunteers' : '/admin/users';
        const response = await apiClient.get(url, { params: { role } });
        const data = response.data.data;
        const users = data.users || data;
        return normalize(users);
    },
    updateUser: async (id: string, updates: any) => {
        const response = await apiClient.patch(`/admin/users/${id}`, updates);
        return normalize(response.data.data);
    },

    // Stats
    getStats: async (userId?: string, role?: string): Promise<DashboardStats> => {
        if (!userId || !role) return {};

        try {
            if (role === 'admin') {
                const response = await apiClient.get('/admin/stats');
                return response.data.data;
            }

            if (role === 'ngo') {
                const claimedDonations = await api.getDonations({ claimedBy: userId });
                const availableDonations = await api.getDonations();
                return {
                    pendingDonations: availableDonations.length,
                    activeDonations: claimedDonations.filter((d: any) => ['claimed', 'assigned', 'picked_up'].includes(d.status)).length,
                    totalDonations: claimedDonations.length,
                };
            }

            if (role === 'volunteer') {
                // Similar to NGO, fetch available tasks
                const available = await api.getDonations();
                return {
                    pendingDonations: available.filter((d: any) => d.status === 'pending').length,
                };
            }

            // Default fallback for Donor
            const myDonations = await api.getDonations({ donorId: userId });
            return {
                totalDonations: myDonations.length,
                activeDonations: myDonations.filter((d: any) => d.status !== 'distributed' && d.status !== 'cancelled').length,
                completedDonations: myDonations.filter((d: any) => d.status === 'distributed').length,
            };
        } catch (error) {
            console.error('Stats fetch failed', error);
            return {};
        }
    },
};



export default apiClient;

