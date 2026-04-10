import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Navbar from '../../components/Navbar';
import { FiPackage, FiCheckCircle, FiSearch, FiFilter } from 'react-icons/fi';
import type { Donation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import DonationCard from '../../components/DonationCard';

const BrowseDonations: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        fetchDonations();
    }, []);

    const fetchDonations = async () => {
        try {
            const allDonations = await api.getDonations({});
            const available = allDonations.filter((d: Donation) => d.status === 'AVAILABLE');
            setDonations(available);
        } catch (error) {
            console.error('Failed to fetch donations', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimClick = (id: string) => {
        setSelectedId(id);
    };

    const confirmClaim = async () => {
        if (!selectedId || !user) return;
        setIsClaiming(true);

        try {
            await api.claimDonation(selectedId, user.id, user.name);
            // Redirect to My Claims page
            navigate('/ngo/claimed');
        } catch (error: any) {
            console.error('Failed to claim donation', error);
            const message = error.response?.data?.message || 'Failed to claim donation. Please try again.';
            alert(message);
        } finally {
            setIsClaiming(false);
            setSelectedId(null);
        }
    };

    const filteredDonations = donations.filter(donation =>
        donation.foodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8 animate-fade-in">
                    <div className="text-center md:text-left">
                        <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tight">Available Resources</h1>
                        <p className="text-xl text-slate-500 font-medium tracking-tight">Find and claim fresh food donations for your community.</p>
                        {!user?.isVerified && (
                            <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3 text-orange-700 animate-pulse">
                                <FiFilter className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-bold tracking-tight">Your account is pending verification. You cannot claim donations until an admin grants clearance.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search food, location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-xl shadow-slate-200/50 transition-all font-medium"
                            />
                        </div>
                        <button className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 shadow-xl shadow-slate-200/50 transition-all">
                            <FiFilter className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
                    </div>
                ) : filteredDonations.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                        <FiPackage className="w-24 h-24 text-slate-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">No donations at the moment</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">There are currently no fresh donations available for claim. Check back soon!</p>
                        <button
                            onClick={fetchDonations}
                            className="text-primary-600 font-black text-sm uppercase tracking-widest hover:text-primary-800 transition-colors"
                        >
                            Refresh List
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filteredDonations.map((donation) => (
                            <DonationCard
                                key={donation.id}
                                donation={donation}
                                linkTo={`/donation/${donation.id}`}
                                action={{
                                    label: 'Claim Resource',
                                    onClick: () => handleClaimClick(donation.id)
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {selectedId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-10 transform transition-all border border-slate-100">
                        <div className="flex items-center justify-center w-20 h-20 mx-auto bg-primary-50 rounded-[2rem] mb-8">
                            <FiCheckCircle className="w-10 h-10 text-primary-600" />
                        </div>
                        <h3 className="text-3xl font-black text-center text-slate-900 mb-4 tracking-tight">Claim this Rescue?</h3>
                        <p className="text-center text-slate-500 mb-10 font-medium leading-relaxed">
                            By claiming this donation, you agree to coordinate the pickup and distribution of these resources to those in need.
                        </p>
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={confirmClaim}
                                disabled={isClaiming}
                                className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary-500/40 hover:bg-primary-700 transition-all flex items-center justify-center disabled:opacity-50"
                            >
                                {isClaiming ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'Confirm Rescue Mission'
                                )}
                            </button>
                            <button
                                onClick={() => setSelectedId(null)}
                                className="w-full py-5 bg-slate-50 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
                                disabled={isClaiming}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrowseDonations;
