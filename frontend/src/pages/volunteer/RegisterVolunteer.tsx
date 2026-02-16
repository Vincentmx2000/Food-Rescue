import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegisterVolunteer: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                address: formData.city, // Mapping city to address for now
                role: 'volunteer',
            });
            navigate('/volunteer/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 animate-slide-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Volunteer Sign Up</h1>
                    <p className="text-slate-500">Join our community of heroes</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 ml-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all placeholder:text-slate-400"
                            placeholder="John Doe"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 ml-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all placeholder:text-slate-400"
                            placeholder="name@example.com"
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 ml-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all placeholder:text-slate-400"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    {/* City / Area */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 ml-1">City / Area</label>
                        <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all placeholder:text-slate-400"
                            placeholder="New York, NY"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 ml-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all placeholder:text-slate-400"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 ml-1">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            required
                            minLength={6}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all placeholder:text-slate-400"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-[#FF8C00] hover:bg-[#E67E00] text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Creating Account...' : 'Register as Volunteer'}
                    </button>

                    {/* Login Link */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#FF8C00] font-bold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterVolunteer;
