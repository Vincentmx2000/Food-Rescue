import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [role, setRole] = useState<'donor' | 'ngo' | 'admin'>('donor');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        organization: '',
        address: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (newRole: 'donor' | 'ngo' | 'admin' | 'volunteer') => {
        if (newRole === 'volunteer') {
            navigate('/register-volunteer');
        } else {
            setRole(newRole);
        }
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
                role: role,
                organization: role === 'ngo' ? formData.organization : undefined,
                address: role === 'ngo' ? formData.address : undefined,
            });

            // Redirect based on role
            switch (role) {
                case 'donor':
                    navigate('/donor/dashboard');
                    break;
                case 'ngo':
                    navigate('/ngo/dashboard');
                    break;
                case 'admin':
                    navigate('/admin/dashboard');
                    break;
            }
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
                    <p className="text-slate-500">Join the Food Rescue mission</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Role Selection */}
                    <div className="bg-slate-50 p-1 rounded-xl flex overflow-x-auto mb-6">
                        {(['donor', 'ngo', 'admin', 'volunteer'] as const).map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => handleRoleChange(r)}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${role === r
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

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
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all placeholder:text-slate-400"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    {/* NGO Specific Fields */}
                    {role === 'ngo' && (
                        <>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-600 ml-1">Organization Name</label>
                                <input
                                    type="text"
                                    name="organization"
                                    required
                                    value={formData.organization}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all placeholder:text-slate-400"
                                    placeholder="Food Bank Inc."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-600 ml-1">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all placeholder:text-slate-400"
                                    placeholder="123 Main St, City"
                                />
                            </div>
                        </>
                    )}

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
                        {loading ? 'Creating Account...' : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
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

export default Register;
