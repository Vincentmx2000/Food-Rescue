import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { DashboardStats, Donation } from '../../types';
import { FiPackage, FiCheckCircle, FiSearch } from 'react-icons/fi';
import Navbar from '../../components/Navbar';

const NGODashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({});
    const [availableDonations, setAvailableDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const [statsData, donationsData] = await Promise.all([
                    api.getStats(user.id, user.role),
                    api.getDonations({ status: 'AVAILABLE' }), // NGOs typically only see pending donations
                ]);

                setStats(statsData);
                setAvailableDonations(donationsData.slice(0, 6));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleClaim = async (donationId: string) => {
        if (!user) return;

        try {
            await api.claimDonation(donationId);
            // Refresh data
            const donationsData = await api.getDonations({ status: 'AVAILABLE' });
            setAvailableDonations(donationsData.slice(0, 6));

            // Update stats
            const statsData = await api.getStats(user.id, user.role);
            setStats(statsData);
        } catch (error) {
            console.error('Error claiming donation:', error);
            alert('Failed to claim donation');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        Welcome, {user?.name}! 🤝
                    </h1>
                    <p className="text-slate-600">Browse and claim food donations for your community</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up">
                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Available Donations</p>
                                <p className="text-3xl font-bold text-slate-900">{stats.pendingDonations || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                <FiPackage className="w-6 h-6 text-primary-600" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">My Claims</p>
                                <p className="text-3xl font-bold text-slate-900">{stats.claimedDonations || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                                <FiSearch className="w-6 h-6 text-warning-600" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Completed</p>
                                <p className="text-3xl font-bold text-slate-900">{stats.completedDonations || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                                <FiCheckCircle className="w-6 h-6 text-success-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Available Donations */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Available Donations</h2>
                        <Link
                            to="/ngo/browse"
                            className="text-primary-600 font-semibold hover:underline"
                        >
                            View All →
                        </Link>
                    </div>

                    {availableDonations.length === 0 ? (
                        <div className="text-center py-12">
                            <FiPackage className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-lg">No available donations at the moment</p>
                            <p className="text-slate-400 text-sm mt-2">Check back later for new donations</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableDonations.map((donation) => (
                                <div
                                    key={donation.id}
                                    className="bg-white/50 rounded-xl p-5 border border-slate-200 hover:shadow-lg transition-all card-hover"
                                >
                                    <div className="mb-4">
                                        <h3 className="font-bold text-lg text-slate-900 mb-2">{donation.foodType}</h3>
                                        <div className="space-y-1 text-sm text-slate-600">
                                            <p><strong>Quantity:</strong> {donation.quantity} {donation.unit}</p>
                                            <p><strong>Donor:</strong> {donation.donorName}</p>
                                            <p><strong>Location:</strong> {donation.pickupLocation}</p>
                                            <p><strong>Pickup:</strong> {new Date(donation.pickupTime).toLocaleString()}</p>
                                            <p><strong>Expires:</strong> {new Date(donation.expiryDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {donation.description && (
                                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{donation.description}</p>
                                    )}

                                    <button
                                        onClick={() => handleClaim(donation.id)}
                                        className="w-full btn-primary text-sm py-2"
                                    >
                                        Claim Donation
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NGODashboard;
