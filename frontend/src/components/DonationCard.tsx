import React from 'react';
import { Link } from 'react-router-dom';
import type { Donation } from '../types';
import { useAuth } from '../context/AuthContext';
import { FiMapPin, FiClock, FiPackage, FiInfo, FiX, FiMaximize } from 'react-icons/fi';

interface DonationCardProps {
    donation: Donation;
    linkTo: string;
    action?: {
        label: string;
        onClick: (e: React.MouseEvent) => void;
        variant?: 'primary' | 'secondary' | 'danger';
    };
}

const DonationCard: React.FC<DonationCardProps> = ({ donation, linkTo, action }) => {
    const { } = useAuth();
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
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

    const getStatusStyles = (status: string) => {
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

    const displayImage = (donation.distributionProofImages && donation.distributionProofImages[0]) ||
        donation.imageUrl ||
        (donation.imageUrls && donation.imageUrls[0]) ||
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000';

    return (
        <>
            <Link
                to={linkTo}
                className="group block bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 transform hover:-translate-y-2 animate-fade-in"
            >
                {/* Image Section */}
                <div className="relative h-64 overflow-hidden">
                    <img
                        src={displayImage}
                        alt={donation.foodType}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 cursor-zoom-in"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedImage(displayImage);
                        }}
                    />

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedImage(displayImage);
                        }}
                        className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 hover:scale-110 z-20"
                        title="View Full Image"
                    >
                        <FiMaximize size={16} />
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none"></div>

                    {/* Status Badge */}
                    <div className="absolute top-6 left-6">
                        <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border backdrop-blur-xl ${getStatusStyles(donation.status)} shadow-lg`}>
                            {donation.status.replace(/_/g, ' ')}
                        </span>
                    </div>

                    {/* Expiry Overlay */}
                    <div className="absolute bottom-6 left-6 flex items-center space-x-2 text-white">
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center space-x-2 border border-white/20 shadow-xl">
                            <FiClock className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-black tracking-widest">{getTimeRemaining(donation.expiryDate)}</span>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="p-8">
                    <div className="mb-6">
                        <div className="flex items-center space-x-3 mb-2">
                            <div
                                className={`flex-shrink-0 inline-flex items-center justify-center p-0.5 border-2 rounded-sm ${donation.foodCategory === 'Non-Veg' ? 'border-rose-500' : 'border-emerald-500'}`}
                                style={{ width: '16px', height: '16px' }}
                                title={donation.foodCategory === 'Non-Veg' ? "Non-Vegetarian" : "Vegetarian"}
                            >
                                <span className={`rounded-full w-2 h-2 ${donation.foodCategory === 'Non-Veg' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 group-hover:text-primary-600 transition-colors line-clamp-1 tracking-tight">
                                {donation.foodType}
                            </h3>
                        </div>
                        <div className="flex items-center text-slate-500 text-sm font-semibold">
                            <div className="p-1.5 bg-primary-50 text-primary-600 rounded-lg mr-3">
                                <FiMapPin size={14} />
                            </div>
                            <span className="line-clamp-1">{donation.pickupLocation}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                            <div className="flex items-center space-x-2 text-slate-400 mb-2">
                                <FiPackage size={12} />
                                <span className="text-[10px] font-black uppercase tracking-[0.15em]">Quantity</span>
                            </div>
                            <p className="font-black text-slate-700 text-base">{donation.quantity} <span className="text-slate-400 text-xs">{donation.unit}</span></p>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                            <div className="flex items-center space-x-2 text-slate-400 mb-2">
                                <FiInfo size={12} />
                                <span className="text-[10px] font-black uppercase tracking-[0.15em]">Type</span>
                            </div>
                            <p className="font-black text-slate-700 text-base">Rescue</p>
                        </div>
                    </div>

                    {action ? (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                action.onClick(e);
                            }}
                            className={`w-full py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.97] border-0 outline-none ${action.variant === 'danger'
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white shadow-rose-500/20'
                                : action.variant === 'secondary'
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-slate-200/50'
                                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/30'
                                }`}
                        >
                            {action.label}
                        </button>
                    ) : (
                        <div className="inline-flex items-center justify-center space-x-3 text-primary-600 font-black group-hover:translate-x-2 transition-transform duration-300">
                            <span className="text-[11px] uppercase tracking-[0.2em]">View Mission</span>
                            <svg className="w-5 h-5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    )}
                </div>
            </Link>

            {/* Full Image Viewer Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-fade-in"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedImage(null);
                    }}
                >
                    <button
                        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors bg-white/10 p-4 rounded-full backdrop-blur-md"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedImage(null);
                        }}
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
        </>
    );
};

export default DonationCard;
