import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import { FiUser, FiMail, FiPhone, FiMapPin, FiClock, FiSave, FiPackage, FiCheckCircle, FiAlertCircle, FiLock, FiLogOut, FiCamera, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import Modal from '../../components/Modal.jsx';

const DonorProfile = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();

    // Local state for form fields
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        altPhone: '',
        city: '',
        state: '',
        defaultAddress: '',
        landmark: '',
        preferredTime: 'Anytime',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const fileInputRef = React.useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const [stats, setStats] = useState({
        totalDonations: 0,
        completedDonations: 0,
        activeDonations: 0,
        lastDonation: undefined
    });
    const [statsLoading, setStatsLoading] = useState(true);

    // Password change state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                altPhone: '',
                city: '',
                state: '',
                defaultAddress: user.address || '',
                landmark: '',
                preferredTime: 'Anytime',
            });

            const fetchStats = async () => {
                try {
                    const [statsData, donations] = await Promise.all([
                        api.getStats(user.id, user.role),
                        api.getDonations({ donorId: user.id })
                    ]);

                    const lastDonationDate = donations.length > 0 ? donations[0].createdAt : undefined;

                    setStats({
                        ...statsData,
                        lastDonation: lastDonationDate
                    });
                } catch (error) {
                    console.error('Failed to fetch profile stats', error);
                } finally {
                    setStatsLoading(false);
                }
            };

            fetchStats();
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            setProfileImage(imageUrl);
        }
    };

    const triggerFileInput = () => {
        if (isEditing && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setMessage(null);

        // Validation
        if (!formData.name || !formData.phone || !formData.defaultAddress) {
            setMessage({ type: 'error', text: 'Please fill in all required fields.' });
            return;
        }

        try {
            const updatedUser = await api.updateUserProfile({
                name: formData.name,
                phone: formData.phone,
                altPhone: formData.altPhone,
                address: formData.defaultAddress,
                city: formData.city,
                state: formData.state,
                landmark: formData.landmark,
                preferredTime: formData.preferredTime
            });

            // Update local storage so useAuth can pick it up
            localStorage.setItem('user', JSON.stringify(updatedUser));
            refreshUser();

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters long');
            return;
        }

        setIsPasswordSubmitting(true);
        try {
            await api.updatePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordSuccess(true);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                setIsPasswordModalOpen(false);
                setPasswordSuccess(false);
            }, 2000);
        } catch (error) {
            setPasswordError(error.response?.data?.message || 'Failed to update password');
        } finally {
            setIsPasswordSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6 mb-8 animate-fade-in">
                    <div className="relative group">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4 md:mb-0 overflow-hidden ${!profileImage ? 'bg-gradient-to-br from-primary-400 to-primary-600' : 'bg-white'} cursor-zoom-in`} onClick={() => profileImage && setSelectedImage(profileImage)}>
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || <FiUser />
                            )}
                        </div>
                        {isEditing && (
                            <button
                                onClick={triggerFileInput}
                                className="absolute bottom-0 right-0 md:bg-white md:bg-opacity-90 bg-slate-100 p-2 rounded-full shadow-md text-slate-700 hover:text-primary-600 transition-colors"
                                title="Change Profile Photo"
                            >
                                <FiCamera className="w-5 h-5" />
                            </button>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-3xl font-bold text-slate-900">{user?.name}</h1>
                        <p className="text-slate-500 font-medium">Donor Account</p>
                        <div className="mt-2 flex items-center justify-center md:justify-start space-x-2 text-sm text-slate-500">
                            <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium">
                                Active Member
                            </span>
                            <span>• Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md flex items-center space-x-2"
                            >
                                <FiUser className="w-4 h-4" />
                                <span>Edit Profile</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Forms */}
                    <div className="lg:col-span-2 space-y-6 animate-slide-up">

                        {message && (
                            <div className={`p-4 rounded-lg flex items-center space-x-2 ${message.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
                                {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleSave}>
                            {/* Personal Information */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                        <FiUser className="mr-2 text-primary-600" /> Personal Information
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                                            />
                                            <FiMail className="absolute left-3 top-3 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Role</label>
                                        <input
                                            type="text"
                                            value="Food Donor"
                                            disabled
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                        <FiPhone className="mr-2 text-primary-600" /> Contact Details
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Alternate Contact (Optional)</label>
                                        <input
                                            type="tel"
                                            name="altPhone"
                                            value={formData.altPhone}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pickup Information */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                        <FiMapPin className="mr-2 text-primary-600" /> Pickup Information
                                    </h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Default Pickup Address</label>
                                        <textarea
                                            name="defaultAddress"
                                            value={formData.defaultAddress}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Landmark (Optional)</label>
                                            <input
                                                type="text"
                                                name="landmark"
                                                value={formData.landmark}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Preferred Pickup Time</label>
                                            <div className="relative">
                                                <select
                                                    name="preferredTime"
                                                    value={formData.preferredTime}
                                                    onChange={handleChange}
                                                    disabled={!isEditing}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all appearance-none"
                                                >
                                                    <option>Anytime</option>
                                                    <option>Morning (9 AM - 12 PM)</option>
                                                    <option>Afternoon (12 PM - 4 PM)</option>
                                                    <option>Evening (4 PM - 8 PM)</option>
                                                </select>
                                                <FiClock className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {isEditing && (
                                <div className="flex justify-end space-x-4 animate-fade-in">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all flex items-center space-x-2"
                                    >
                                        <FiSave />
                                        <span>Save Changes</span>
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Right Column: Stats & Settings */}
                    <div className="space-y-6">

                        {/* Donation Summary */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                    <FiPackage className="mr-2 text-primary-600" /> Donation Summary
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                {statsLoading ? (
                                    <div className="flex justify-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <span className="text-slate-600">Total Posted</span>
                                            <span className="font-bold text-slate-900 text-lg">{stats.totalDonations || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                                            <span className="text-emerald-800">Successful</span>
                                            <span className="font-bold text-emerald-800 text-lg">{stats.completedDonations || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                                            <span className="text-amber-800">Active</span>
                                            <span className="font-bold text-amber-800 text-lg">{stats.activeDonations || 0}</span>
                                        </div>
                                        {stats.lastDonation && (
                                            <div className="pt-2 border-t border-slate-100">
                                                <p className="text-xs text-center text-slate-500">
                                                    Last donation on {new Date(stats.lastDonation).toLocaleDateString([], {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Account Settings */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                    <FiLock className="mr-2 text-primary-600" /> Account Settings
                                </h2>
                            </div>
                            <div className="p-6 space-y-3">
                                <button
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors group"
                                >
                                    <span className="font-medium group-hover:text-primary-600">Change Password</span>
                                    <span className="text-slate-400">→</span>
                                </button>
                                <div className="pt-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium border border-red-100"
                                    >
                                        <FiLogOut />
                                        <span>Log Out</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title="Change Password"
            >
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    {passwordError && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                            <FiAlertCircle />
                            {passwordError}
                        </div>
                    )}
                    {passwordSuccess && (
                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-center gap-2">
                            <FiCheckCircle />
                            Password updated successfully!
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isPasswordSubmitting}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 mt-2"
                    >
                        {isPasswordSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </Modal>

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

export default DonorProfile;
