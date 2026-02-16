import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import {
    FiUser, FiMail, FiPhone, FiMapPin, FiClock, FiSave,
    FiTruck, FiCheckCircle, FiAlertCircle, FiLock,
    FiLogOut, FiCamera, FiCalendar, FiActivity
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const VolunteerProfile: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Local state for form fields
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        city: '',
        availabilityArea: '',
        availableDays: [] as string[],
        preferredTimeSlot: 'Morning',
        transportMode: 'Bike',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Mock stats data
    const stats = {
        deliveriesCompleted: 45,
        activeDeliveries: 2,
        hoursVolunteered: 128,
    };

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '987-654-3210',
                city: 'Chicago',
                availabilityArea: 'Downtown & North Side',
                availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
                preferredTimeSlot: 'Afternoon',
                transportMode: 'Car',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDayToggle = (day: string) => {
        if (!isEditing) return;
        setFormData(prev => ({
            ...prev,
            availableDays: prev.availableDays.includes(day)
                ? prev.availableDays.filter(d => d !== day)
                : [...prev.availableDays, day]
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!formData.name || !formData.phone || !formData.city) {
            setMessage({ type: 'error', text: 'Please fill in all required fields.' });
            return;
        }

        setTimeout(() => {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1000);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6 mb-8 animate-fade-in">
                    <div className="relative group">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4 md:mb-0 overflow-hidden ${!profileImage ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 'bg-white'}`}>
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || <FiUser />
                            )}
                        </div>
                        {isEditing && (
                            <button
                                onClick={triggerFileInput}
                                className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md text-slate-700 hover:text-indigo-600 transition-colors"
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
                        <p className="text-slate-500 font-medium">Community Volunteer</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md flex items-center space-x-2"
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
                            <div className={`p-4 rounded-lg flex items-center space-x-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleSave}>
                            {/* SECTION 1: PERSONAL INFORMATION */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                        <FiUser className="mr-2 text-indigo-600" /> Personal Information
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
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all font-medium"
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
                                            value="Volunteer"
                                            disabled
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: CONTACT & LOCATION DETAILS */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                        <FiPhone className="mr-2 text-indigo-600" /> Contact & Location
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
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
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
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">Area of Availability</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="availabilityArea"
                                                value={formData.availabilityArea}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                                                placeholder="e.g. Downtown, North Side..."
                                            />
                                            <FiMapPin className="absolute left-3 top-3 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: AVAILABILITY DETAILS */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                        <FiCalendar className="mr-2 text-indigo-600" /> Availability & Transport
                                    </h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700">Available Days</label>
                                        <div className="flex flex-wrap gap-2">
                                            {daysOfWeek.map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => handleDayToggle(day)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.availableDays.includes(day)
                                                        ? 'bg-indigo-600 text-white shadow-md'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        } ${!isEditing && 'cursor-default opacity-80'}`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Preferred Time Slot</label>
                                            <div className="relative">
                                                <select
                                                    name="preferredTimeSlot"
                                                    value={formData.preferredTimeSlot}
                                                    onChange={handleChange}
                                                    disabled={!isEditing}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all appearance-none"
                                                >
                                                    <option>Morning</option>
                                                    <option>Afternoon</option>
                                                    <option>Evening</option>
                                                    <option>Flexible</option>
                                                </select>
                                                <FiClock className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Mode of Transport</label>
                                            <div className="relative">
                                                <select
                                                    name="transportMode"
                                                    value={formData.transportMode}
                                                    onChange={handleChange}
                                                    disabled={!isEditing}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all appearance-none"
                                                >
                                                    <option>None / Walking</option>
                                                    <option>Bike</option>
                                                    <option>Bike (Motor)</option>
                                                    <option>Car</option>
                                                    <option>Van / Truck</option>
                                                </select>
                                                <FiTruck className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {isEditing && (
                                <div className="flex justify-end space-x-4 animate-fade-in pb-10">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center space-x-2"
                                    >
                                        <FiSave />
                                        <span>Update Profile</span>
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Right Column: SECTION 4: VOLUNTEER ACTIVITY SUMMARY */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                    <FiActivity className="mr-2 text-indigo-600" /> Activity Summary
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100">
                                    <div>
                                        <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Completed</p>
                                        <p className="text-2xl font-black text-green-800">{stats.deliveriesCompleted}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-green-200 text-green-700 rounded-full flex items-center justify-center">
                                        <FiCheckCircle className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <div>
                                        <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Active</p>
                                        <p className="text-2xl font-black text-orange-800">{stats.activeDeliveries}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center">
                                        <FiTruck className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <div>
                                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Hours</p>
                                        <p className="text-2xl font-black text-indigo-800">{stats.hoursVolunteered}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-indigo-200 text-indigo-700 rounded-full flex items-center justify-center">
                                        <FiClock className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 5: ACCOUNT SETTINGS */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                    <FiLock className="mr-2 text-indigo-600" /> Account Settings
                                </h2>
                            </div>
                            <div className="p-4 space-y-2">
                                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors group">
                                    <div className="flex items-center space-x-3">
                                        <FiLock className="text-slate-400 group-hover:text-indigo-600" />
                                        <span className="font-semibold">Change Password</span>
                                    </div>
                                    <span className="text-slate-300">→</span>
                                </button>
                                <div className="pt-4 mt-4 border-t border-slate-100">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-bold border border-red-100"
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

export default VolunteerProfile;
