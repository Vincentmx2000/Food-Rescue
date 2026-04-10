import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiClock, FiCheckCircle, FiPackage } from 'react-icons/fi';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';

import DonationCard from '../../components/DonationCard';

const VolunteerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [availableTasks, setAvailableTasks] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const [tasks, statsData] = await Promise.all([
                    api.getAvailableTasks(),
                    api.getStats(user.id, user.role)
                ]);
                setAvailableTasks(tasks.slice(0, 3));
                setStats(statsData);
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

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
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12 animate-fade-in text-center md:text-left">
                    <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tight">
                        Welcome back, <span className="text-primary-600">{user?.name}</span>! 👋
                    </h1>
                    <p className="text-xl text-slate-500 font-medium tracking-tight">Your help makes a real Difference. Ready for your next mission?</p>

                    <div className="flex flex-wrap gap-6 mt-10 justify-center md:justify-start">
                        <Link
                            to="/volunteer/deliveries"
                            className="px-10 py-5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-[2rem] shadow-2xl shadow-primary-500/30 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs"
                        >
                            Find New Missions
                        </Link>
                        <Link
                            to="/volunteer/history"
                            className="px-10 py-5 bg-white border border-slate-100 text-slate-700 font-black rounded-[2rem] hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-slate-200/20"
                        >
                            Mission History
                        </Link>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 animate-slide-up">
                    <div className="stat-card p-8 bg-primary-600 border-0 text-white shadow-2xl shadow-primary-500/20">
                        <div className="flex items-center space-x-6">
                            <div className="p-4 rounded-[1.5rem] bg-white/10 backdrop-blur-md border border-white/20">
                                <FiPackage className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.2em] text-primary-100 mb-1">Available Missions</p>
                                <p className="text-4xl font-black">{stats.pendingDonations || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card p-8 bg-white border-0 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center space-x-6">
                            <div className="p-4 rounded-[1.5rem] bg-amber-50 text-amber-600">
                                <FiClock className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Assigned Missions</p>
                                <p className="text-4xl font-black text-slate-800">{stats.activeDonations || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card p-8 bg-white border-0 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center space-x-6">
                            <div className="p-4 rounded-[2rem] bg-emerald-50 text-emerald-600">
                                <FiCheckCircle className="w-10 h-10" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Completed</p>
                                <p className="text-4xl font-black text-slate-800">{stats.completedDonations || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Urgent Pickups Section */}
                <div>
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Urgent Missions</h2>
                        <Link
                            to="/volunteer/deliveries"
                            className="text-primary-600 font-black text-xs uppercase tracking-[0.2em] hover:text-primary-800 transition-colors"
                        >
                            Explore All <span className="ml-2">→</span>
                        </Link>
                    </div>

                    {availableTasks.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <FiPackage className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                            <p className="text-slate-400 text-xl font-bold">No urgent missions at the moment.</p>
                            <p className="text-slate-400 font-medium mt-2">Check back later for new rescuing opportunities.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {availableTasks.map((task: any) => (
                                <DonationCard
                                    key={task.id}
                                    donation={task.donationId}
                                    linkTo={`/volunteer/donation/${task.donationId?.id || task.donationId?._id}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VolunteerDashboard;
