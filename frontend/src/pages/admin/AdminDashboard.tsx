import React, { useEffect, useState } from 'react';
// import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { DashboardStats, Donation, User } from '../../types';
import { FiUsers, FiPackage, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import Navbar from '../../components/Navbar';

import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
    // const { user } = useAuth(); // Not needed
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({});
    const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, donationsData, usersData] = await Promise.all([
                    api.getStats(undefined, 'admin'),
                    api.getDonations({ isAdmin: true }),
                    api.getUsers(),
                ]);

                setStats(statsData);
                setRecentDonations(donationsData.slice(0, 5));
                setRecentUsers(usersData.slice(0, 5));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            'AVAILABLE': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'CLAIMED_BY_NGO': 'bg-blue-100 text-blue-800 border-blue-200',
            'VOLUNTEER_ASSIGNED': 'bg-purple-100 text-purple-800 border-purple-200',
            'PICKED_UP': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'DISTRIBUTED': 'bg-green-100 text-green-800 border-green-200',
            'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
        };
        return badges[status] || badges['AVAILABLE'];
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
                        Admin Dashboard 📊
                    </h1>
                    <p className="text-slate-600">Monitor platform activity and manage users</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
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
                                <p className="text-sm font-medium text-slate-600 mb-1">Total Donors</p>
                                <p className="text-3xl font-bold text-slate-900">{stats.totalDonors || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                                <FiUsers className="w-6 h-6 text-secondary-600" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Total NGOs</p>
                                <p className="text-3xl font-bold text-slate-900">{stats.totalNGOs || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                                <FiTrendingUp className="w-6 h-6 text-warning-600" />
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                    {/* User Management Quick Action */}
                    <div
                        className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group"
                        onClick={() => navigate('/admin/users')}
                    >
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-indigo-200 transition-colors">
                                <FiUsers className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Manage Users</h3>
                                <p className="text-slate-500 text-sm">View, block, or unblock user accounts</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                    </div>

                    <div
                        className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group"
                        onClick={() => navigate('/admin/donations')}
                    >
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-orange-200 transition-colors">
                                <FiPackage className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Manage Donations</h3>
                                <p className="text-slate-500 text-sm">Oversee and flag donations</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Donations */}
                    <div className="glass-card p-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Donations</h2>

                        <div className="space-y-3">
                            {recentDonations.map((donation) => (
                                <div
                                    key={donation.id}
                                    className="bg-white/50 rounded-lg p-4 border border-slate-200"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-slate-900">{donation.foodType}</h3>
                                        <span className={getStatusBadge(donation.status)}>{donation.status}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Donor: {donation.donorName}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        Quantity: {donation.quantity} {donation.unit}
                                    </p>
                                    {donation.claimedByName && (
                                        <p className="text-sm text-primary-600 mt-1">
                                            Claimed by: {donation.claimedByName}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Users */}
                    <div className="glass-card p-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Users</h2>

                        <div className="space-y-3">
                            {recentUsers.map((u) => (
                                <div
                                    key={u.id}
                                    className="bg-white/50 rounded-lg p-4 border border-slate-200"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{u.name}</h3>
                                            <p className="text-sm text-slate-600">{u.email}</p>
                                            {u.organization && (
                                                <p className="text-sm text-slate-500 mt-1">{u.organization}</p>
                                            )}
                                        </div>
                                        <span className={`badge-${u.role === 'donor' ? 'active' : u.role === 'ngo' ? 'pending' : 'completed'} capitalize`}>
                                            {u.role}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
