import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { DashboardStats, Donation, User } from '../../types';
import { FiUsers, FiPackage, FiCheckCircle, FiActivity, FiArrowRight } from 'react-icons/fi';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
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
        const interval = setInterval(fetchData, 30000); // Auto-update every 30s
        return () => clearInterval(interval);
    }, []);

    const statCards = [
        { title: 'Donation Impact', value: stats.totalDonations || 0, icon: <FiPackage />, color: 'orange', label: 'Total Donations' },
        { title: 'Community Network', value: stats.totalUsers || 0, icon: <FiUsers />, color: 'black', label: 'Active Users' },
        { title: 'Deliveries Completed', value: stats.completedDonations || 0, icon: <FiCheckCircle />, color: 'orange', label: 'Completed Pickups' },
        { title: 'Pending Pickups', value: stats.activeDonations || 0, icon: <FiActivity />, color: 'black', label: 'Pending Donations' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold mt-6 uppercase tracking-[0.3em] text-[10px]">Loading Dashboard Stats...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
                {/* Header Section */}
                <div className="mb-16">
                    <div className="inline-flex items-center space-x-2 text-primary-600 font-bold uppercase tracking-widest text-xs mb-4">
                        <span className="w-8 h-[2px] bg-primary-600"></span>
                        <span>Admin Control Panel</span>
                    </div>
                    <h1 className="text-6xl font-black text-black tracking-tighter leading-none mb-4 flex items-center gap-4">
                        Platform <span className="text-primary-600">Overview</span>
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border-2 border-red-100 rounded-full animate-pulse mt-2">
                            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Live Updates</span>
                        </div>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl font-medium leading-relaxed">
                        Monitor and manage all food rescue activities across the platform.
                        Keep track of every donation from donor to receiver.
                    </p>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
                    {statCards.map((stat, index) => (
                        <div key={index}
                            className={`p-8 rounded-[2rem] transition-all group border-2 ${stat.color === 'orange' ? 'bg-primary-50 border-primary-100' : 'bg-slate-50 border-slate-100'} hover:border-primary-500`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl ${stat.color === 'orange' ? 'bg-primary-600 text-white' : 'bg-black text-white'} group-hover:scale-110 transition-transform`}>
                                    {stat.icon}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Status</div>
                            </div>
                            <h3 className={`text-4xl font-black mb-1 ${stat.color === 'orange' ? 'text-primary-600' : 'text-black'}`}>
                                {stat.value.toLocaleString()}
                            </h3>
                            <p className="text-sm font-bold text-slate-600 mb-1">{stat.title}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Activity Log */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Recent Donations */}
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-black text-black tracking-tight">Recent Donations</h2>
                                <Link to="/admin/donations" className="group flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-all font-sans">
                                    <span>View All Donations</span>
                                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {recentDonations.map((donation) => (
                                    <Link key={donation.id} to={`/donation/${donation.id}`}
                                        className="flex items-center p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-primary-500 transition-all group">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all mr-4">
                                            <FiPackage size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className={`flex-shrink-0 inline-flex items-center justify-center p-0.5 border-2 rounded-sm ${donation.foodCategory === 'Non-Veg' ? 'border-rose-500' : 'border-emerald-500'} bg-white`}
                                                    style={{ width: '12px', height: '12px' }}
                                                    title={donation.foodCategory === 'Non-Veg' ? "Non-Vegetarian" : "Vegetarian"}
                                                >
                                                    <span className={`rounded-full w-1.5 h-1.5 ${donation.foodCategory === 'Non-Veg' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                                </div>
                                                <h4 className="font-black text-black group-hover:text-primary-600 transition-colors uppercase tracking-tight">{donation.foodType}</h4>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ {donation.quantity} {donation.unit}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-tighter">{donation.donorName} • {donation.pickupLocation}</p>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2
                                            ${donation.status === 'DISTRIBUTED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-primary-50 border-primary-100 text-primary-600'}`}>
                                            {donation.status.replace(/_/g, ' ')}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Registry Hub */}
                    <div className="lg:col-span-4">
                        <section className="bg-black rounded-[3rem] p-10 text-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>

                            <div className="relative z-10">
                                <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">Recent Users</h2>
                                <div className="space-y-6">
                                    {recentUsers.map((user) => (
                                        <div key={user.id} className="flex items-center space-x-4 border-b border-white/10 pb-6 last:border-0 hover:translate-x-2 transition-transform cursor-pointer group/item">
                                            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center font-black text-sm group-hover/item:rotate-12 transition-transform">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-sm group-hover/item:text-primary-500 transition-colors uppercase tracking-tight">{user.name}</p>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{user.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Link to="/admin/users" className="mt-10 w-full flex items-center justify-center space-x-2 py-5 bg-white text-black rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all font-sans">
                                    <span>View All Users</span>
                                    <FiUsers />
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
