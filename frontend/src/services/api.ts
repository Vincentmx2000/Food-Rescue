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

        if (normalized.role) {
            normalized.role = normalized.role.toLowerCase();
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
            if (typeof normalized.assignedVolunteer === 'object' && normalized.assignedVolunteer !== null) {
                normalized.volunteerId = normalized.assignedVolunteer.id || normalized.assignedVolunteer._id;
                normalized.volunteerName = normalized.assignedVolunteer.name;
            } else {
                normalized.volunteerId = normalized.assignedVolunteer.toString();
            }
        }

        if (normalized.claimedByNGO) {
            if (typeof normalized.claimedByNGO === 'object' && normalized.claimedByNGO !== null) {
                normalized.claimedBy = normalized.claimedByNGO.id || normalized.claimedByNGO._id;
                normalized.claimedByName = normalized.claimedByNGO.organization || normalized.claimedByNGO.name;
            } else {
                normalized.claimedBy = normalized.claimedByNGO.toString();
            }
        }
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
        if (Array.isArray(normalized.images)) {
            normalized.imageUrls = normalized.images.map((img: string) => {
                const normalizedPath = img.replace(/\\/g, '/');
                if (normalizedPath.startsWith('uploads/') || !normalizedPath.startsWith('http')) {
                    if (normalizedPath.startsWith('http')) return normalizedPath;
                    return `${baseUrl}/${normalizedPath}`;
                }
                return normalizedPath;
            });
            normalized.imageUrl = normalized.imageUrls[0] || null;
        } else {
            normalized.imageUrls = [];
            normalized.imageUrl = null;
        }

        // Handle distribution proof images - convert to full URLs if needed
        if (Array.isArray(normalized.distributionProofImages) && normalized.distributionProofImages.length > 0) {
            const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
            normalized.distributionProofImages = normalized.distributionProofImages.map((img: string) => {
                // Handle Windows backslashes
                const normalizedPath = img.replace(/\\/g, '/');
                if (normalizedPath.startsWith('uploads/') || !normalizedPath.startsWith('http')) {
                    if (normalizedPath.startsWith('http')) return normalizedPath;
                    return `${baseUrl}/${normalizedPath}`;
                }
                return normalizedPath;
            });
        }

        // Map User.isBlocked to User.status
        if ('isBlocked' in normalized) {
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
        let payload = updates;
        let headers: any = {};

        const formData = new FormData();
        let hasFiles = false;

        Object.keys(updates).forEach(key => {
            if (key === 'images' && Array.isArray(updates[key])) {
                updates[key].forEach((img: any) => {
                    if (img instanceof File) {
                        formData.append('images', img);
                        hasFiles = true;
                    }
                });
            } else if (key === 'existingImages' && Array.isArray(updates[key])) {
                if (updates[key].length === 0) {
                    formData.append('existingImages', ''); // Signal empty list
                } else {
                    updates[key].forEach((img: string) => formData.append('existingImages', img));
                }
                hasFiles = true; // Still use FormData if we have existingImages to send
            } else if (updates[key] !== undefined) {
                formData.append(key, updates[key]);
            }
        });

        if (hasFiles) {
            payload = formData;
            headers['Content-Type'] = 'multipart/form-data';
        }

        const response = await apiClient.patch(`/donations/${id}`, payload, { headers });
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
    completeDonation: async (donationId: string, proofFiles?: any[], taskId?: string, existingProofImages?: string[]) => {
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userRole = user?.role?.toLowerCase();

        const formData = new FormData();
        formData.append('donationId', donationId);
        if (taskId) formData.append('taskId', taskId);

        let hasData = false;

        // Handle new files
        if (proofFiles && proofFiles.length > 0) {
            proofFiles.forEach(file => {
                if (file instanceof File) {
                    formData.append('images', file);
                    hasData = true;
                }
            });
        }

        // Handle existing images to keep
        if (existingProofImages) {
            if (existingProofImages.length === 0) {
                formData.append('existingProofImages', ''); // Signal empty list
            } else {
                existingProofImages.forEach(img => formData.append('existingProofImages', img));
            }
            hasData = true;
        }

        if (hasData) {
            const endpoint = userRole === 'volunteer' ? '/volunteers/distribution-proof' : '/ngos/distribution-proof';
            const response = await apiClient.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return normalize(response.data.data);
        }

        const response = await apiClient.patch('/volunteers/update-status', { donationId, taskId, status: 'DISTRIBUTED' });
        return normalize(response.data.data);
    },

    uploadVolunteerDistributionProof: async (donationId: string, files: File[]) => {
        const formData = new FormData();
        formData.append('donationId', donationId);
        files.forEach(file => formData.append('images', file));

        const response = await apiClient.post('/volunteers/distribution-proof', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
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
        // The backend specifically uses toggle-block for status changes
        if (updates && 'status' in updates) {
            const response = await apiClient.patch(`/admin/users/${id}/toggle-block`);
            return normalize(response.data.data);
        }
        const response = await apiClient.patch(`/admin/users/${id}`, updates);
        return normalize(response.data.data);
    },
    toggleVerifyUser: async (id: string) => {
        const response = await apiClient.patch(`/admin/users/${id}/toggle-verify`);
        return normalize(response.data.data);
    },
    getUserProfile: async (id: string) => {
        const response = await apiClient.get(`/users/${id}`);
        return normalize(response.data.data);
    },
    updateUserProfile: async (updates: any) => {
        const response = await apiClient.patch('/users/profile', updates);
        return normalize(response.data.data);
    },
    updatePassword: async (passwords: { currentPassword: string; newPassword: string }) => {
        const response = await apiClient.patch('/users/update-password', passwords);
        return response.data;
    },

    // Stats
    getStats: async (userId?: string, role?: string): Promise<DashboardStats> => {
        try {
            if (role === 'admin') {
                const response = await apiClient.get('/admin/stats');
                return response.data.data;
            }

            if (!userId || !role) return {};

            const lowercaseRole = role.toLowerCase();

            if (lowercaseRole === 'ngo') {
                const claimedDonations = await api.getDonations({ claimedBy: userId });
                const availableDonations = await api.getDonations();
                return {
                    pendingDonations: availableDonations.length,
                    activeDonations: claimedDonations.filter((d: any) => ['CLAIMED_BY_NGO', 'VOLUNTEER_ASSIGNED', 'PICKED_UP'].includes(d.status)).length,
                    completedDonations: claimedDonations.filter((d: any) => d.status === 'DISTRIBUTED').length,
                    totalDonations: claimedDonations.length,
                };
            }

            if (lowercaseRole === 'volunteer') {
                const myTasks = await api.getRescueHistory(); // Historic tasks
                const activeTasks = await api.getAssignedTasks(); // Currently active
                const available = await api.getAvailableTasks();

                return {
                    pendingDonations: available.length,
                    activeDonations: activeTasks.length,
                    completedDonations: myTasks.filter((t: any) => t.status === 'DISTRIBUTED').length,
                    totalDonations: myTasks.length + activeTasks.length
                };
            }

            // Default fallback for Donor (lowercase role 'donor')
            const myDonations = await api.getDonations({ donorId: userId });
            const feedbackResponse = await api.getMyFeedback();
            return {
                totalDonations: myDonations.length,
                activeDonations: myDonations.filter((d: any) => !['DISTRIBUTED', 'CANCELLED'].includes(d.status)).length,
                completedDonations: myDonations.filter((d: any) => d.status === 'DISTRIBUTED').length,
                averageRating: feedbackResponse.stats.averageRating,
                totalFeedback: feedbackResponse.stats.totalFeedback
            };
        } catch (error) {
            console.error('Stats fetch failed', error);
            return {};
        }
    },

    // Feedback
    submitFeedback: async (feedbackData: { donationId: string; rating: number; comment: string }) => {
        const response = await apiClient.post('/feedback', feedbackData);
        return normalize(response.data.data);
    },
    getDonorFeedback: async (donorId: string) => {
        const response = await apiClient.get(`/feedback/donor/${donorId}`);
        return {
            feedback: normalize(response.data.data.feedback),
            stats: response.data.data.stats
        };
    },
    getMyFeedback: async () => {
        const response = await apiClient.get('/feedback/my-feedback');
        return {
            feedback: normalize(response.data.data.feedback),
            stats: response.data.data.stats
        };
    },

    // Notifications
    getNotifications: async () => {
        const response = await apiClient.get('/notifications');
        return normalize(response.data.data);
    },
    markNotificationAsRead: async (id: string) => {
        const response = await apiClient.patch(`/notifications/${id}/read`);
        return response.data;
    },
    markAllNotificationsAsRead: async () => {
        const response = await apiClient.patch('/notifications/read-all');
        return response.data;
    },
    clearNotifications: async () => {
        const response = await apiClient.delete('/notifications/clear');
        return response.data;
    },
};



export default apiClient;

