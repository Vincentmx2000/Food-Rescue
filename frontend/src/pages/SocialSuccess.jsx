import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const SocialSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setAuthData } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const role = searchParams.get('role')?.toLowerCase();
        const name = searchParams.get('name');

        if (token && role) {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ name, role }));

            if (setAuthData) {
                setAuthData({ token, user: { name, role } });
            }

            navigate(`/${role}/dashboard`);
        } else {
            navigate('/login?error=social_failed');
        }
    }, [searchParams, navigate, setAuthData]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
                <h2 className="text-xl font-semibold text-slate-800">Completing sign in...</h2>
                <p className="text-slate-500">Please wait while we redirect you.</p>
            </div>
        </div>
    );
};

export default SocialSuccess;
