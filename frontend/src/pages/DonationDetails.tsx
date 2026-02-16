import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Donation } from '../types';
import {
    FiArrowLeft, FiMapPin, FiClock, FiCalendar, FiPackage,
    FiCheckCircle, FiTruck, FiUser, FiXCircle, FiImage
} from 'react-icons/fi';

const DonationDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [donation, setDonation] = useState<Donation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            AVAILABLE: 'Available',
            CLAIMED_BY_NGO: 'Claimed by NGO',
            VOLUNTEER_ASSIGNED: 'Assigned to Volunteer',
            PICKED_UP: 'Picked Up',
            DISTRIBUTED: 'Distributed',
            CANCELLED: 'Cancelled'
        };
        return labels[status] || status;
    };

    useEffect(() => {
        const fetchDonationDetails = async () => {
            if (!id) return;
            try {
                const data = await api.getDonationById(id);
                if (data) {
                    setDonation(data);
                } else {
                    setError('Donation not found.');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load donation details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDonationDetails();
    }, [id]);

    const handleCancel = async () => {
        if (!donation) return;
        const action = donation.status === 'AVAILABLE' ? 'delete' : 'cancel';
        const confirm = window.confirm(`Are you sure you want to ${action} this donation? This action cannot be undone.`);
        if (confirm) {
            try {
                await api.deleteDonation(donation.id);
                if (donation.status === 'AVAILABLE') {
                    alert('Donation deleted successfully.');
                    navigate('/donor/history');
                } else {
                    setDonation(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
                    alert('Donation cancelled successfully.');
                }
            } catch (err) {
                console.error(err);
                alert(`Failed to ${action} donation.`);
            }
        }
    };

    const handleClaim = async () => {
        if (!donation || !user) return;
        try {
            if (user.role === 'volunteer') {
                // For broadcasted tasks, volunteers use acceptTask API which iterates through VolunteerTask
                await api.acceptTask('', donation.id);
                navigate('/volunteer/dashboard');
            } else if (user.role === 'ngo') {
                await api.claimDonation(donation.id, user.id, user.name);
                navigate('/ngo/claimed');
            }
        } catch (err) {
            console.error(err);
            const message = (err as any).response?.data?.message || 'Failed to claim donation.';
            alert(message);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'CLAIMED_BY_NGO': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'VOLUNTEER_ASSIGNED': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'PICKED_UP': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'DISTRIBUTED': return 'bg-green-100 text-green-800 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '---';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    };

    const handlePickup = async () => {
        if (!donation) return;
        try {
            await api.pickupDonation(donation.id);
            setDonation(prev => prev ? { ...prev, status: 'PICKED_UP' } : null);
        } catch (err) {
            console.error(err);
            alert('Failed to mark as picked up.');
        }
    };

    const handleDistribute = async (proofImages?: string[]) => {
        if (!donation) return;
        try {
            await api.completeDonation(donation.id, proofImages);
            setDonation(prev => prev ? {
                ...prev,
                status: 'DISTRIBUTED',
                completedAt: new Date().toISOString(),
                distributionProofImages: proofImages
            } : null);
        } catch (err) {
            console.error(err);
            alert('Failed to mark as distributed.');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
    );

    if (error || !donation) return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 py-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiXCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Donation Not Found</h2>
                <p className="text-slate-600 mb-6">{error || "We couldn't find the donation you're looking for."}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    Go Back
                </button>
            </div>
        </div>
    );

    const steps = [
        { key: 'AVAILABLE', label: 'Posted', icon: FiPackage, date: donation.createdAt },
        { key: 'CLAIMED_BY_NGO', label: 'Claimed', icon: FiCheckCircle, date: donation.claimedAt },
        { key: 'VOLUNTEER_ASSIGNED', label: 'Assigned', icon: FiUser, date: undefined },
        { key: 'PICKED_UP', label: 'Picked Up', icon: FiTruck, date: undefined },
        { key: 'DISTRIBUTED', label: 'Distributed', icon: FiCheckCircle, date: donation.completedAt },
    ];

    // Determine current step index for tracking
    let currentStepIndex = -1;
    if (donation.status === 'CANCELLED') currentStepIndex = -1;
    else if (donation.status === 'DISTRIBUTED') currentStepIndex = 4;
    else if (donation.status === 'PICKED_UP') currentStepIndex = 3;
    else if (donation.status === 'VOLUNTEER_ASSIGNED') currentStepIndex = 2;
    else if (donation.status === 'CLAIMED_BY_NGO') currentStepIndex = 1;
    else currentStepIndex = 0;

    const canCancel = (user?.id === donation.donorId || (user as any)?._id === donation.donorId) && ['AVAILABLE', 'CLAIMED_BY_NGO', 'VOLUNTEER_ASSIGNED'].includes(donation.status);
    const canClaim = (user?.role === 'volunteer' || user?.role === 'ngo') && donation.status === 'AVAILABLE';

    // Pickup actions: 
    // 1. Volunteer: 'VOLUNTEER_ASSIGNED' -> 'PICKED_UP'
    // 2. NGO: 'CLAIMED_BY_NGO' OR 'VOLUNTEER_ASSIGNED' -> 'PICKED_UP' (if they want to handle it themselves)
    const canPickup = (user?.role === 'volunteer' && donation.status === 'VOLUNTEER_ASSIGNED' && (donation.volunteerId === user.id || (donation.volunteerId as any) === (user as any)?._id)) ||
        (user?.role === 'ngo' && (donation.status === 'CLAIMED_BY_NGO' || donation.status === 'VOLUNTEER_ASSIGNED') && (donation.claimedBy === user.id || donation.claimedBy === (user as any)?._id));

    // NGO/Volunteer actions: 'PICKED_UP' -> 'DISTRIBUTED' (or 'CLAIMED_BY_NGO'/'VOLUNTEER_ASSIGNED' -> 'DISTRIBUTED' if no pickup step used)
    const canDistribute = (user?.role === 'ngo' && (donation.status === 'CLAIMED_BY_NGO' || donation.status === 'VOLUNTEER_ASSIGNED' || donation.status === 'PICKED_UP') && (donation.claimedBy === user.id || donation.claimedBy === (user as any)?._id)) ||
        (user?.role === 'volunteer' && donation.status === 'PICKED_UP' && (donation.volunteerId === user.id || (donation.volunteerId as any) === (user as any)?._id));

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-600 hover:text-primary-600 transition-colors mb-6 font-medium group"
                >
                    <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Main Info */}
                    <div className="lg:col-span-2 space-y-6 animate-slide-up">

                        {/* 1. Overview Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 mb-2">{donation.foodType}</h1>
                                    <div className="flex items-center text-sm text-slate-500 font-mono bg-slate-100 w-fit px-2 py-1 rounded">
                                        ID: {donation.id}
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(donation.status)}`}>
                                    {getStatusLabel(donation.status)}
                                </span>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mr-3">
                                            <FiPackage className="text-orange-600 w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Quantity</p>
                                            <p className="font-semibold text-slate-900">{donation.quantity} {donation.unit}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mr-3">
                                            <FiCalendar className="text-blue-600 w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Posted On</p>
                                            <p className="font-semibold text-slate-900">{formatDate(donation.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mr-3">
                                            <FiClock className="text-red-600 w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Expires On</p>
                                            <p className="font-semibold text-slate-900">{formatDate(donation.expiryDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mr-3">
                                            <FiMapPin className="text-green-600 w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Pickup Location</p>
                                            <p className="font-semibold text-slate-900 line-clamp-2" title={donation.pickupLocation}>{donation.pickupLocation}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {donation.description && (
                                <div className="px-6 pb-6 pt-0">
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-700 mb-2">Description</h3>
                                        <p className="text-slate-600 text-sm">
                                            {donation.description}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Timeline Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
                            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                <FiClock className="mr-2 text-primary-600" /> Donation Timeline
                            </h2>
                            {donation.status === 'CANCELLED' ? (
                                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center justify-center border border-red-100">
                                    <FiXCircle className="mr-2 w-5 h-5" />
                                    <span className="font-medium">This donation has been cancelled.</span>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Connecting Line */}
                                    <div className="absolute left-6 top-6 bottom-6 w-1 bg-slate-100 -z-0"></div>

                                    <div className="space-y-8 relative z-10">
                                        {steps.map((step, index) => {
                                            const isCompleted = index <= currentStepIndex;
                                            const isCurrent = index === currentStepIndex;

                                            return (
                                                <div key={step.key} className={`flex items-start ${isCompleted ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 flex-shrink-0 transition-all ${isCompleted ? 'bg-primary-50 border-primary-500 text-primary-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                                                        } ${isCurrent ? 'ring-4 ring-primary-100 scale-110' : ''}`}>
                                                        <step.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="ml-4 pt-2">
                                                        <p className={`font-bold ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                                                            {step.label}
                                                        </p>
                                                        {step.date ? (
                                                            <p className="text-sm text-slate-500 mt-1">{formatDate(step.date)}</p>
                                                        ) : (
                                                            isCurrent ? <p className="text-xs text-primary-600 font-medium mt-1 animate-pulse">In Progress...</p> : null
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Image Section (Optional) */}
                        {(donation.imageUrls && donation.imageUrls.length > 0) ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                    <FiImage className="mr-2 text-primary-600" /> Food Images
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {donation.imageUrls.map((url, idx) => (
                                        <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 aspect-video">
                                            <img src={url} alt={`Food ${idx + 1}`} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : donation.imageUrl ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                    <FiImage className="mr-2 text-primary-600" /> Food Image
                                </h2>
                                <div className="rounded-xl overflow-hidden border border-slate-200">
                                    <img src={donation.imageUrl} alt="Food" className="w-full h-64 object-cover" />
                                </div>
                            </div>
                        ) : null}

                        {/* 4. Distribution Proof Section */}
                        {donation.status === 'DISTRIBUTED' && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-green-500">
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                    <FiCheckCircle className="mr-2 text-green-600" /> Distribution Proof
                                </h2>
                                <p className="text-sm text-slate-600 mb-4">
                                    The following evidence confirms that the food has been successfully distributed to the beneficiaries.
                                </p>
                                {donation.distributionProofImages && donation.distributionProofImages.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {donation.distributionProofImages.map((url, idx) => (
                                            <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 aspect-video group relative">
                                                <img src={url} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="bg-white/90 text-green-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Verified Delivery</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-lg p-8 text-center border border-dashed border-slate-200">
                                        <FiImage className="mx-auto text-slate-300 w-12 h-12 mb-2" />
                                        <p className="text-slate-500 text-sm">No proof images were uploaded for this distribution.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Side Details */}
                    <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>

                        {/* 4. Donor / Claimer Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                <FiUser className="mr-2 text-primary-600" />
                                {donation.donorId === user?.id ? 'My Donation' : 'Donor Details'}
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Donor Name</p>
                                    <p className="font-semibold text-slate-900 text-lg">{donation.donorName}</p>
                                </div>
                                {donation.claimedBy && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Accepted By</p>
                                        <p className="font-semibold text-slate-900 text-lg">
                                            {donation.claimedByName || donation.volunteerName || 'Unknown'}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {donation.volunteerId ? '(Volunteer)' : '(NGO)'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 5. Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Actions</h2>

                            <div className="space-y-3">
                                {canCancel && (
                                    <button
                                        onClick={handleCancel}
                                        className="w-full py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-semibold border border-red-100 flex items-center justify-center active:scale-[0.98]"
                                    >
                                        <FiXCircle className="mr-2" />
                                        Cancel Donation
                                    </button>
                                )}

                                {canClaim && (
                                    <button
                                        onClick={handleClaim}
                                        className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold shadow-lg shadow-primary-500/20 flex items-center justify-center active:scale-[0.98]"
                                    >
                                        <FiCheckCircle className="mr-2" />
                                        {user?.role === 'ngo' ? 'Claim as NGO' : 'Accept Delivery'}
                                    </button>
                                )}

                                {/* NGO Actions: Claimed/Assigned stage */}
                                {user?.role === 'ngo' && (donation.status === 'CLAIMED_BY_NGO' || donation.status === 'VOLUNTEER_ASSIGNED') && (donation.claimedBy === user.id || (donation.claimedBy as any) === (user as any)?._id) && (
                                    <div className="space-y-3">
                                        <button
                                            onClick={handlePickup}
                                            className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold shadow-lg shadow-primary-500/20 flex items-center justify-center active:scale-[0.98]"
                                        >
                                            <FiTruck className="mr-2" />
                                            Pick Up Myself
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <div className="h-px bg-slate-200 flex-1"></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">OR</span>
                                            <div className="h-px bg-slate-200 flex-1"></div>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                const vName = prompt('Enter Volunteer Name:', 'Volunteer Alpha');
                                                if (vName) {
                                                    try {
                                                        await api.assignVolunteer(donation.id, 'mock-v-1', vName);
                                                        setDonation(prev => prev ? { ...prev, status: 'VOLUNTEER_ASSIGNED', volunteerName: vName } : null);
                                                        alert('Volunteer assigned!');
                                                    } catch (e) { alert('Error assigning volunteer'); }
                                                }
                                            }}
                                            className="w-full py-3 bg-white border border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 transition-all font-semibold flex items-center justify-center active:scale-[0.98]"
                                        >
                                            <FiUser className="mr-2" />
                                            Assign a Volunteer
                                        </button>
                                    </div>
                                )}

                                {/* Volunteer Action: Mark Picked Up */}
                                {canPickup && user?.role === 'volunteer' && (
                                    <button
                                        onClick={handlePickup}
                                        className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center active:scale-[0.98]"
                                    >
                                        <FiTruck className="mr-2" />
                                        Mark as Picked Up
                                    </button>
                                )}

                                {/* NGO Action: Confirm Distribution (Distributed) */}
                                {canDistribute && (
                                    <button
                                        onClick={async () => {
                                            const proof = prompt('Paste Proof Image URL (optional):', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000');
                                            if (proof !== null) {
                                                handleDistribute(proof ? [proof] : []);
                                            }
                                        }}
                                        className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold shadow-lg shadow-green-500/20 flex items-center justify-center active:scale-[0.98]"
                                    >
                                        <FiCheckCircle className="mr-2" />
                                        Confirm Distribution
                                    </button>
                                )}

                                {!canCancel && !canClaim && !canPickup && !canDistribute && (donation.status !== 'CLAIMED_BY_NGO' || user?.role !== 'ngo') && (
                                    <p className="text-center text-slate-500 text-sm py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        No actions available for your role at this stage.
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonationDetails;
