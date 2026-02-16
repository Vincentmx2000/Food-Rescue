import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Navbar from '../../components/Navbar';
import { FiMapPin, FiClock, FiPackage, FiCheckCircle, FiSearch, FiFilter, FiEye, FiX } from 'react-icons/fi';
import type { Donation } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface DonationDetailModalProps {
    donation: Donation;
    onClose: () => void;
    onClaim: (id: string) => void;
}

const DonationDetailModal: React.FC<DonationDetailModalProps> = ({ donation, onClose, onClaim }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all scale-100 flex flex-col">
                <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-slate-900 pr-8 line-clamp-1">{donation.foodType}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <FiX className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Status Badge */}
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold border capitalize
                            ${donation.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 border-green-200' :
                                donation.status === 'CLAIMED_BY_NGO' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                    'bg-slate-100 text-slate-800 border-slate-200'}`}>
                            {donation.status === 'AVAILABLE' ? 'Available' : donation.status}
                        </span>
                    </div>

                    {/* 1. Food Information */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                            <FiPackage className="mr-2 text-primary-600" /> Food Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Quantity</p>
                                <p className="font-medium text-slate-900">{donation.quantity} {donation.unit}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Expiry</p>
                                <p className="font-medium text-slate-900">{new Date(donation.expiryDate).toLocaleString()}</p>
                            </div>
                            {donation.description && (
                                <div className="bg-slate-50 p-4 rounded-xl md:col-span-2">
                                    <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Description</p>
                                    <p className="font-medium text-slate-900">{donation.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Pickup Information */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                            <FiMapPin className="mr-2 text-primary-600" /> Pickup Details
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                            <div>
                                <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Address</p>
                                <p className="font-medium text-slate-900">{donation.pickupLocation}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Preferred Time</p>
                                <p className="font-medium text-slate-900">{new Date(donation.pickupTime).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* 4. Donor Information */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                            <FiCheckCircle className="mr-2 text-primary-600" /> Donor Info
                        </h3>
                        <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">
                                {donation.donorName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{donation.donorName}</p>
                                <p className="text-sm text-slate-500">Verified Donor</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl mt-auto">
                    {donation.status === 'AVAILABLE' ? (
                        <button
                            onClick={() => onClaim(donation.id)}
                            className="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all active:scale-95"
                        >
                            Claim this Donation
                        </button>
                    ) : (
                        <div className="w-full py-3 bg-slate-200 text-slate-500 rounded-xl font-bold text-center cursor-not-allowed">
                            This donation is not available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const BrowseDonations: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewingDonation, setViewingDonation] = useState<Donation | null>(null);
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
        // If viewing detailed modal, close it first
        setViewingDonation(null);
        setSelectedId(id);
    };

    const handleViewDetails = (donation: Donation) => {
        setViewingDonation(donation);
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

    const getTimeRemaining = (expiryDate: string) => {
        const now = new Date().getTime();
        const expiry = new Date(expiryDate).getTime();
        const diff = expiry - now;

        if (diff <= 0) return 'Expired';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days} days left`;
        }
        return `${hours} hours left`;
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Available Donations</h1>
                        <p className="text-slate-600">Find and claim food donations in your area</p>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search food or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-full md:w-64"
                            />
                        </div>
                        <button className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600">
                            <FiFilter />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600"></div>
                    </div>
                ) : filteredDonations.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <FiPackage className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-800">No Donations Available</h3>
                        <p className="text-slate-500 mb-6">There are currently no pending donations. Please check back later.</p>
                        <button
                            onClick={fetchDonations}
                            className="text-primary-600 font-medium hover:underline"
                        >
                            Refresh List
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDonations.map((donation) => (
                            <div key={donation.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full animate-slide-up relative group">
                                <div className="p-5 flex-1 relative">
                                    {/* View Details Icon Button */}
                                    <button
                                        onClick={() => handleViewDetails(donation)}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-primary-600 p-1 rounded-full hover:bg-primary-50 transition-colors z-10"
                                        title="View Details"
                                    >
                                        <FiEye className="w-5 h-5" />
                                    </button>

                                    <div className="flex justify-between items-start mb-4 pr-8">
                                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                            Available
                                        </span>
                                    </div>

                                    <div className="mb-1">
                                        <span className="text-xs text-slate-500 font-medium flex items-center mb-1">
                                            <FiClock className="mr-1" />
                                            {getTimeRemaining(donation.expiryDate)}
                                        </span>
                                        <h3 className="text-xl font-bold text-slate-900 line-clamp-1 group-hover:text-primary-600 transition-colors cursor-pointer" onClick={() => handleViewDetails(donation)} title={donation.foodType}>
                                            {donation.foodType}
                                        </h3>
                                    </div>

                                    <div className="space-y-3 text-sm text-slate-600 mb-4 mt-4">
                                        <div className="flex items-start">
                                            <FiPackage className="w-4 h-4 mr-2 mt-0.5 text-primary-500 flex-shrink-0" />
                                            <span><span className="font-semibold text-slate-700">Quantity:</span> {donation.quantity} {donation.unit}</span>
                                        </div>
                                        <div className="flex items-start">
                                            <FiMapPin className="w-4 h-4 mr-2 mt-0.5 text-primary-500 flex-shrink-0" />
                                            <span className="line-clamp-2">{donation.pickupLocation}</span>
                                        </div>
                                        {/* <div className="flex items-start">
                                            <FiCalendar className="w-4 h-4 mr-2 mt-0.5 text-primary-500 flex-shrink-0" />
                                            <span><span className="font-semibold text-slate-700">Posted:</span> {new Date(donation.createdAt).toLocaleDateString()}</span>
                                        </div> */}
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto flex gap-3">
                                    <button
                                        onClick={() => handleViewDetails(donation)}
                                        className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => handleClaimClick(donation.id)}
                                        className="flex-1 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all active:scale-95 text-sm"
                                    >
                                        Claim
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Donation Detail Modal */}
            {viewingDonation && (
                <DonationDetailModal
                    donation={viewingDonation}
                    onClose={() => setViewingDonation(null)}
                    onClaim={handleClaimClick}
                />
            )}

            {/* Confirmation Modal */}
            {selectedId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary-100 rounded-full mb-4">
                            <FiCheckCircle className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Claim this Donation?</h3>
                        <p className="text-center text-slate-600 mb-6">
                            By claiming this donation, you agree to pick it up from the location within the specified time.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setSelectedId(null)}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                disabled={isClaiming}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmClaim}
                                disabled={isClaiming}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center"
                            >
                                {isClaiming ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'Confirm Claim'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrowseDonations;
