export interface User {
    id: string;
    email: string;
    name: string;
    role: 'donor' | 'ngo' | 'admin' | 'volunteer';
    organization?: string;
    phone?: string;
    address?: string;
    status: 'active' | 'blocked';
    createdAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    read: boolean;
    createdAt: string;
    donationId?: string;
}

export interface Donation {
    id: string;
    donorId: string;
    donorName: string;
    foodType: string;
    quantity: number;
    unit: string;
    expiryDate: string;
    pickupLocation: string;
    pickupTime: string;
    description: string;
    status: 'AVAILABLE' | 'CLAIMED_BY_NGO' | 'VOLUNTEER_ASSIGNED' | 'PICKED_UP' | 'DISTRIBUTED' | 'CANCELLED';
    claimedBy?: string;
    claimedByName?: string;
    volunteerId?: string;
    volunteerName?: string;
    claimedAt?: string;
    completedAt?: string;
    createdAt: string;
    imageUrl?: string;
    imageUrls?: string[];
    distributionProofImages?: string[];
}

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string, role: string) => Promise<void>;
    register: (userData: RegisterData) => Promise<void>;
    logout: () => void;
    setAuthData: (data: { user: any; token: string }) => void;
    isAuthenticated: boolean;
    loading: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    role: 'donor' | 'ngo' | 'admin' | 'volunteer';
    organization?: string;
    phone?: string;
    address?: string;
}

export interface DashboardStats {
    totalDonations?: number;
    activeDonations?: number;
    completedDonations?: number;
    totalDonors?: number;
    totalNGOs?: number;
    totalUsers?: number;
    claimedDonations?: number;
    pendingDonations?: number;
}

export interface VolunteerTask {
    id: string;
    donationId: Donation;
    ngoId: User;
    volunteerId?: string;
    status: 'OPEN' | 'ASSIGNED' | 'PICKED_UP' | 'DISTRIBUTED' | 'CANCELLED';
    assignedAt?: string;
    acceptedAt?: string;
    pickedUpAt?: string;
    completedAt?: string;
}
