import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import {
    FiUser, FiMail, FiPhone, FiMapPin,
    FiBriefcase, FiCheckCircle, FiShield,
    FiArrowLeft, FiClock, FiActivity
} from 'react-icons/fi';
import type { User } from '../types';

const PublicProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [feedback, setFeedback] = useState<{ feedback: any[], stats: any }>({ feedback: [], stats: { averageRating: 0, totalFeedback: 0 } });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await api.getUserProfile(id);
                setProfileUser(data);

                if (data.role.toLowerCase() === 'donor') {
                    const fb = await api.getDonorFeedback(id);
                    setFeedback(fb);
                }
            } catch (err: any) {
                console.error('Failed to fetch profile:', err);
                setError(err.response?.data?.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex justify-center items-center h-[calc(100-64px)] py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600"></div>
                </div>
            </div>
        );
    }

    if (error || !profileUser) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiUser size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
                        <p className="text-slate-500 mb-8">{error || "The user you're looking for doesn't exist or is unavailable."}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center space-x-2 text-primary-600 font-bold hover:text-primary-700 transition-colors"
                        >
                            <FiArrowLeft />
                            <span>Go Back</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isNGO = profileUser.role.toLowerCase() === 'ngo';

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 flex items-center space-x-2 text-slate-500 hover:text-primary-600 transition-colors group"
                >
                    <div className="p-2 rounded-full group-hover:bg-primary-50 transition-colors">
                        <FiArrowLeft />
                    </div>
                    <span className="font-medium">Back to Previous</span>
                </button>

                {/* Profile Header */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8 animate-fade-in">
                    <div className="h-32 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-800 relative">
                        <div className="absolute -bottom-16 left-8 md:left-12">
                            <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-2xl">
                                <div className={`w-full h-full rounded-2xl flex items-center justify-center text-white text-4xl font-bold ${isNGO ? 'bg-secondary-500' : 'bg-primary-500'}`}>
                                    {isNGO ? <FiBriefcase /> : profileUser.name.charAt(0)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 pb-8 px-8 md:px-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black text-slate-900">
                                    {isNGO ? (profileUser.organization || profileUser.name) : profileUser.name}
                                </h1>
                                {profileUser.isVerified && (
                                    <div className="text-blue-500" title="Verified User">
                                        <FiCheckCircle size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-slate-500 font-medium">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isNGO ? 'bg-secondary-50 text-secondary-700' : 'bg-primary-50 text-primary-700'
                                    }`}>
                                    {profileUser.role}
                                </span>
                                {profileUser.address && (
                                    <div className="flex items-center gap-1">
                                        <FiMapPin className="text-slate-400" />
                                        <span>{profileUser.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <a
                                href={`tel:${profileUser.phone}`}
                                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center space-x-2"
                            >
                                <FiPhone />
                                <span>Call</span>
                            </a>
                            <a
                                href={`mailto:${profileUser.email}`}
                                className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/30 transition-all flex items-center space-x-2"
                            >
                                <FiMail />
                                <span>Message</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8 animate-slide-up">
                        {/* About/Details Section */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <FiUser className="mr-2 text-primary-600" />
                                About {isNGO ? 'Organization' : 'Volunteer'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                                        <p className="text-slate-700 font-medium">{profileUser.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                                        <p className="text-slate-700 font-medium">{profileUser.phone || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                                        <p className="text-slate-700 font-medium">{profileUser.address || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Verified Status</p>
                                        <div className="flex items-center space-x-1.5 text-green-600 font-bold">
                                            <FiShield />
                                            <span>{profileUser.isVerified ? 'Verified Account' : 'Pending Verification'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity (Placeholders) */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <FiActivity className="mr-2 text-primary-600" /> Contributions Summary
                            </h2>
                            <div className="text-center py-10 opacity-60">
                                <FiClock className="mx-auto text-4xl mb-4 text-slate-200" />
                                <p className="text-slate-500 italic">No recent public activities to display.</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        <div className={`rounded-3xl p-8 text-white shadow-xl ${profileUser.role.toLowerCase() === 'donor' ? 'bg-amber-500 shadow-amber-200' : 'bg-primary-600 shadow-primary-200'}`}>
                            <h3 className="text-lg font-bold mb-6">
                                {profileUser.role.toLowerCase() === 'donor' ? 'Trust Rating' : 'Impact Score'}
                            </h3>
                            <div className="flex items-end gap-2 mb-4">
                                <span className="text-5xl font-black">
                                    {profileUser.role.toLowerCase() === 'donor' 
                                        ? (feedback.stats.averageRating ? feedback.stats.averageRating.toFixed(1) : '0.0')
                                        : '9.8'}
                                </span>
                                <span className={`mb-2 font-bold ${profileUser.role.toLowerCase() === 'donor' ? 'text-amber-100' : 'text-primary-200'}`}>/ 5.0</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2 mb-8">
                                <div 
                                    className="bg-white h-2 rounded-full" 
                                    style={{ width: `${profileUser.role.toLowerCase() === 'donor' ? (feedback.stats.averageRating / 5 * 100) : 98}%` }}
                                ></div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className={profileUser.role.toLowerCase() === 'donor' ? 'text-amber-50' : 'text-primary-100'}>
                                        {profileUser.role.toLowerCase() === 'donor' ? 'Total Reviews' : 'Reliability'}
                                    </span>
                                    <span>{profileUser.role.toLowerCase() === 'donor' ? feedback.stats.totalFeedback : 'High'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className={profileUser.role.toLowerCase() === 'donor' ? 'text-amber-50' : 'text-primary-100'}>
                                        {profileUser.role.toLowerCase() === 'donor' ? 'Verification' : 'Response Time'}
                                    </span>
                                    <span>{profileUser.isVerified ? 'Verified' : 'Pending'}</span>
                                </div>
                            </div>
                        </div>

                        {profileUser.role.toLowerCase() === 'donor' && feedback.feedback.length > 0 && (
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Recent Feedback</h4>
                                <div className="space-y-6">
                                    {feedback.feedback.slice(0, 3).map((f) => (
                                        <div key={f.id} className="border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center text-yellow-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <svg key={i} className={`w-3 h-3 fill-current ${i < f.rating ? '' : 'text-slate-100'}`} viewBox="0 0 24 24">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-slate-300 font-bold uppercase">{new Date(f.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2 italic">"{f.comment}"</p>
                                            <p className="text-[9px] font-bold text-primary-600 uppercase tracking-widest mt-2">— {f.ngoId.organization || f.ngoId.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 italic text-slate-500 text-sm text-center">
                            "Committed to making the world a better place, one meal at a time."
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
