import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import {
    FiArrowLeft, FiMapPin, FiClock, FiPackage,
    FiCheckCircle, FiTruck, FiUser, FiXCircle, FiUpload, FiX, FiPhone, FiMail, FiMaximize, FiCamera
} from 'react-icons/fi';

const DonationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [donation, setDonation] = useState(null);
    const isDonor = user?.id === donation?.donorId || user?.id === donation?.donorId?._id || user?.id === donation?.donorId?.id;
    const canManageProof = (user?.role === 'ngo' && donation?.claimedBy === user?.id) || (user?.role === 'volunteer' && donation?.volunteerId === user?.id);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal States
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDistributionModal, setShowDistributionModal] = useState(false);
    const [assignType, setAssignType] = useState('specific');
    const [volunteerName, setVolunteerName] = useState('');
    const [proofFiles, setProofFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [modalError, setModalError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        foodType: '',
        quantity: '',
        unit: 'servings',
        expiryDate: '',
        description: '',
        pickupLocation: '',
        latitude: null,
        longitude: null
    });

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
        const confirm = window.confirm(`Are you sure you want to cancel this donation?`);
        if (confirm) {
            try {
                await api.deleteDonation(donation.id);
                alert('Success!');
                navigate(-1);
            } catch (err) {
                alert(`Failed to cancel.`);
            }
        }
    };

    const handleClaim = async () => {
        if (!donation || !user) return;
        try {
            if (user.role === 'ngo') {
                if (!user.isVerified) {
                    alert('Your organization account is not yet verified by Admin. You cannot claim food until verified.');
                    return;
                }
                await api.claimDonation(donation.id, user.id, user.name);
                const updated = await api.getDonationById(donation.id);
                setDonation(updated);
            }
        } catch (err) {
            alert('Failed to claim.');
        }
    };

    const handlePickup = async () => {
        if (!donation) return;
        setIsProcessing(true);
        try {
            await api.pickupDonation(donation.id);
            const updated = await api.getDonationById(donation.id);
            setDonation(updated);
            alert('Donation picked up successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePickupMyself = async () => {
        if (!donation) return;
        setIsProcessing(true);
        try {
            await api.updateDonation(donation.id, { status: 'PICKED_UP' });
            const updated = await api.getDonationById(donation.id);
            setDonation(updated);
            setShowAssignModal(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmAssignment = async () => {
        if (!donation) return;
        setIsProcessing(true);
        setModalError(null);

        try {
            const vId = assignType === 'broadcast' ? 'broadcast' : '';
            const vName = assignType === 'specific' ? volunteerName : undefined;

            await api.assignVolunteer(donation.id, vId, vName);
            const updated = await api.getDonationById(donation.id);
            setDonation(updated);
            setShowAssignModal(false);
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to assign volunteer');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmDistribution = async () => {
        if (!donation || previewImages.length === 0) {
            setModalError('Please upload at least one proof image.');
            return;
        }
        setIsProcessing(true);
        setModalError(null);

        try {
            const existingKeep = previewImages.filter(img => !img.startsWith('blob:'));

            await api.completeDonation(donation.id, proofFiles, undefined, existingKeep);
            const updated = await api.getDonationById(donation.id);
            setDonation(updated);
            setShowDistributionModal(false);
            alert('Mission completion documents updated successfully!');
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to confirm distribution');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newImageUrls = files.map(file => URL.createObjectURL(file));

            setPreviewImages(prev => [...prev, ...newImageUrls]);
            setProofFiles(prev => [...prev, ...files]);
            setModalError(null);
        }
    };

    const removeImage = (index) => {
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        setProofFiles(prev => prev.filter((_, i) => i !== index));
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CLAIMED_BY_NGO': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'VOLUNTEER_ASSIGNED': return 'bg-violet-100 text-violet-700 border-violet-200';
            case 'PICKED_UP': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'DISTRIBUTED': return 'bg-primary-100 text-primary-700 border-primary-200';
            case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const handleOpenEditModal = () => {
        if (!donation) return;
        setEditFormData({
            foodType: donation.foodType,
            quantity: donation.quantity.toString(),
            unit: donation.unit,
            expiryDate: new Date(donation.expiryDate).toISOString().slice(0, 16),
            description: donation.description || '',
            pickupLocation: donation.pickupLocation,
            latitude: donation.location?.coordinates[1] || null,
            longitude: donation.location?.coordinates[0] || null
        });
        setPreviewImages(donation.imageUrls || []);
        setProofFiles([]);
        setShowEditModal(true);
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
        </div>
    );

    if (error || !donation) return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-xl mx-auto px-4 py-24 text-center">
                <FiXCircle className="w-24 h-24 text-rose-200 mx-auto mb-8" />
                <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Mission Not Found</h2>
                <p className="text-xl text-slate-500 mb-12 font-medium">{error || "We couldn't find the details for this rescue mission."}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary-500/30 hover:bg-primary-700 transition-all"
                >
                    Return to Safety
                </button>
            </div>
        </div>
    );

    const steps = [
        {
            key: 'AVAILABLE',
            label: 'Mission Posted',
            icon: FiPackage,
            date: donation.createdAt,
            subLabel: `By ${donation.donorName}`
        },
        {
            key: 'CLAIMED_BY_NGO',
            label: 'Claimed by NGO',
            icon: FiCheckCircle,
            date: donation.claimedAt,
            subLabel: donation.claimedByName ? `By ${donation.claimedByName}` : undefined
        },
        ...(donation.volunteerId ? [{
            key: 'VOLUNTEER_ASSIGNED',
            label: 'Rescuer Assigned',
            icon: FiUser,
            date: donation.volunteerAssignedAt,
            subLabel: `By ${donation.volunteerName}`
        }] : []),
        {
            key: 'PICKED_UP',
            label: 'Resources Collected',
            icon: FiTruck,
            date: donation.pickedUpAt,
            subLabel: donation.volunteerName ? `By ${donation.volunteerName}` : (donation.claimedByName ? `By ${donation.claimedByName}` : undefined)
        },
        {
            key: 'DISTRIBUTED',
            label: 'Successfully Distributed',
            icon: FiCheckCircle,
            date: donation.completedAt,
            subLabel: donation.volunteerName ? `By ${donation.volunteerName}` : (donation.claimedByName ? `By ${donation.claimedByName}` : undefined)
        },
    ];

    let currentStepIndex = 0;
    if (donation.status === 'DISTRIBUTED') currentStepIndex = steps.length - 1;
    else if (donation.status === 'PICKED_UP') currentStepIndex = steps.length - 2;
    else if (donation.status === 'VOLUNTEER_ASSIGNED') currentStepIndex = donation.volunteerId ? 2 : 1;
    else if (donation.status === 'CLAIMED_BY_NGO') currentStepIndex = 1;

    const displayImage = donation.imageUrl || (donation.imageUrls && donation.imageUrls[0]) || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000';

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Premium Header */}
            <div className="relative h-96 bg-slate-900 border-b border-slate-800 overflow-hidden">
                <img
                    src={displayImage}
                    alt={donation.foodType}
                    className="w-full h-full object-cover opacity-40 scale-110 blur-[2px] cursor-zoom-in"
                    onClick={() => setSelectedImage(displayImage)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>

                <div className="absolute inset-0 flex flex-col justify-end">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-16">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors group"
                        >
                            <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-bold uppercase tracking-widest text-[10px]">Back to Recon</span>
                        </button>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="animate-slide-up">
                                <span className={`inline-block px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mb-6 border ${getStatusStyles(donation.status)} shadow-2xl`}>
                                    {donation.status.replace(/_/g, ' ')}
                                </span>
                                <div className="flex items-center space-x-6 mb-4">
                                    <div
                                        className={`flex-shrink-0 inline-flex items-center justify-center p-1 border-4 rounded-md ${donation.foodCategory === 'Non-Veg' ? 'border-rose-500' : 'border-emerald-500'} bg-white`}
                                        style={{ width: '40px', height: '40px' }}
                                        title={donation.foodCategory === 'Non-Veg' ? "Non-Vegetarian" : "Vegetarian"}
                                    >
                                        <span className={`rounded-full w-5 h-5 ${donation.foodCategory === 'Non-Veg' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                    </div>
                                    <h1 className="text-6xl font-black text-white tracking-tight drop-shadow-2xl">
                                        {donation.foodType}
                                    </h1>
                                </div>
                                <div className="flex items-center text-white/70 font-bold">
                                    <FiMapPin className="text-primary-400 mr-2" />
                                    <span>{donation.pickupLocation}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 min-w-[240px] animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                {user?.role === 'ngo' && donation.status === 'AVAILABLE' && (
                                    <button
                                        onClick={handleClaim}
                                        className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary-500/40 hover:bg-primary-700 transition-all flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <FiCheckCircle className="mr-2" />
                                        Launch Rescue Mission
                                    </button>
                                )}
                                {user?.role === 'ngo' && donation.claimedBy === user.id && (
                                    <>
                                        {(donation.status === 'CLAIMED_BY_NGO' || donation.status === 'VOLUNTEER_ASSIGNED') && (
                                            <button
                                                onClick={() => setShowAssignModal(true)}
                                                className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary-500/40 hover:bg-primary-700 transition-all flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <FiTruck className="mr-2" />
                                                Handle Pickup / Assign
                                            </button>
                                        )}
                                        {donation.status === 'PICKED_UP' && (
                                            <button
                                                onClick={() => setShowDistributionModal(true)}
                                                className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-500/40 hover:bg-emerald-700 transition-all flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <FiCheckCircle className="mr-2" />
                                                Confirm Distribution
                                            </button>
                                        )}
                                        {donation.status === 'DISTRIBUTED' && (
                                            <button
                                                onClick={() => {
                                                    setPreviewImages(donation.distributionProofImages || []);
                                                    setProofFiles([]);
                                                    setShowDistributionModal(true);
                                                }}
                                                className="w-full py-5 bg-slate-800 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-500/40 hover:bg-slate-900 transition-all flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <FiUpload className="mr-2" />
                                                Update Proof Images
                                            </button>
                                        )}
                                    </>
                                )}
                                {user?.role === 'volunteer' && (
                                    <>
                                        {donation.status === 'VOLUNTEER_ASSIGNED' && (
                                            <button
                                                onClick={handlePickup}
                                                className="w-full py-5 bg-amber-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-amber-500/40 hover:bg-amber-700 transition-all flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <FiTruck className="mr-2" />
                                                Confirm Pickup
                                            </button>
                                        )}
                                        {donation.status === 'PICKED_UP' && donation.volunteerId === user.id && (
                                            <button
                                                onClick={() => setShowDistributionModal(true)}
                                                className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-500/40 hover:bg-emerald-700 transition-all flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <FiCheckCircle className="mr-2" />
                                                Confirm Distribution
                                            </button>
                                        )}
                                        {donation.status === 'DISTRIBUTED' && donation.volunteerId === user.id && (
                                            <button
                                                onClick={() => {
                                                    setPreviewImages(donation.distributionProofImages || []);
                                                    setProofFiles([]);
                                                    setShowDistributionModal(true);
                                                }}
                                                className="w-full py-5 bg-slate-800 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-500/40 hover:bg-slate-900 transition-all flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <FiUpload className="mr-2" />
                                                Update Proof Images
                                            </button>
                                        )}
                                        {donation.status === 'AVAILABLE' && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        if (!user?.isVerified) {
                                                            alert('Your volunteer account is not yet verified by Admin. You cannot accept tasks until verified.');
                                                            return;
                                                        }
                                                        await api.acceptTask('', donation.id);
                                                        const updated = await api.getDonationById(donation.id);
                                                        setDonation(updated);
                                                        alert('Mission accepted!');
                                                    } catch (err) {
                                                        alert(err.response?.data?.message || 'Failed to accept mission');
                                                    }
                                                }}
                                                className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary-500/40 hover:bg-primary-700 transition-all flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <FiCheckCircle className="mr-2" />
                                                Accept Mission
                                            </button>
                                        )}
                                    </>
                                )}
                                {isDonor && donation.status !== 'CANCELLED' && (
                                    <div className="space-y-4">
                                        <button
                                            onClick={handleOpenEditModal}
                                            className="w-full py-5 bg-orange-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-orange-500/40 hover:bg-orange-600 transition-all flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <FiPackage className="mr-2" />
                                            Edit Mission Brief
                                        </button>
                                        {['AVAILABLE', 'CLAIMED_BY_NGO', 'VOLUNTEER_ASSIGNED'].includes(donation.status) && (
                                            <button
                                                onClick={handleCancel}
                                                className="w-full py-5 bg-rose-500/10 text-rose-500 border border-rose-500/20 backdrop-blur-xl rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-rose-500 hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <FiXCircle className="mr-2" />
                                                Abort Mission
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Mission Intelligence */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:shadow-primary-500/10 transition-all">
                                <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                                    <FiPackage size={24} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quantity</p>
                                <p className="text-2xl font-black text-slate-800">{donation.quantity} <span className="text-sm text-slate-400 uppercase">{donation.unit}</span></p>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:shadow-primary-500/10 transition-all">
                                <div className="p-4 bg-primary-50 text-primary-600 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                                    <FiClock size={24} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expiry Date</p>
                                <p className="text-2xl font-black text-slate-800">{new Date(donation.expiryDate).toLocaleDateString()}</p>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:shadow-primary-500/10 transition-all">
                                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                                    <FiUser size={24} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Posted By</p>
                                <p className="text-2xl font-black text-slate-800 truncate">{donation.donorName}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">Mission Briefing</h3>
                            <div className="prose prose-slate max-w-none">
                                <p className="text-xl text-slate-500 font-medium leading-relaxed">
                                    {donation.description || "This mission involves rescuing fresh food resources and ensuring they reach community members in need. All volunteers and partners should coordinate for a seamless pickup and distribution of these items."}
                                </p>
                            </div>
                        </div>

                        {/* Mission Partners & Donor Contact */}
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 animate-slide-up" style={{ animationDelay: '0.45s' }}>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Mission Intelligence</h3>
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest">Confidential</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Donor Information (Revealed to NGO/Admins) */}
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                                            <FiUser size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Donor Detail</p>
                                            <p className="font-black text-slate-900">{donation.donorName}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {donation.donorId?.phone && (
                                            <div className="flex items-center text-sm font-bold text-slate-600">
                                                <FiPhone className="mr-3 text-primary-500" />
                                                {donation.donorId?.phone}
                                            </div>
                                        )}
                                        {donation.donorId?.email && (
                                            <div className="flex items-center text-sm font-bold text-slate-600">
                                                <FiMail className="mr-3 text-primary-500" />
                                                {donation.donorId?.email}
                                            </div>
                                        )}
                                        <div className="flex items-start text-sm font-bold text-slate-600">
                                            <FiMapPin className="mr-3 mt-1 text-primary-500 shrink-0" />
                                            {donation.pickupLocation}
                                        </div>
                                    </div>
                                </div>

                                {/* Claimed Info */}
                                {donation.claimedBy && (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-6 p-6 bg-orange-50/50 rounded-[2rem] border border-orange-100/50 group">
                                            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                                                {donation.claimedByName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NGO Lead</p>
                                                <Link to={`/profile/${donation.claimedBy}`} className="text-lg font-black text-slate-800 hover:text-primary-600 transition-colors">
                                                    {donation.claimedByName}
                                                </Link>
                                            </div>
                                        </div>

                                        {donation.volunteerId && (
                                            <div className="flex items-center space-x-6 p-6 bg-primary-50/50 rounded-[2rem] border border-primary-100/50 group">
                                                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                                                    {donation.volunteerName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volunteer</p>
                                                    <Link to={`/profile/${donation.volunteerId}`} className="text-lg font-black text-slate-800 hover:text-primary-600 transition-colors">
                                                        {donation.volunteerName}
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Impact Proof / Images */}
                        {donation.imageUrls && (
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Field Documentation</h3>
                                    {isDonor && (
                                        <button
                                            onClick={handleOpenEditModal}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95 flex items-center space-x-2"
                                        >
                                            <FiCamera className="w-3 h-3" />
                                            <span>Manage Photos</span>
                                        </button>
                                    )}
                                </div>
                                {donation.imageUrls.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {donation.imageUrls.map((url, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-[2rem] overflow-hidden aspect-video border-4 border-slate-50 shadow-2xl group relative cursor-zoom-in"
                                                onClick={() => setSelectedImage(url)}
                                            >
                                                <img
                                                    src={url}
                                                    alt="Documentation"
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                                                />
                                                <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white">
                                                        <FiMaximize size={32} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No documentation images provided</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Distribution Proof */}
                        {donation.distributionProofImages && donation.distributionProofImages.length > 0 && (
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-emerald-100 bg-emerald-50/10 animate-slide-up" style={{ animationDelay: '0.55s' }}>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Distribution Evidence</h3>
                                    <div className="flex items-center space-x-3">
                                        {canManageProof && (
                                            <button
                                                onClick={() => {
                                                    setPreviewImages(donation.distributionProofImages || []);
                                                    setProofFiles([]);
                                                    setShowDistributionModal(true);
                                                }}
                                                className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                Manage Proof
                                            </button>
                                        )}
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-200">Verified Proof</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {donation.distributionProofImages.map((url, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-[2rem] overflow-hidden aspect-video border-4 border-white shadow-2xl group relative cursor-zoom-in"
                                            onClick={() => setSelectedImage(url)}
                                        >
                                            <img
                                                src={url}
                                                alt="Distribution Proof"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                                            />
                                            <div className="absolute inset-0 bg-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <div className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white">
                                                    <FiMaximize size={32} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mission Control Timeline */}
                    <div className="space-y-10">
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 animate-slide-up sticky top-24" style={{ animationDelay: '0.5s' }}>
                            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-12">Operation Status</h3>

                            <div className="space-y-12 relative">
                                {/* Timeline Line */}
                                <div className="absolute left-[23px] top-4 bottom-4 w-1 bg-slate-50"></div>
                                <div
                                    className="absolute left-[23px] top-4 w-1 bg-primary-600 transition-all duration-1000 origin-top"
                                    style={{ height: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                                ></div>

                                {steps.map((step, idx) => {
                                    const isCompleted = idx <= currentStepIndex;
                                    const isCurrent = idx === currentStepIndex;

                                    return (
                                        <div key={idx} className={`relative flex items-center group ${!isCompleted ? 'opacity-30' : ''}`}>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative z-10 transition-all duration-500 shadow-xl
                                                ${isCompleted ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
                                                <step.icon size={20} />
                                            </div>
                                            <div className="ml-6">
                                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isCompleted ? 'text-primary-600' : 'text-slate-400'}`}>
                                                    {step.label}
                                                </p>
                                                {step.date && (
                                                    <p className="text-[11px] font-black text-slate-400 leading-tight">
                                                        {new Date(step.date).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </p>
                                                )}
                                                {step.subLabel && step.date && (
                                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">{step.subLabel}</p>
                                                )}
                                                {isCurrent && !step.date && <span className="inline-block px-2 py-0.5 bg-primary-50 text-primary-600 text-[8px] font-black uppercase rounded mt-2 animate-pulse">In Progress</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Impact Verified Badge */}
                            {donation.status === 'DISTRIBUTED' && (
                                <div className="mt-16 p-10 bg-emerald-50 rounded-[3rem] border border-emerald-100 text-center animate-bounce-subtle shadow-xl shadow-emerald-500/10">
                                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200/50">
                                        <FiCheckCircle className="w-10 h-10 text-emerald-600" />
                                    </div>
                                    <p className="text-emerald-800 font-black uppercase tracking-[0.3em] text-[10px] mb-3">Status: Mission Accomplished</p>
                                    <p className="text-emerald-600/70 text-xs font-bold uppercase tracking-widest">Resources successfully reached beneficiaries.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Assignment Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-10 transform transition-all border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Handle Pickup</h3>
                            <button onClick={() => setShowAssignModal(false)} className="p-3 rounded-full hover:bg-slate-100 transition-colors">
                                <FiX className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <button
                                onClick={handlePickupMyself}
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

                        {modalError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center mb-6">{modalError}</p>}

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
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-10 transform transition-all border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Proof of Impact</h3>
                            <button onClick={() => setShowDistributionModal(false)} className="p-3 rounded-full hover:bg-slate-100 transition-colors">
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
                                        <div key={idx} className="relative group rounded-3xl overflow-hidden aspect-square border-2 border-slate-100 shadow-xl">
                                            <img
                                                src={img}
                                                alt="Proof"
                                                className="w-full h-full object-cover cursor-zoom-in"
                                                onClick={() => setSelectedImage(img)}
                                            />
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
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

                        {modalError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center mb-6">{modalError}</p>}

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

            {/* Edit Mission Modal for Donor */}
            {showEditModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full p-10 transform transition-all border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Edit Mission Brief</h3>
                            <button onClick={() => setShowEditModal(false)} className="p-3 rounded-full hover:bg-slate-100 transition-colors">
                                <FiX className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form className="space-y-6" onSubmit={async (e) => {
                            e.preventDefault();
                            setIsProcessing(true);
                            setModalError(null);
                            try {
                                const existingKeep = previewImages.filter(img => !img.startsWith('blob:'));

                                const payload = {
                                    foodType: editFormData.foodType,
                                    quantity: editFormData.quantity,
                                    unit: editFormData.unit,
                                    expiryTime: editFormData.expiryDate,
                                    description: editFormData.description,
                                    address: editFormData.pickupLocation,
                                    latitude: editFormData.latitude,
                                    longitude: editFormData.longitude,
                                    existingImages: existingKeep,
                                    images: proofFiles
                                };

                                await api.updateDonation(donation.id, payload);
                                const updated = await api.getDonationById(donation.id);
                                setDonation(updated);
                                setShowEditModal(false);
                                alert('Mission brief updated successfully!');
                            } catch (err) {
                                setModalError(err.response?.data?.message || 'Failed to update mission');
                            } finally {
                                setIsProcessing(false);
                            }
                        }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Food Type</label>
                                    <input
                                        type="text"
                                        required
                                        value={editFormData.foodType}
                                        onChange={(e) => setEditFormData({ ...editFormData, foodType: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Quantity</label>
                                        <input
                                            type="number"
                                            required
                                            value={editFormData.quantity}
                                            onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Unit</label>
                                        <select
                                            value={editFormData.unit}
                                            onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold bg-white"
                                        >
                                            <option value="servings">Servings</option>
                                            <option value="kg">Kg</option>
                                            <option value="items">Items</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mission Intelligence (Description)</label>
                                <textarea
                                    rows={2}
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold resize-none"
                                    placeholder="Any specific details..."
                                ></textarea>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Field Documentation (New Images will replace old ones)</label>
                                <div className="grid grid-cols-4 gap-4">
                                    {previewImages.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 group">
                                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const removedSrc = previewImages[idx];
                                                    setPreviewImages(prev => prev.filter((_, i) => i !== idx));
                                                    if (removedSrc.startsWith('blob:')) {
                                                        setProofFiles(prev => {
                                                            const newFiles = [...prev];
                                                            const blobIndex = previewImages.slice(0, idx).filter(p => p.startsWith('blob:')).length;
                                                            newFiles.splice(blobIndex, 1);
                                                            return newFiles;
                                                        });
                                                    }
                                                }}
                                                className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <FiX size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-primary-500 hover:text-primary-500 cursor-pointer transition-colors">
                                        <FiUpload size={20} />
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    const files = Array.from(e.target.files);
                                                    const newUrls = files.map(f => URL.createObjectURL(f));
                                                    setPreviewImages(prev => [...prev, ...newUrls]);
                                                    setProofFiles(prev => [...prev, ...files]);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Expiry Date & Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={editFormData.expiryDate}
                                    onChange={(e) => setEditFormData({ ...editFormData, expiryDate: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pickup Address</label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.pickupLocation}
                                    onChange={(e) => setEditFormData({ ...editFormData, pickupLocation: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold"
                                />
                            </div>

                            {modalError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center mb-6">{modalError}</p>}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="flex-[2] py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary-500/40 hover:bg-primary-700 transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? 'Updating...' : 'Save Meta Changes'}
                                </button>
                            </div>
                        </form>
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

export default DonationDetails;
