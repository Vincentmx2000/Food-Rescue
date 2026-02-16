import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Donation } from '../../types';
import Navbar from '../../components/Navbar';
import { FiClock, FiPackage, FiMapPin } from 'react-icons/fi';

const DonationHistory: React.FC = () => {
    const { user } = useAuth();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDonations = async () => {
            if (user) {
                try {
                    const data = await api.getDonations({ donorId: user.id });
                    console.log('Fetched donations:', data);
                    console.log('First donation proof images:', data[0]?.distributionProofImages);
                    setDonations(data);
                } catch (error) {
                    console.error("Failed to fetch history", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchDonations();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'CLAIMED_BY_NGO': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'DISTRIBUTED': return 'bg-green-100 text-green-800 border-green-200';
            case 'VOLUNTEER_ASSIGNED': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'PICKED_UP': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Donation History</h1>
                    <p className="text-slate-600">Track and manage your past food contributions.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange"></div>
                    </div>
                ) : donations.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
                        <FiPackage className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-800">No Donations Yet</h3>
                        <p className="text-slate-500 mb-6">Start your journey by making your first donation today.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {donations.map((donation) => (
                            <div
                                key={donation.id}
                                className="block bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group"
                            >
                                <Link to={`/donor/donation/${donation.id}`} className="absolute inset-0 z-0" />
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 pointer-events-none">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100 pointer-events-auto">
                                            {donation.imageUrl ? (
                                                <img src={donation.imageUrl} alt={donation.foodType} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <FiPackage size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-slate-900">{donation.foodType}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(donation.status)} capitalize`}>
                                                    {donation.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <FiPackage className="text-orange" />
                                                    <span>{donation.quantity} {donation.unit}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FiClock className="text-orange" />
                                                    <span>Expires: {new Date(donation.expiryDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 sm:col-span-2">
                                                    <FiMapPin className="text-orange" />
                                                    <span>{donation.pickupLocation}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                        <div className="text-right">
                                            <p className="text-slate-500 text-xs">Posted on</p>
                                            <p className="font-medium text-slate-900">{new Date(donation.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        {donation.claimedByName && (
                                            <div className="text-right">
                                                <p className="text-slate-500 text-xs">Claimed by</p>
                                                <p className="font-medium text-primary-600">{donation.claimedByName}</p>
                                            </div>
                                        )}
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
                                                                setDonations(prev => prev.filter(d => d.id !== donation.id));
                                                            } else {
                                                                setDonations(prev => prev.map(d => d.id === donation.id ? { ...d, status: 'CANCELLED' } : d));
                                                            }
                                                        } catch (err) {
                                                            alert(`Failed to ${action} donation`);
                                                        }
                                                    }
                                                }}
                                                className="pointer-events-auto ml-4 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold border border-red-100"
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
            </div>
        </div>
    );
};

export default DonationHistory;
