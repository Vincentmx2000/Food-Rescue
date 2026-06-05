import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { FiPackage, FiCheckCircle, FiSearch, FiChevronRight } from 'react-icons/fi';
import Navbar from '../../components/Navbar.jsx';
import DonationCard from '../../components/DonationCard.jsx';

const NGODashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({});
    const [availableDonations, setAvailableDonations] = useState([]);
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
                    api.getDonations({ status: 'AVAILABLE' }),
                ]);

                setStats(statsData);
                setAvailableDonations(donationsData.slice(0, 3));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleClaim = async (donationId) => {
        if (!user) return;

        try {
            await api.claimDonation(donationId);
            // Refresh data
            const donationsData = await api.getDonations({ status: 'AVAILABLE' });
            setAvailableDonations(donationsData.slice(0, 3));

            // Update stats
            const statsData = await api.getStats(user.id, user.role);
            setStats(statsData);
            alert('Donation claimed successfully!');
        } catch (error) {
            console.error('Error claiming donation:', error);
            alert('Failed to claim donation');
        }
    };

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
                        Welcome, {user?.name.toLowerCase()}! 🤝
                    </h1>
                    <p className="text-xl text-slate-500 font-medium tracking-tight">Help bridge the gap by claiming and distributing food to those in need.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-slide-up">
                    <div className="bg-primary-500 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-primary-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-80">Available Now</p>
                            <p className="text-6xl font-black tracking-tighter">{stats.pendingDonations || 0}</p>
                        </div>
                        <div className="absolute right-10 top-1/2 -translate-y-1/2 w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 group-hover:rotate-6 transition-transform">
                            <FiPackage className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">My Active Claims</p>
                            <p className="text-6xl font-black text-black tracking-tighter">{stats.claimedDonations || 0}</p>
                        </div>
                        <div className="absolute right-10 top-1/2 -translate-y-1/2 w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center border border-amber-100 group-hover:-rotate-6 transition-transform">
                            <FiSearch className="w-10 h-10 text-amber-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Completed</p>
                            <p className="text-6xl font-black text-black tracking-tighter">{stats.completedDonations || 0}</p>
                        </div>
                        <div className="absolute right-10 top-1/2 -translate-y-1/2 w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center border border-emerald-100 group-hover:rotate-12 transition-transform">
                            <FiCheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Available Donations */}
                <div className="mb-20">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-4xl font-black text-black tracking-tighter">Available Missions</h2>
                        <Link
                            to="/ngo/browse"
                            className="group flex items-center space-x-2 bg-black text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary-500 transition-all"
                        >
                            <span>Explore All</span>
                            <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {availableDonations.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                            <FiPackage className="w-20 h-20 text-slate-100 mx-auto mb-8" />
                            <p className="text-slate-500 text-xl font-bold">No available donations at the moment</p>
                            <p className="text-slate-400 font-medium mt-2">Check back in a bit for new opportunities to help.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {availableDonations.map((donation) => (
                                <DonationCard
                                    key={donation.id}
                                    donation={donation}
                                    linkTo={`/donation/${donation.id}`}
                                    action={{
                                        label: 'Claim Mission',
                                        onClick: () => handleClaim(donation.id)
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NGODashboard;
