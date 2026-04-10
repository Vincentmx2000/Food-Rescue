export interface User {
    id: string;
    email: string;
    name: string;
    role: 'donor' | 'ngo' | 'admin' | 'volunteer';
    phone?: string;
    altPhone?: string;
    address?: string;
    city?: string;
    state?: string;
    landmark?: string;
    organization?: string;
    preferredTime?: string;
    ngoType?: string;
    establishedYear?: string;
    serviceArea?: string;
    activeWorkers?: string;
    availableDays?: string[];
    transportMode?: string;
    status: 'active' | 'blocked';
    isVerified?: boolean;
    createdAt: string;
}

export interface Notification {
    id: string;
    recipient: string;
    sender?: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    read: boolean;
    createdAt: string;
}

export interface Donation {
    id: string;
    donorId: string;
    donorName: string;
    foodCategory: 'Veg' | 'Non-Veg';
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
    volunteerAssignedAt?: string;
    pickedUpAt?: string;
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
    logout: (redirectPath?: string) => void;
    setAuthData: (data: { user: any; token: string }) => void;
    refreshUser: () => void;
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
    averageRating?: number;
    totalFeedback?: number;
}

export interface Feedback {
    id: string;
    donorId: string;
    ngoId: {
        id: string;
        name: string;
        organization: string;
    };
    donationId: string;
    rating: number;
    comment: string;
    createdAt: string;
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
