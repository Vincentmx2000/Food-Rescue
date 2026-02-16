import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';
import type { Donation } from '../../types';
import { FiPackage, FiSearch, FiTrash2, FiFlag } from 'react-icons/fi';

const AdminDonations: React.FC = () => {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Modal State
    const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
    const [actionType, setActionType] = useState<'cancel' | 'flag' | null>(null);
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

    const handleActionClick = (donation: Donation, type: 'cancel' | 'flag') => {
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
                // Flagging logic (mock) - ideally adds a flagged field
                // For now, we'll just demonstrate the action
                console.log('Flagging donation:', selectedDonation.id);
                // simulate API delay
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Refresh local state
            await fetchDonations();

            closeModal();
        } catch (error) {
            console.error(`Failed to ${actionType} donation`, error);
            alert(`Failed to ${actionType} donation`);
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

    const getStatusBadge = (status: string) => {
        const styles = {
            'AVAILABLE': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'CLAIMED_BY_NGO': 'bg-blue-100 text-blue-800 border-blue-200',
            'VOLUNTEER_ASSIGNED': 'bg-purple-100 text-purple-800 border-purple-200',
            'PICKED_UP': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'DISTRIBUTED': 'bg-green-100 text-green-800 border-green-200',
            'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        <FiPackage className="mr-3" /> Donation Management
                    </h1>
                    <p className="text-slate-600 ml-11">Oversee and moderate all donations</p>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search food, donor, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white min-w-[150px]"
                        >
                            <option value="all">All Status</option>
                            <option value="AVAILABLE">Available</option>
                            <option value="CLAIMED_BY_NGO">Claimed by NGO</option>
                            <option value="VOLUNTEER_ASSIGNED">Assigned</option>
                            <option value="PICKED_UP">Picked Up</option>
                            <option value="DISTRIBUTED">Distributed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Food Item</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Donor</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Location</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Posted</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDonations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No donations found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDonations.map((donation) => (
                                        <tr key={donation.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{donation.foodType}</p>
                                                    <p className="text-xs text-slate-500">{donation.quantity} {donation.unit}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-900">{donation.donorName}</p>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs truncate" title={donation.pickupLocation}>
                                                {donation.pickupLocation}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(donation.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${getStatusBadge(donation.status)}`}>
                                                    {donation.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {donation.status !== 'CANCELLED' && donation.status !== 'DISTRIBUTED' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleActionClick(donation, 'flag')}
                                                            className="text-slate-400 hover:text-orange-500 transition-colors p-1"
                                                            title="Flag as Inappropriate"
                                                        >
                                                            <FiFlag />
                                                        </button>
                                                        <button
                                                            onClick={() => handleActionClick(donation, 'cancel')}
                                                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                                            title="Cancel Donation"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {selectedDonation && actionType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
                        <div className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full mb-4 ${actionType === 'cancel' ? 'bg-red-100' : 'bg-orange-100'}`}>
                            {actionType === 'cancel' ? (
                                <FiTrash2 className="w-6 h-6 text-red-600" />
                            ) : (
                                <FiFlag className="w-6 h-6 text-orange-600" />
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                            {actionType === 'cancel' ? 'Cancel Donation?' : 'Flag Donation?'}
                        </h3>
                        <p className="text-center text-slate-600 mb-6">
                            Are you sure you want to {actionType} this donation:<br />
                            <strong>"{selectedDonation.foodType}"</strong> by {selectedDonation.donorName}?
                            {actionType === 'cancel' && <span className="block mt-2 text-xs text-red-500">This action cannot be undone.</span>}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Not Now
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={actionLoading}
                                className={`px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center justify-center
                                    ${actionType === 'cancel'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-orange-500 hover:bg-orange-600'}`}
                            >
                                {actionLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    actionType === 'cancel' ? 'Yes, Cancel It' : 'Yes, Flag It'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDonations;
