import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiBaseUrl } from '../services/api.js';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'donor',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isWakingUp, setIsWakingUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        // Prevent duplicate login submissions while request is in flight
        if (loading) return;

        setError('');
        setLoading(true);
        setIsWakingUp(false);

        // Notify user if backend is waking up from free-tier idle sleep (>4s)
        const wakingTimer = setTimeout(() => {
            setIsWakingUp(true);
        }, 4000);

        try {
            await login(formData.email, formData.password, formData.role);

            // Navigate based on role
            switch (formData.role) {
                case 'donor':
                    navigate('/donor/dashboard');
                    break;
                case 'ngo':
                    navigate('/ngo/dashboard');
                    break;
                case 'volunteer':
                    navigate('/volunteer/dashboard');
                    break;
            }
        } catch (err) {
            setError(err.userMessage || err.response?.data?.message || err.message || 'Login failed. Please try again.');
        } finally {
            clearTimeout(wakingTimer);
            setLoading(false);
            setIsWakingUp(false);
        }
    };

    const apiBase = getApiBaseUrl();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 animate-slide-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h1>
                    <p className="text-slate-500">Welcome back to Food Rescue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Role Selection */}
                    <div className="bg-slate-50 p-1 rounded-xl flex overflow-x-auto">
                        {['donor', 'ngo', 'volunteer'].map((role) => (
                            <button
                                key={role}
                                type="button"
                                disabled={loading}
                                onClick={() => setFormData({ ...formData, role })}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${formData.role === role
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            disabled={loading}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400 disabled:opacity-60"
                            placeholder="name@example.com"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 ml-1">Password</label>
                        <div className="relative group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                disabled={loading}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400 group-hover:border-slate-300 disabled:opacity-60"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                            >
                                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Cold start waking notice */}
                    {isWakingUp && (
                        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center space-x-2">
                            <svg className="animate-spin h-4 w-4 text-amber-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            <span>The server is waking up from idle mode (Render free tier). This can take 30–50 seconds on the first request. Please wait...</span>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center space-y-1">
                            <p>{error}</p>
                            <button
                                type="button"
                                onClick={() => handleSubmit()}
                                className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (isWakingUp ? 'Waking server & signing in...' : 'Signing in...') : 'Sign In'}
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Or sign in with</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => window.location.href = `${apiBase}/auth/google?role=${formData.role.toUpperCase()}`}
                            className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group disabled:opacity-50"
                        >
                            <FcGoogle className="mr-2 text-xl group-hover:scale-110 transition-transform" />
                            <span className="font-semibold text-slate-600 text-sm">Google</span>
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => window.location.href = `${apiBase}/auth/facebook?role=${formData.role.toUpperCase()}`}
                            className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group disabled:opacity-50"
                        >
                            <FaFacebook className="mr-2 text-xl text-[#1877F2] group-hover:scale-110 transition-transform" />
                            <span className="font-semibold text-slate-600 text-sm">Facebook</span>
                        </button>
                    </div>

                    {/* Register Link */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Don't have an account?{' '}
                        <Link to={formData.role === 'volunteer' ? '/register-volunteer' : '/register'} className="text-primary-600 font-bold hover:underline">
                            Register here
                        </Link>
                    </p>

                </form>
            </div>
        </div>
    );
};

export default Login;

