import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'donor',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

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
                case 'admin':
                    navigate('/admin/dashboard');
                    break;
                case 'volunteer':
                    navigate('/volunteer/dashboard');
                    break;
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 animate-slide-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h1>
                    <p className="text-slate-500">Welcome back to Food Rescue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Role Selection - Keeping this but styling it cleaner */}
                    <div className="bg-slate-50 p-1 rounded-xl flex overflow-x-auto">
                        {['donor', 'ngo', 'admin', 'volunteer'].map((role) => (
                            <button
                                key={role}
                                type="button"
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
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all placeholder:text-slate-400"
                            placeholder="name@example.com"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 ml-1">Password</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                        className="w-full py-3.5 bg-[#FF8C00] hover:bg-[#E67E00] text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
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
                            onClick={() => window.location.href = `http://localhost:5000/api/v1/auth/google?role=${formData.role.toUpperCase()}`}
                            className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                            <FcGoogle className="mr-2 text-xl group-hover:scale-110 transition-transform" />
                            <span className="font-semibold text-slate-600 text-sm">Google</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.href = `http://localhost:5000/api/v1/auth/facebook?role=${formData.role.toUpperCase()}`}
                            className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                            <FaFacebook className="mr-2 text-xl text-[#1877F2] group-hover:scale-110 transition-transform" />
                            <span className="font-semibold text-slate-600 text-sm">Facebook</span>
                        </button>
                    </div>

                    {/* Register Link */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Don't have an account?{' '}
                        <Link to={formData.role === 'volunteer' ? '/register-volunteer' : '/register'} className="text-[#FF8C00] font-bold hover:underline">
                            Register here
                        </Link>
                    </p>

                    {/* Demo Credentials Hint (collapsible or discreet) */}
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                        <p className="font-medium mb-1">Demo Credentials:</p>
                        <p>{formData.role}@example.com / password123</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
