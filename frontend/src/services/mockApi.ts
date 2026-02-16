import type { User, Donation } from '../types';

// Mock users database
const mockUsers: User[] = [
    {
        id: '1',
        email: 'donor@example.com',
        name: 'John Donor',
        role: 'donor',
        phone: '+1234567890',
        address: '123 Main St, City',
        status: 'active',
        createdAt: new Date().toISOString(),
    },
    {
        id: '2',
        email: 'ngo@example.com',
        name: 'Hope Foundation',
        role: 'ngo',
        organization: 'Hope Foundation',
        phone: '+1234567891',
        address: '456 Oak Ave, City',
        status: 'active',
        createdAt: new Date().toISOString(),
    },
    {
        id: '3',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
    },
    {
        id: '4',
        email: 'volunteer@example.com',
        name: 'Volunteer User',
        role: 'volunteer',
        phone: '+1234567892',
        address: '789 Pine Ln, City',
        status: 'active',
        createdAt: new Date().toISOString(),
    },
];

// Helper to get initial data
const getInitialDonations = (): Donation[] => {
    const stored = localStorage.getItem('food_rescue_donations');
    if (stored) {
        return JSON.parse(stored);
    }
    return [
        {
            id: '1',
            donorId: '1',
            donorName: 'John Donor',
            foodType: 'Fresh Vegetables',
            quantity: 50,
            unit: 'kg',
            expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            pickupLocation: '123 Main St, City',
            pickupTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            description: 'Fresh vegetables from our farm',
            status: 'pending',
            createdAt: new Date().toISOString(),
        },
        {
            id: '2',
            donorId: '1',
            donorName: 'John Donor',
            foodType: 'Cooked Meals',
            quantity: 100,
            unit: 'servings',
            expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            pickupLocation: '123 Main St, City',
            pickupTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
            description: 'Freshly cooked meals ready for distribution',
            status: 'claimed',
            claimedBy: '2',
            claimedByName: 'Hope Foundation',
            claimedAt: new Date().toISOString(),
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
    ];
};

// Mock donations database
let mockDonations: Donation[] = getInitialDonations();

// Helper to save donations
const saveDonations = () => {
    localStorage.setItem('food_rescue_donations', JSON.stringify(mockDonations));
};

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockApi = {
    // Authentication
    login: async (email: string, password: string): Promise<User> => {
        await delay(800);
        const user = mockUsers.find(u => u.email === email);
        if (!user || password !== 'password123') {
            throw new Error('Invalid credentials');
        }
        return user;
    },

    register: async (userData: any): Promise<User> => {
        await delay(800);
        const newUser: User = {
            id: String(mockUsers.length + 1),
            ...userData,
            createdAt: new Date().toISOString(),
        };
        mockUsers.push(newUser);
        return newUser;
    },

    // Donations
    getDonations: async (filters?: any): Promise<Donation[]> => {
        await delay(500);
        let filtered = [...mockDonations];

        if (filters?.status) {
            filtered = filtered.filter(d => d.status === filters.status);
        }
        if (filters?.donorId) {
            filtered = filtered.filter(d => d.donorId === filters.donorId);
        }
        if (filters?.claimedBy) {
            filtered = filtered.filter(d => d.claimedBy === filters.claimedBy);
        }
        if (filters?.volunteerId) {
            // Show tasks specifically assigned to this volunteer OR tasks that are 'claimed' but have NO volunteer assigned (broadcast)
            filtered = filtered.filter(d =>
                d.volunteerId === filters.volunteerId ||
                (d.status === 'claimed' && !d.volunteerId)
            );
        }

        return filtered.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    },

    getDonationById: async (id: string): Promise<Donation | null> => {
        await delay(300);
        return mockDonations.find(d => d.id === id) || null;
    },

    createDonation: async (donationData: any): Promise<Donation> => {
        await delay(800);
        const newDonation: Donation = {
            id: String(mockDonations.length + 1),
            ...donationData,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };
        mockDonations.push(newDonation);
        saveDonations();
        return newDonation;
    },

    updateDonation: async (id: string, updates: Partial<Donation>): Promise<Donation> => {
        await delay(500);
        const index = mockDonations.findIndex(d => d.id === id);
        if (index === -1) throw new Error('Donation not found');

        mockDonations[index] = { ...mockDonations[index], ...updates };
        saveDonations();
        return mockDonations[index];
    },

    assignVolunteer: async (donationId: string, volunteerId: string, volunteerName: string): Promise<Donation> => {
        await delay(500);
        const index = mockDonations.findIndex(d => d.id === donationId);
        if (index === -1) throw new Error('Donation not found');

        mockDonations[index] = {
            ...mockDonations[index],
            status: 'assigned',
            volunteerId,
            volunteerName,
        };

        // Notify specific volunteer
        const pendingKey = `pending_notifications_${volunteerId}`;
        const existing = JSON.parse(localStorage.getItem(pendingKey) || '[]');
        existing.push({
            id: Math.random().toString(36).substr(2, 9),
            userId: volunteerId,
            title: 'Task Assigned',
            message: `You have been assigned to pick up ${mockDonations[index].foodType}.`,
            type: 'success',
            read: false,
            donationId: donationId,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem(pendingKey, JSON.stringify(existing));

        saveDonations();
        return mockDonations[index];
    },

    claimDonation: async (donationId: string, ngoId: string, ngoName: string): Promise<Donation> => {
        await delay(500);
        const index = mockDonations.findIndex(d => d.id === donationId);
        if (index === -1) throw new Error('Donation not found');

        mockDonations[index] = {
            ...mockDonations[index],
            status: 'claimed',
            claimedBy: ngoId,
            claimedByName: ngoName,
            claimedAt: new Date().toISOString(),
        };

        // Notify Volunteers (Mock Broadcast)
        const volunteers = mockUsers.filter(u => u.role === 'volunteer');
        volunteers.forEach(v => {
            const pendingKey = `pending_notifications_${v.id}`;
            const existing = JSON.parse(localStorage.getItem(pendingKey) || '[]');
            existing.push({
                id: Math.random().toString(36).substr(2, 9),
                userId: v.id,
                title: 'New Rescue Task Available',
                message: `${ngoName} has claimed ${mockDonations[index].foodType}. A volunteer is needed for pickup!`,
                type: 'info',
                read: false,
                donationId: donationId,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem(pendingKey, JSON.stringify(existing));
        });

        saveDonations();
        return mockDonations[index];
    },

    pickupDonation: async (donationId: string): Promise<Donation> => {
        await delay(500);
        const index = mockDonations.findIndex(d => d.id === donationId);
        if (index === -1) throw new Error('Donation not found');

        mockDonations[index] = {
            ...mockDonations[index],
            status: 'picked_up',
        };
        saveDonations();
        return mockDonations[index];
    },

    completeDonation: async (donationId: string, proofImages?: string[]): Promise<Donation> => {
        await delay(500);
        const index = mockDonations.findIndex(d => d.id === donationId);
        if (index === -1) throw new Error('Donation not found');

        mockDonations[index] = {
            ...mockDonations[index],
            status: 'distributed',
            completedAt: new Date().toISOString(),
            distributionProofImages: proofImages,
        };
        saveDonations();
        return mockDonations[index];
    },

    // Users (Admin)
    getUsers: async (role?: string): Promise<User[]> => {
        await delay(500);
        if (role) {
            return mockUsers.filter(u => u.role === role);
        }
        return mockUsers;
    },

    updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
        await delay(500);
        const index = mockUsers.findIndex(u => u.id === id);
        if (index === -1) throw new Error('User not found');

        mockUsers[index] = { ...mockUsers[index], ...updates };
        return mockUsers[index];
    },

    // Statistics
    getStats: async (userId?: string, role?: string): Promise<any> => {
        await delay(400);

        if (role === 'donor' && userId) {
            const userDonations = mockDonations.filter(d => d.donorId === userId);
            return {
                totalDonations: userDonations.length,
                activeDonations: userDonations.filter(d => ['pending', 'claimed', 'assigned', 'picked_up'].includes(d.status)).length,
                completedDonations: userDonations.filter(d => d.status === 'distributed').length,
            };
        }

        if (role === 'ngo' && userId) {
            const claimedDonations = mockDonations.filter(d => d.claimedBy === userId);
            return {
                claimedDonations: claimedDonations.length,
                completedDonations: claimedDonations.filter(d => d.status === 'distributed').length,
                pendingDonations: mockDonations.filter(d => d.status === 'pending').length,
            };
        }

        if (role === 'admin') {
            return {
                totalDonations: mockDonations.length,
                totalDonors: mockUsers.filter(u => u.role === 'donor').length,
                totalNGOs: mockUsers.filter(u => u.role === 'ngo').length,
                activeDonations: mockDonations.filter(d => ['pending', 'claimed', 'assigned', 'picked_up'].includes(d.status)).length,
                completedDonations: mockDonations.filter(d => d.status === 'distributed').length,
            };
        }

        if (role === 'volunteer') {
            return {
                message: 'Welcome Volunteer! Stats coming soon.',
            };
        }

        return {};
    },
};
