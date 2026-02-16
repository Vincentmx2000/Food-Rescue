import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { DashboardStats, Donation } from '../../types';
import { FiPlus, FiClock, FiPackage, FiCheckCircle } from 'react-icons/fi';
import Navbar from '../../components/Navbar';

const DonorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({});
    const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoading(false); // Keep this here to ensure loading is false if no user
                return;
            }

            try {
                const [statsData, donationsData] = await Promise.all([
                    api.getStats(user.id, user.role),
                    api.getDonations({ donorId: user.id }),
                ]);

                setStats(statsData);
                setRecentDonations(donationsData.slice(0, 5));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false); // This ensures loading is false after try/catch block
            }
        };

        fetchData();
    }, [user]);

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'AVAILABLE': 'Available',
            'CLAIMED_BY_NGO': 'Claimed by NGO',
            'VOLUNTEER_ASSIGNED': 'Assigned to Volunteer',
            'PICKED_UP': 'Picked Up',
            'DISTRIBUTED': 'Distributed',
            'CANCELLED': 'Cancelled'
        };
        return labels[status] || status;
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            'AVAILABLE': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'CLAIMED_BY_NGO': 'bg-blue-100 text-blue-800 border-blue-200',
            'VOLUNTEER_ASSIGNED': 'bg-purple-100 text-purple-800 border-purple-200',
            'PICKED_UP': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'DISTRIBUTED': 'bg-green-100 text-green-800 border-green-200',
            'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
        };
        return `px-2 py-0.5 rounded-full text-xs font-bold border ${badges[status] || 'bg-slate-100 text-slate-800 border-slate-200'}`;
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
                        Welcome back, {user?.name}! 👋
                    </h1>
                    <p className="text-slate-600">Manage your food donations and make a difference</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up">
                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Total Donations</p>
                                <p className="text-3xl font-bold text-slate-900">{stats.totalDonations || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                <FiPackage className="w-6 h-6 text-primary-600" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Active</p>
                                <p className="text-3xl font-bold text-slate-900">{stats.activeDonations || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                                <FiClock className="w-6 h-6 text-warning-600" />
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

                {/* Quick Actions */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        to="/donor/create-donation"
                        className="flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                    >
                        <FiPlus className="w-5 h-5" />
                        <span>Create New Donation</span>
                    </Link>
                    <Link
                        to="/donor/history"
                        className="flex items-center justify-center space-x-2 bg-white border-2 border-slate-100 hover:border-orange-500/20 hover:bg-orange-50 text-slate-700 font-bold py-4 rounded-xl transition-all"
                    >
                        <FiClock className="w-5 h-5" />
                        <span>View Past Donations</span>
                    </Link>
                </div>

                {/* Recent Donations */}
                <div className="glass-card p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Donations</h2>

                    {recentDonations.length === 0 ? (
                        <div className="text-center py-12">
                            <FiPackage className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-lg">No donations yet</p>
                            <Link to="/donor/create-donation" className="text-primary-600 font-semibold hover:underline mt-2 inline-block">
                                Create your first donation
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentDonations.map((donation) => (
                                <div
                                    key={donation.id}
                                    className="block bg-white/50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow relative group"
                                >
                                    <Link to={`/donor/donation/${donation.id}`} className="absolute inset-0 z-0" />
                                    <div className="flex items-start gap-4 relative z-10 pointer-events-none">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100 pointer-events-auto">
                                            {donation.imageUrl ? (
                                                <img src={donation.imageUrl} alt={donation.foodType} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <FiPackage size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="font-semibold text-slate-900">{donation.foodType}</h3>
                                                <span className={getStatusBadge(donation.status)}>{getStatusLabel(donation.status)}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-1">
                                                Quantity: {donation.quantity} {donation.unit}
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                Pickup: {new Date(donation.expiryDate).toLocaleDateString()}
                                            </p>
                                            {donation.claimedByName && (
                                                <p className="text-sm text-primary-600 mt-2">
                                                    Claimed by: {donation.claimedByName}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 text-right pointer-events-auto">
                                            <div className="text-sm text-slate-500 whitespace-nowrap">
                                                {new Date(donation.createdAt).toLocaleDateString()}
                                            </div>
                                            {['AVAILABLE', 'CLAIMED_BY_NGO', 'VOLUNTEER_ASSIGNED'].includes(donation.status) && (
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        const action = donation.status === 'AVAILABLE' ? 'delete' : 'cancel';
                                                        if (window.confirm(`Are you sure you want to ${action} this donation?`)) {
                                                            try {
                                                                await api.deleteDonation(donation.id);
                                                                if (donation.status === 'AVAILABLE') {
                                                                    setRecentDonations(prev => prev.filter(d => d.id !== donation.id));
                                                                } else {
                                                                    setRecentDonations(prev => prev.map(d => d.id === donation.id ? { ...d, status: 'CANCELLED' } : d));
                                                                }
                                                                // Also update stats if needed, or just refresh
                                                            } catch (err) {
                                                                alert(`Failed to ${action} donation`);
                                                            }
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-[10px] font-bold border border-red-100 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    {donation.status === 'AVAILABLE' ? 'Delete' : 'Cancel'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {recentDonations.length > 0 && (
                        <div className="mt-6 text-center">
                            <Link
                                to="/donor/history"
                                className="text-primary-600 font-semibold hover:underline"
                            >
                                View All Donations →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DonorDashboard;
