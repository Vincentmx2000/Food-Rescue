import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { DashboardStats, Donation } from '../../types';
import { FiPlus, FiClock, FiPackage, FiCheckCircle, FiChevronRight, FiStar, FiMessageSquare } from 'react-icons/fi';
import Navbar from '../../components/Navbar';
import DonationCard from '../../components/DonationCard';
import type { Feedback } from '../../types';

const DonorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({});
    const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
    const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const [statsData, donationsData, feedbackData] = await Promise.all([
                    api.getStats(user.id, user.role),
                    api.getDonations({ donorId: user.id }),
                    api.getMyFeedback()
                ]);

                setStats(statsData);
                setRecentDonations(donationsData.slice(0, 3));
                setRecentFeedback(feedbackData.feedback.slice(0, 3));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FBFBFB]">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-16 animate-fade-in">
                    <h1 className="text-6xl font-black text-black mb-4 tracking-tighter">
                        Welcome back, {user?.name.toLowerCase()}! 👋
                    </h1>
                    <p className="text-xl text-slate-500 font-medium tracking-tight">Manage your food donations and track your impact on the community.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 animate-slide-up">
                    <div className="bg-primary-500 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-primary-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-80">Total Donations</p>
                            <p className="text-5xl font-black tracking-tighter">{stats.totalDonations || 0}</p>
                        </div>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 group-hover:rotate-6 transition-transform">
                            <FiPackage className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Active Mission</p>
                            <p className="text-5xl font-black text-black tracking-tighter">{stats.activeDonations || 0}</p>
                        </div>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 group-hover:-rotate-6 transition-transform">
                            <FiClock className="w-8 h-8 text-amber-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Completed</p>
                            <p className="text-5xl font-black text-black tracking-tighter">{stats.completedDonations || 0}</p>
                        </div>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 group-hover:rotate-12 transition-transform">
                            <FiCheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Reputation</p>
                            <p className="text-5xl font-black text-black tracking-tighter">
                                {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                            </p>
                        </div>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center border border-yellow-100 group-hover:-rotate-12 transition-transform">
                            <FiStar className={`w-8 h-8 ${stats.averageRating ? 'text-yellow-500 fill-current' : 'text-slate-300'}`} />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        to="/donor/create-donation"
                        className="flex items-center justify-center space-x-3 bg-primary-500 hover:bg-black text-white font-black py-7 rounded-[2rem] shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
                    >
                        <FiPlus className="w-5 h-5" />
                        <span>Create New Donation</span>
                    </Link>
                    <Link
                        to="/donor/history"
                        className="flex items-center justify-center space-x-3 bg-white border-2 border-slate-100 hover:border-black text-black font-black py-7 rounded-[2rem] transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-slate-200/20"
                    >
                        <FiClock className="w-5 h-5 text-slate-400" />
                        <span>View Past Donations</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
                    {/* Recent Donations */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-4xl font-black text-black tracking-tighter">Recent Logistics</h2>
                            {recentDonations.length > 0 && (
                                <Link
                                    to="/donor/history"
                                    className="group flex items-center space-x-2 text-primary-600 font-black uppercase tracking-widest text-[10px]"
                                >
                                    <span>All Registry</span>
                                    <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            )}
                        </div>

                        {recentDonations.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                                <FiPackage className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                                <p className="text-slate-400 text-lg font-bold">No donations yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {recentDonations.map((donation) => (
                                    <DonationCard
                                        key={donation.id}
                                        donation={donation}
                                        linkTo={`/donor/donation/${donation.id}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Feedback */}
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-4xl font-black text-black tracking-tighter">Trust Score</h2>
                        </div>

                        <div className="space-y-4">
                            {recentFeedback.length === 0 ? (
                                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 text-center">
                                    <FiMessageSquare className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold">No feedback yet</p>
                                    <p className="text-xs text-slate-300 mt-2">Feedback appears after successful distribution</p>
                                </div>
                            ) : (
                                recentFeedback.map((f) => (
                                    <div key={f.id} className="bg-white rounded-[2rem] p-6 border border-slate-50 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-black text-xs uppercase tracking-widest text-primary-600 truncate max-w-[150px]">
                                                {f.ngoId.organization || f.ngoId.name}
                                            </span>
                                            <div className="flex items-center text-yellow-500">
                                                <FiStar className="fill-current w-3 h-3 mr-1" />
                                                <span className="font-bold text-xs">{f.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-3 italic">"{f.comment}"</p>
                                        <p className="text-[10px] text-slate-300 mt-3 font-bold uppercase tracking-widest">
                                            {new Date(f.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonorDashboard;
