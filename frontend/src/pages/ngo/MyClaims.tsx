import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';
import type { Donation } from '../../types';
import { FiPackage, FiTruck, FiUpload, FiX, FiMaximize } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import DonationCard from '../../components/DonationCard';
import FeedbackModal from '../../components/FeedbackModal';

const MyClaims: React.FC = () => {
    const { user } = useAuth();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [proofFiles, setProofFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Modal States
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDistributionModal, setShowDistributionModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
    const [assignType, setAssignType] = useState<'specific' | 'broadcast'>('specific');
    const [volunteerName, setVolunteerName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

    const handlePickupMyself = async (donationId: string) => {
        setIsProcessing(true);
        try {
            await api.updateDonation(donationId, { status: 'PICKED_UP' as any });
            await fetchClaimedDonations();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update status');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStatusUpdate = async (donationId: string, newStatus: string) => {
        if (newStatus === 'DISTRIBUTED') {
            setSelectedDonationId(donationId);
            setProofFiles([]);
            setPreviewImages([]);
            setShowDistributionModal(true);
            return;
        }

        try {
            await api.updateDonation(donationId, { status: newStatus as any });
            await fetchClaimedDonations();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const openAssignModal = (donationId: string) => {
        setSelectedDonationId(donationId);
        setAssignType('specific');
        setVolunteerName('');
        setShowAssignModal(true);
    };

    const closeModals = () => {
        setShowAssignModal(false);
        setShowDistributionModal(false);
        setSelectedDonationId(null);
    };

    const confirmAssignment = async () => {
        if (!selectedDonationId) return;
        setIsProcessing(true);

        try {
            const vId = assignType === 'broadcast' ? 'broadcast' : '';
            const vName = assignType === 'specific' ? volunteerName : undefined;

            await api.assignVolunteer(selectedDonationId, vId, vName);
            await fetchClaimedDonations();
            closeModals();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to assign volunteer');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmDistribution = async () => {
        if (!selectedDonationId || proofFiles.length === 0) {
            setError('Please upload at least one proof image.');
            return;
        }
        setIsProcessing(true);

        try {
            await api.completeDonation(selectedDonationId, proofFiles);
            await fetchClaimedDonations();
            closeModals();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to confirm distribution');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newImageUrls = files.map(file => URL.createObjectURL(file));

            setPreviewImages(prev => [...prev, ...newImageUrls]);
            setProofFiles(prev => [...prev, ...files]);
            setError(null);
        }
    };

    const removeImage = (index: number) => {
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        setProofFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 animate-fade-in">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tight">Active Claims</h1>
                        <p className="text-xl text-slate-500 font-medium tracking-tight">Track and manage your community impact initiatives.</p>
                    </div>

                    <div className="flex bg-white/50 backdrop-blur-xl p-2 rounded-[2rem] border border-white shadow-xl">
                        <Link
                            to="/ngo/browse"
                            className="px-8 py-3 bg-primary-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.15em] text-[10px] shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center"
                        >
                            <FiPackage className="mr-2" size={14} /> New Rescue
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
                    </div>
                ) : donations.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                        <FiPackage className="w-24 h-24 text-slate-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">No active claims</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">You haven't claimed any donations yet. Start by browsing available food rescues.</p>
                        <Link
                            to="/ngo/browse"
                            className="text-primary-600 font-black text-sm uppercase tracking-widest hover:text-primary-800 transition-colors"
                        >
                            Browse Donations
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {donations.map((donation) => {
                            let action = undefined;

                            if (donation.status === 'CLAIMED_BY_NGO' || donation.status === 'VOLUNTEER_ASSIGNED') {
                                action = {
                                    label: 'Handle Pickup',
                                    onClick: () => openAssignModal(donation.id)
                                };
                            } else if (donation.status === 'PICKED_UP') {
                                action = {
                                    label: 'Confirm Distribution',
                                    onClick: () => handleStatusUpdate(donation.id, 'DISTRIBUTED'),
                                    variant: 'primary' as const
                                };
                            } else if (donation.status === 'DISTRIBUTED') {
                                action = {
                                    label: 'Give Feedback',
                                    onClick: () => {
                                        setSelectedDonationId(donation.id);
                                        setShowFeedbackModal(true);
                                    },
                                    variant: 'secondary' as const
                                };
                            }

                            return (
                                <DonationCard
                                    key={donation.id}
                                    donation={donation}
                                    linkTo={`/donation/${donation.id}`}
                                    action={action}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <FeedbackModal
                donationId={selectedDonationId || ''}
                isOpen={showFeedbackModal}
                onClose={() => {
                    setShowFeedbackModal(false);
                    setSelectedDonationId(null);
                }}
                onSuccess={() => {
                    fetchClaimedDonations();
                }}
            />

            {/* Assignment Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-10 transform transition-all border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Handle Pickup</h3>
                            <button onClick={closeModals} className="p-3 rounded-full hover:bg-slate-100 transition-colors">
                                <FiX className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <button
                                onClick={() => handlePickupMyself(selectedDonationId!)}
                                disabled={isProcessing}
                                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl hover:border-primary-500 hover:bg-primary-50/30 transition-all flex items-center group disabled:opacity-50"
                            >
                                <div className="p-4 bg-white rounded-2xl shadow-sm text-primary-600 mr-4 group-hover:scale-110 transition-transform">
                                    <FiTruck size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="block font-black text-slate-800 text-sm uppercase tracking-wider">Pick up Myself</span>
                                    <span className="block text-xs text-slate-400 font-medium">I will go to the location personally</span>
                                </div>
                            </button>

                            <div className="flex items-center space-x-4 py-2">
                                <div className="h-px bg-slate-100 flex-1"></div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">or assign someone</span>
                                <div className="h-px bg-slate-100 flex-1"></div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        checked={assignType === 'specific'}
                                        onChange={() => setAssignType('specific')}
                                        className="w-5 h-5 text-primary-600"
                                    />
                                    <span className="ml-3 font-bold text-slate-700">Specific Volunteer</span>
                                </label>

                                {assignType === 'specific' && (
                                    <input
                                        type="text"
                                        placeholder="Enter Name"
                                        value={volunteerName}
                                        onChange={(e) => setVolunteerName(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold"
                                        autoFocus
                                    />
                                )}

                                <label className="flex items-center p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        checked={assignType === 'broadcast'}
                                        onChange={() => setAssignType('broadcast')}
                                        className="w-5 h-5 text-primary-600"
                                    />
                                    <span className="ml-3 font-bold text-slate-700">Broadcast to Networks</span>
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={confirmAssignment}
                            disabled={isProcessing || (assignType === 'specific' && !volunteerName)}
                            className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary-500/40 hover:bg-primary-700 transition-all flex items-center justify-center disabled:opacity-50"
                        >
                            {isProcessing ? 'Processing...' : 'Confirm Assignment'}
                        </button>
                    </div>
                </div>
            )}

            {/* Distribution Modal */}
            {showDistributionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-10 transform transition-all border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Proof of Impact</h3>
                            <button onClick={closeModals} className="p-3 rounded-full hover:bg-slate-100 transition-colors">
                                <FiX className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <p className="text-slate-500 mb-8 font-medium">Upload photos showing the distribution of these resources to confirm completion.</p>

                        <div className="mb-8">
                            <input
                                type="file"
                                id="proof-upload"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                            />

                            {previewImages.length > 0 && (
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {previewImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="relative group rounded-3xl overflow-hidden aspect-square border-2 border-slate-100 shadow-xl cursor-zoom-in"
                                            onClick={() => setSelectedImage(img)}
                                        >
                                            <img
                                                src={img}
                                                alt="Proof"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                                            />
                                            <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                                                    <FiMaximize size={20} />
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage(idx);
                                                }}
                                                className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                            >
                                                <FiX size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <label
                                htmlFor="proof-upload"
                                className="flex flex-col items-center justify-center w-full h-40 border-4 border-dashed border-slate-100 rounded-[3rem] cursor-pointer hover:bg-slate-50 hover:border-primary-200 transition-all group"
                            >
                                <div className="p-4 bg-primary-50 rounded-2xl text-primary-600 mb-3 group-hover:scale-110 transition-transform">
                                    <FiUpload size={24} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Upload Photos</span>
                            </label>
                        </div>

                        {error && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center mb-6">{error}</p>}

                        <button
                            onClick={handleConfirmDistribution}
                            disabled={isProcessing || previewImages.length === 0}
                            className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary-500/40 hover:bg-primary-700 transition-all flex items-center justify-center disabled:opacity-50"
                        >
                            {isProcessing ? 'Saving Mission...' : 'Complete Mission'}
                        </button>
                    </div>
                </div>
            )}

            {/* Full Image Viewer Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors bg-white/10 p-4 rounded-full backdrop-blur-md"
                        onClick={() => setSelectedImage(null)}
                    >
                        <FiX size={32} />
                    </button>

                    <img
                        src={selectedImage}
                        alt="Full View"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-zoom-in"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default MyClaims;
