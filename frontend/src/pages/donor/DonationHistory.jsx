import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import Navbar from '../../components/Navbar.jsx';
import DonationCard from '../../components/DonationCard.jsx';
import { FiPackage } from 'react-icons/fi';

const DonationHistory = () => {
    const { user } = useAuth();
    const [donations, setDonations] = useState([]);
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

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Mission History</h1>
                    <p className="text-slate-500 font-medium text-lg">Track all your food rescue missions and their current status.</p>
                </div>

                {donations.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiPackage className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">No Missions Found</h3>
                        <p className="text-slate-500 mb-8">You haven't posted any donations yet.</p>
                        <Link
                            to="/donor/create-donation"
                            className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                        >
                            Start a New Mission
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {donations.map((donation) => (
                            <DonationCard
                                key={donation.id}
                                donation={donation}
                                linkTo={`/donor/donation/${donation.id}`}
                                action={['AVAILABLE', 'CLAIMED_BY_NGO', 'VOLUNTEER_ASSIGNED'].includes(donation.status) ? {
                                    label: donation.status === 'AVAILABLE' ? 'Delete mission' : 'Cancel mission',
                                    variant: 'danger',
                                    onClick: async () => {
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
                                    }
                                } : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DonationHistory;
