import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SocialSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setAuthData } = useAuth(); // Assuming useAuth provides a way to manually set data

    useEffect(() => {
        const token = searchParams.get('token');
        const role = searchParams.get('role')?.toLowerCase();
        const name = searchParams.get('name');

        if (token && role) {
            // Save to localStorage or context
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ name, role }));

            // If AuthContext has a specific method to update state from token:
            if (setAuthData) {
                setAuthData({ token, user: { name, role } });
            }

            // Redirect to dashboard
            navigate(`/${role}/dashboard`);
        } else {
            navigate('/login?error=social_failed');
        }
    }, [searchParams, navigate, setAuthData]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF8C00] mb-4"></div>
                <h2 className="text-xl font-semibold text-slate-800">Completing sign in...</h2>
                <p className="text-slate-500">Please wait while we redirect you.</p>
            </div>
        </div>
    );
};

export default SocialSuccess;
