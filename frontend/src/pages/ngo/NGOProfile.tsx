import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { FiUser, FiMail, FiPhone, FiMapPin, FiClock, FiSave, FiPackage, FiCheckCircle, FiAlertCircle, FiLock, FiLogOut, FiUsers, FiGlobe, FiBriefcase, FiCamera } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const NGOProfile: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Local state for form fields
    const [formData, setFormData] = useState({
        organizationName: '',
        registrationNumber: '', // Read-only
        ngoType: 'Charity',
        establishedYear: '',
        phone: '',
        altPhone: '',
        city: '',
        state: '',
        address: '',
        serviceArea: '',
        activeWorkers: '',
        preferredPickupTime: 'Anytime',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [logoImage, setLogoImage] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Mock stats data
    const stats = {
        totalPickups: 45,
        successfulDistributions: 42,
        pendingDistributions: 3,
        lastDistribution: '2023-11-01',
    };

    useEffect(() => {
        if (user) {
            // In a real app, we might fetch more detailed profile info here
            setFormData({
                organizationName: user.organization || user.name || 'Hope Foundation',
                registrationNumber: 'NGO-reg-12345',
                ngoType: 'Charity',
                establishedYear: '2015',
                phone: user.phone || '987-654-3210',
                altPhone: '',
                city: 'Chicago',
                state: 'IL',
                address: user.address || '456 Charity Lane, Suite 100',
                serviceArea: 'Downtown & Suburbs',
                activeWorkers: '15',
                preferredPickupTime: '09:00 AM - 06:00 PM',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            setLogoImage(imageUrl);
        }
    };

    const triggerFileInput = () => {
        if (isEditing && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validation
        if (!formData.organizationName || !formData.phone || !formData.address) {
            setMessage({ type: 'error', text: 'Please fill in all required fields.' });
            return;
        }

        // Simulate API call
        setTimeout(() => {
            setMessage({ type: 'success', text: 'Organization profile updated successfully!' });
            setIsEditing(false);
        }, 1000);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8 mb-8 animate-fade-in">
                    <div className="relative group">
                        <div className={`w-32 h-32 rounded-xl flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4 md:mb-0 overflow-hidden ${!logoImage ? 'bg-gradient-to-br from-secondary-400 to-secondary-600' : 'bg-white'}`}>
                            {logoImage ? (
                                <img src={logoImage} alt="Organization Logo" className="w-full h-full object-cover" />
                            ) : (
                                <FiBriefcase />
                            )}
                        </div>
                        {isEditing && (
                            <button
                                onClick={triggerFileInput}
                                className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md text-slate-700 hover:text-primary-600 transition-colors border border-slate-200"
                                title="Change Logo"
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

                    <div className="text-center md:text-left flex-1 pt-2">
                        <h1 className="text-3xl font-bold text-slate-900">{formData.organizationName}</h1>
                        <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                            <span className="bg-secondary-50 text-secondary-700 px-2 py-0.5 rounded text-sm border border-secondary-100">
                                {formData.ngoType}
                            </span>
                            <span>• Verified Organization</span>
                        </p>
                        <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                                <FiMapPin className="text-slate-400" />
                                <span>{formData.city}, {formData.state}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <FiUsers className="text-slate-400" />
                                <span>{formData.activeWorkers} Active Volunteers</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 md:mt-0">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md flex items-center space-x-2"
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
                            {/* Organization Information */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                        <FiBriefcase className="mr-2 text-primary-600" /> Organization Information
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Organization Name</label>
                                        <input
                                            type="text"
                                            name="organizationName"
                                            value={formData.organizationName}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Registration Number</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.registrationNumber}
                                                disabled
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                                            />
                                            <FiLock className="absolute right-3 top-3 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Organization Type</label>
                                        <div className="relative">
                                            <select
                                                name="ngoType"
                                                value={formData.ngoType}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all appearance-none"
                                            >
                                                <option value="Charity">Charity</option>
                                                <option value="Shelter">Shelter</option>
                                                <option value="Old Age Home">Old Age Home</option>
                                                <option value="Orphanage">Orphanage</option>
                                                <option value="Community Center">Community Center</option>
                                            </select>
                                            <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">▼</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Year Established</label>
                                        <input
                                            type="number"
                                            name="establishedYear"
                                            value={formData.establishedYear}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            placeholder="YYYY"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
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
                                        <label className="text-sm font-semibold text-slate-700">Official Email</label>
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
                                        <label className="text-sm font-semibold text-slate-700">Alternate Phone (Optional)</label>
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

                            {/* Service & Distribution Details */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                        <FiGlobe className="mr-2 text-primary-600" /> Pickup & Distribution
                                    </h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Primary Headquarters Address</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            rows={2}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Service Area / Coverage</label>
                                            <input
                                                type="text"
                                                name="serviceArea"
                                                value={formData.serviceArea}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                placeholder="e.g. Downtown, North Zone"
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Active Volunteers/Workers</label>
                                            <input
                                                type="number"
                                                name="activeWorkers"
                                                value={formData.activeWorkers}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-semibold text-slate-700">Preferred Pickup/Distribution Time</label>
                                            <div className="relative">
                                                <select
                                                    name="preferredPickupTime"
                                                    value={formData.preferredPickupTime}
                                                    onChange={handleChange}
                                                    disabled={!isEditing}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all appearance-none"
                                                >
                                                    <option>Anytime</option>
                                                    <option>Morning (8 AM - 12 PM)</option>
                                                    <option>Afternoon (12 PM - 5 PM)</option>
                                                    <option>Evening (5 PM - 9 PM)</option>
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

                        {/* Distribution Summary */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                    <FiPackage className="mr-2 text-primary-600" /> Distribution Summary
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Total Pickups</span>
                                    <span className="font-bold text-slate-900 text-lg">{stats.totalPickups}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-success-50 rounded-lg">
                                    <span className="text-success-800">Successful</span>
                                    <span className="font-bold text-success-800 text-lg">{stats.successfulDistributions}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-warning-50 rounded-lg">
                                    <span className="text-warning-800">Pending</span>
                                    <span className="font-bold text-warning-800 text-lg">{stats.pendingDistributions}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-100">
                                    <p className="text-xs text-center text-slate-500">
                                        Last distribution on {new Date(stats.lastDistribution).toLocaleDateString()}
                                    </p>
                                </div>
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
                                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors group">
                                    <span className="font-medium group-hover:text-primary-600">Change Password</span>
                                    <span className="text-slate-400">→</span>
                                </button>
                                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors group">
                                    <span className="font-medium group-hover:text-primary-600">Notification Preferences</span>
                                    <span className="text-slate-400">→</span>
                                </button>
                                <div className="pt-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg bg-danger-50 text-danger-600 hover:bg-danger-100 transition-colors font-medium border border-danger-100"
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
        </div>
    );
};

export default NGOProfile;
