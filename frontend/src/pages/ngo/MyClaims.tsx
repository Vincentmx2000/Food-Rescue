import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';
import type { Donation } from '../../types';
import { FiPackage, FiMapPin, FiClock, FiCheckCircle, FiTruck, FiUser, FiUpload, FiAlertCircle, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const MyClaims: React.FC = () => {
    const { user } = useAuth();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    // Updated state to handle multiple images per donation
    const [previewImages, setPreviewImages] = useState<Record<string, string[]>>({});
    const [proofFiles, setProofFiles] = useState<Record<string, File[]>>({});
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
    const [assignType, setAssignType] = useState<'specific' | 'broadcast'>('specific');
    const [volunteerName, setVolunteerName] = useState('');

    useEffect(() => {
        fetchClaimedDonations();
    }, [user]);

    const fetchClaimedDonations = async () => {
        if (!user) return;
        try {
            const data = await api.getDonations({ claimedBy: user.id });
            data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setDonations(data);
        } catch (err) {
            console.error('Failed to fetch claimed donations', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (donationId: string, newStatus: string) => {
        try {
            if (newStatus === 'DISTRIBUTED') {
                const currentFiles = proofFiles[donationId] || [];
                if (currentFiles.length === 0) {
                    setError('Please upload at least one proof image before confirming distribution.');
                    setTimeout(() => setError(null), 3000);
                    return;
                }

                await api.completeDonation(donationId, currentFiles);
                alert('Distribution confirmed successfully!');
            } else {
                await api.updateDonation(donationId, { status: newStatus as any });
            }
            await fetchClaimedDonations();
        } catch (err: any) {
            console.error('Failed to update status', err);
            const message = err.response?.data?.message || 'Failed to update status. Please try again.';
            alert(message);
        }
    };

    const openAssignModal = (donationId: string) => {
        setSelectedDonationId(donationId);
        setAssignType('specific');
        setVolunteerName('');
        setShowAssignModal(true);
    };

    const closeAssignModal = () => {
        setShowAssignModal(false);
        setSelectedDonationId(null);
    };

    const confirmAssignment = async () => {
        if (!selectedDonationId) return;

        try {
            const vId = assignType === 'broadcast' ? 'broadcast' : '';
            const vName = assignType === 'specific' ? volunteerName : undefined;

            const response = await api.assignVolunteer(selectedDonationId, vId, vName);
            await fetchClaimedDonations();
            alert(response.message || 'Success!');
            closeAssignModal();
        } catch (err: any) {
            console.error('Failed to assign volunteer', err);
            const message = err.response?.data?.message || 'Failed to assign volunteer. Please try again.';
            alert(message);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, donationId: string) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newImageUrls = files.map(file => URL.createObjectURL(file));

            setPreviewImages(prev => ({
                ...prev,
                [donationId]: [...(prev[donationId] || []), ...newImageUrls]
            }));
            setProofFiles(prev => ({
                ...prev,
                [donationId]: [...(prev[donationId] || []), ...files]
            }));
            setError(null);
        }
    };

    const removeImage = (donationId: string, index: number) => {
        setPreviewImages(prev => ({
            ...prev,
            [donationId]: prev[donationId].filter((_, i) => i !== index)
        }));
        setProofFiles(prev => ({
            ...prev,
            [donationId]: prev[donationId].filter((_, i) => i !== index)
        }));
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'AVAILABLE': 'Available',
            'CLAIMED_BY_NGO': 'Claimed by NGO',
            'VOLUNTEER_ASSIGNED': 'Assigned to Volunteer',
            'PICKED_UP': 'Picked Up',
            'DISTRIBUTED': 'Distributed',
            'CANCELLED': 'Cancelled'
        };
        return labels[status] || status;
    };

    const getStatusStep = (status: string) => {
        const steps: Record<string, number> = {
            'CLAIMED_BY_NGO': 1,
            'VOLUNTEER_ASSIGNED': 2,
            'PICKED_UP': 3,
            'DISTRIBUTED': 4
        };
        return steps[status] || 0;
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
        <div className="min-h-screen bg-slate-50 relative">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">My Claims</h1>
                    <p className="text-slate-600">Manage your claimed donations and distribution process</p>
                </div>

                {error && (
                    <div className="fixed top-24 right-4 z-50 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center animate-bounce">
                        <FiAlertCircle className="mr-2" />
                        {error}
                    </div>
                )}

                {donations.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <FiPackage className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-800">No Claims Yet</h3>
                        <p className="text-slate-500 mb-6">Browse available donations to start helping.</p>
                        <Link
                            to="/ngo/browse"
                            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                        >
                            Browse Donations
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {donations.map((donation) => {
                            const currentStep = getStatusStep(donation.status);
                            const images = previewImages[donation.id] || [];

                            return (
                                <div key={donation.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-slide-up">
                                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                                <FiPackage className="text-orange-600 w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{donation.foodType}</h3>
                                                <div className="flex items-center text-sm text-slate-500 gap-4 mt-1">
                                                    <span className="flex items-center"><FiUser className="mr-1" /> {donation.donorName}</span>
                                                    <span className="flex items-center"><FiClock className="mr-1" /> Posted: {new Date(donation.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center w-fit
                                            ${donation.status === 'DISTRIBUTED' ? 'bg-green-100 text-green-800 border-green-200' :
                                                donation.status === 'PICKED_UP' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                                    donation.status === 'VOLUNTEER_ASSIGNED' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                                        'bg-blue-100 text-blue-800 border-blue-200'}`}>
                                            {donation.status === 'DISTRIBUTED' ? <FiCheckCircle className="mr-1.5" /> :
                                                donation.status === 'PICKED_UP' ? <FiTruck className="mr-1.5" /> :
                                                    <FiClock className="mr-1.5" />}
                                            {getStatusLabel(donation.status)}
                                        </div>
                                    </div>

                                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div className="p-3 bg-slate-50 rounded-lg">
                                                    <p className="text-slate-500 text-xs font-semibold uppercase mb-1">Pickup Location</p>
                                                    <p className="text-slate-800 font-medium flex items-start">
                                                        <FiMapPin className="mt-0.5 mr-1.5 text-slate-400 flex-shrink-0" />
                                                        {donation.pickupLocation}
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg">
                                                    <p className="text-slate-500 text-xs font-semibold uppercase mb-1">Quantity</p>
                                                    <p className="text-slate-800 font-medium">{donation.quantity} {donation.unit}</p>
                                                </div>
                                            </div>

                                            {donation.volunteerName && (
                                                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-sm">
                                                    <p className="text-purple-600 text-xs font-semibold uppercase mb-1">Assigned Volunteer</p>
                                                    <p className="text-purple-900 font-bold flex items-center">
                                                        <FiUser className="mr-1.5" /> {donation.volunteerName}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-6 pt-4 border-t border-slate-100">
                                                <div className="relative flex items-center justify-between w-full max-w-md">
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10"></div>
                                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 transition-all duration-500 -z-10`}
                                                        style={{ width: `${(currentStep - 1) / 3 * 100}%` }}></div>

                                                    {['Claimed', 'Assigned', 'Picked Up', 'Distributed'].map((step, idx) => {
                                                        const stepNum = idx + 1;
                                                        const isCompleted = currentStep >= stepNum;
                                                        const isCurrent = currentStep === stepNum;

                                                        return (
                                                            <div key={step} className="flex flex-col items-center">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 
                                                                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 text-slate-300'}
                                                                    ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}`}>
                                                                    {isCompleted ? <FiCheckCircle /> : idx + 1}
                                                                </div>
                                                                <span className={`text-xs font-medium mt-2 transition-colors duration-300 ${isCompleted ? 'text-green-700' : 'text-slate-400'}`}>
                                                                    {step}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col justify-center">
                                            {(donation.status === 'CLAIMED_BY_NGO' || donation.status === 'VOLUNTEER_ASSIGNED') && (
                                                <div className="text-center space-y-4">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 mb-2">Handle Pickup</h4>
                                                        <p className="text-xs text-slate-500 mb-4">You can either pick up the donation yourself or assign a volunteer to help.</p>

                                                        <div className="flex flex-col gap-3">
                                                            <button
                                                                onClick={() => handleStatusUpdate(donation.id, 'PICKED_UP')}
                                                                className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-all shadow-md flex items-center justify-center group"
                                                            >
                                                                <FiTruck className="mr-2 group-hover:translate-x-1 transition-transform" />
                                                                I'll Pick it Up Myself
                                                            </button>

                                                            <div className="flex items-center gap-2">
                                                                <div className="h-px bg-slate-200 flex-1"></div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">OR</span>
                                                                <div className="h-px bg-slate-200 flex-1"></div>
                                                            </div>

                                                            <button
                                                                onClick={() => openAssignModal(donation.id)}
                                                                className="w-full py-2 bg-white border border-purple-200 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center justify-center"
                                                            >
                                                                <FiUser className="mr-2" />
                                                                Assign a Volunteer
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {donation.status === 'PICKED_UP' && (
                                                <div className="text-center">
                                                    <h4 className="font-bold text-slate-800 mb-2">Confirm Distribution</h4>
                                                    <p className="text-xs text-slate-500 mb-4">Upload proof images of the distribution to complete the process.</p>

                                                    <div className="mb-4">
                                                        <input
                                                            type="file"
                                                            id={`proof-${donation.id}`}
                                                            className="hidden"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={(e) => handleImageChange(e, donation.id)}
                                                        />
                                                        {images.length > 0 && (
                                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                                {images.map((img, idx) => (
                                                                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-300 h-20">
                                                                        <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                                                                        <button
                                                                            onClick={() => removeImage(donation.id, idx)}
                                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <FiX className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <label
                                                            htmlFor={`proof-${donation.id}`}
                                                            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                                                        >
                                                            <FiUpload className="w-6 h-6 text-slate-400 mb-1" />
                                                            <span className="text-xs text-slate-500">
                                                                {images.length > 0 ? 'Add More Images' : 'Upload Proof Images'}
                                                            </span>
                                                        </label>
                                                    </div>

                                                    <button
                                                        onClick={() => handleStatusUpdate(donation.id, 'DISTRIBUTED')}
                                                        className={`w-full py-3 rounded-lg font-bold transition-all shadow-lg flex items-center justify-center 
                                                            ${images.length > 0 ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                                                        disabled={images.length === 0}
                                                    >
                                                        <FiCheckCircle className="mr-2" />
                                                        Confirm Distribution
                                                    </button>
                                                </div>
                                            )}

                                            {donation.status === 'DISTRIBUTED' && (
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <FiCheckCircle className="w-8 h-8" />
                                                    </div>
                                                    <h4 className="font-bold text-green-800 mb-1">Distributed</h4>
                                                    <p className="text-xs text-green-600">Successfully delivered to the community.</p>
                                                    {donation.distributionProofImages && donation.distributionProofImages.length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-green-100 grid grid-cols-2 gap-2">
                                                            {donation.distributionProofImages.map((url, idx) => (
                                                                <img key={idx} src={url} alt={`Proof ${idx + 1}`} className="w-full h-16 object-cover rounded-lg" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {donation.status === 'VOLUNTEER_ASSIGNED' && (
                                                <div className="text-center py-6">
                                                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <FiTruck className="w-6 h-6 animate-pulse" />
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 mb-1">Awaiting Pickup</h4>
                                                    <p className="text-xs text-slate-500 mb-4">Volunteer {donation.volunteerName} is assigned, but you can still pick it up yourself.</p>
                                                    <button
                                                        onClick={() => handleStatusUpdate(donation.id, 'PICKED_UP')}
                                                        className="w-full py-2 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold hover:bg-primary-100 transition-colors"
                                                    >
                                                        Pick Up Instead
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Assignment Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Assign Volunteer</h3>
                            <button onClick={closeAssignModal} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                                <FiX className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <label className="flex items-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <input
                                    type="radio"
                                    name="assignType"
                                    value="specific"
                                    checked={assignType === 'specific'}
                                    onChange={() => setAssignType('specific')}
                                    className="w-5 h-5 text-primary-600 border-slate-300 focus:ring-primary-500"
                                />
                                <div className="ml-3">
                                    <span className="block font-medium text-slate-900">Assign Specific Volunteer</span>
                                    <span className="block text-sm text-slate-500">Enter name or email of a volunteer</span>
                                </div>
                            </label>

                            {assignType === 'specific' && (
                                <div className="pl-8 animate-fade-in">
                                    <input
                                        type="text"
                                        placeholder="Volunteer Name"
                                        value={volunteerName}
                                        onChange={(e) => setVolunteerName(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        autoFocus
                                    />
                                </div>
                            )}

                            <label className="flex items-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <input
                                    type="radio"
                                    name="assignType"
                                    value="broadcast"
                                    checked={assignType === 'broadcast'}
                                    onChange={() => setAssignType('broadcast')}
                                    className="w-5 h-5 text-primary-600 border-slate-300 focus:ring-primary-500"
                                />
                                <div className="ml-3">
                                    <span className="block font-medium text-slate-900">Broadcast to All Volunteers</span>
                                    <span className="block text-sm text-slate-500">Task will be visible to all nearby volunteers</span>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={closeAssignModal}
                                className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAssignment}
                                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                            >
                                Confirm Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyClaims;
