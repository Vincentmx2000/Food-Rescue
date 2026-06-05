import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import { api } from '../../services/api.js';
import { FiPackage, FiSearch, FiTrash2, FiFlag } from 'react-icons/fi';

const AdminDonations = () => {
    const navigate = useNavigate();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal State
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchDonations();
    }, []);

    const fetchDonations = async () => {
        try {
            const data = await api.getDonations({ isAdmin: true });
            setDonations(data);
        } catch (error) {
            console.error('Failed to fetch donations', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (donation, type) => {
        setSelectedDonation(donation);
        setActionType(type);
    };

    const confirmAction = async () => {
        if (!selectedDonation || !actionType) return;
        setActionLoading(true);
        try {
            if (actionType === 'cancel') {
                await api.updateDonation(selectedDonation.id, { status: 'CANCELLED' });
            } else {
                console.log('Flagging donation:', selectedDonation.id);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            await fetchDonations();
            closeModal();
        } catch (error) {
            console.error(`Failed to ${actionType} donation`, error);
        } finally {
            setActionLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedDonation(null);
        setActionType(null);
    };

    const filteredDonations = donations.filter((donation) => {
        const matchesSearch =
            donation.foodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            donation.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const styles = {
            'AVAILABLE': 'bg-yellow-50 border-yellow-100 text-yellow-600',
            'CLAIMED_BY_NGO': 'bg-blue-50 border-blue-100 text-blue-600',
            'VOLUNTEER_ASSIGNED': 'bg-purple-50 border-purple-100 text-purple-600',
            'PICKED_UP': 'bg-indigo-50 border-indigo-100 text-indigo-600',
            'DISTRIBUTED': 'bg-emerald-50 border-emerald-100 text-emerald-600',
            'CANCELLED': 'bg-red-50 border-red-100 text-red-600',
        };
        return `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 ${styles[status] || 'bg-slate-50 border-slate-100 text-slate-400'}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold mt-6 uppercase tracking-[0.3em] text-[10px]">Loading donations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
                <div className="mb-16">
                    <div className="inline-flex items-center space-x-2 text-primary-600 font-bold uppercase tracking-widest text-xs mb-4">
                        <span className="w-8 h-[2px] bg-primary-600"></span>
                        <span>Donation Management</span>
                    </div>
                    <h1 className="text-6xl font-black text-black tracking-tighter leading-none mb-4">
                        Donation <span className="text-primary-600">History</span>
                    </h1>
                </div>

                <div className="mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="relative group w-full md:w-96">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search donations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-primary-600 transition-all font-bold placeholder:text-slate-300"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:border-primary-600 transition-all"
                        >
                            <option value="all">All Statuses</option>
                            <option value="AVAILABLE">Available</option>
                            <option value="CLAIMED_BY_NGO">Claimed</option>
                            <option value="VOLUNTEER_ASSIGNED">In Transit</option>
                            <option value="DISTRIBUTED">Distributed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white border-2 border-slate-100 rounded-[3rem] overflow-hidden shadow-xl shadow-slate-200/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b-2 border-slate-100">
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Donation Details</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Donor</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pickup Location</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-slate-100">
                                {filteredDonations.map((donation) => (
                                    <tr
                                        key={donation.id}
                                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                        onClick={() => navigate(`/donation/${donation.id}`)}
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center">
                                                <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center font-black text-lg mr-6 group-hover:scale-110 group-hover:bg-primary-600 transition-all">
                                                    <FiPackage size={24} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <div
                                                            className={`flex-shrink-0 inline-flex items-center justify-center p-0.5 border-2 rounded-sm ${donation.foodCategory === 'Non-Veg' ? 'border-rose-500' : 'border-emerald-500'} bg-white`}
                                                            style={{ width: '12px', height: '12px' }}
                                                            title={donation.foodCategory === 'Non-Veg' ? "Non-Vegetarian" : "Vegetarian"}
                                                        >
                                                            <span className={`rounded-full w-1.5 h-1.5 ${donation.foodCategory === 'Non-Veg' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                                        </div>
                                                        <p className="font-black text-black text-lg tracking-tight uppercase group-hover:text-primary-600 transition-colors">{donation.foodType}</p>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-400 mt-1">Vol: {donation.quantity} {donation.unit}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors">{donation.donorName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Platform Donor</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-bold text-slate-600 max-w-[200px] truncate" title={donation.pickupLocation}>
                                                {donation.pickupLocation}
                                            </p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={getStatusBadge(donation.status)}>
                                                {donation.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            {donation.status !== 'CANCELLED' && donation.status !== 'DISTRIBUTED' && (
                                                <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleActionClick(donation, 'flag');
                                                        }}
                                                        className="w-12 h-12 rounded-2xl bg-slate-100 text-primary-600 flex items-center justify-center border-2 border-transparent hover:border-primary-600 transition-all"
                                                        title="Flag Donation"
                                                    >
                                                        <FiFlag size={20} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleActionClick(donation, 'cancel');
                                                        }}
                                                        className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                                                        title="Cancel Donation"
                                                    >
                                                        <FiTrash2 size={20} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedDonation && actionType && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-12 relative overflow-hidden text-center">
                        <div className={`w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center mb-8 border-4 ${actionType === 'cancel' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-primary-50 border-primary-100 text-primary-600'}`}>
                            {actionType === 'cancel' ? <FiTrash2 size={40} /> : <FiFlag size={40} />}
                        </div>
                        <h3 className="text-3xl font-black text-black tracking-tighter uppercase mb-4">
                            {actionType === 'cancel' ? 'Confirm Cancellation?' : 'Flag Donation?'}
                        </h3>
                        <p className="text-slate-500 font-bold mb-10 leading-relaxed">
                            Change the status for <span className="text-black">{selectedDonation.foodType}</span>.
                            This action cannot be undone.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={closeModal}
                                className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-sans"
                            >
                                No, Keep it
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={actionLoading}
                                className={`px-8 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl font-sans
                                    ${actionType === 'cancel' ? 'bg-red-600' : 'bg-black'}`}
                            >
                                {actionLoading ? 'Saving...' : 'Yes, Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDonations;
