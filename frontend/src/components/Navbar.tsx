import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FiLogOut, FiMenu, FiX, FiBell } from 'react-icons/fi';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const { unreadCount, notifications, markAsRead } = useNotifications();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [notifDropdownOpen, setNotifDropdownOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };



    const getNavLinks = () => {
        if (!user) return [];

        switch (user.role.toLowerCase()) {
            case 'donor':
                return [
                    { to: '/donor/dashboard', label: 'Dashboard' },
                    { to: '/donor/create-donation', label: 'Create Donation' },
                    { to: '/donor/history', label: 'History' },
                    { to: '/donor/profile', label: 'Profile' },
                ];
            case 'ngo':
                return [
                    { to: '/ngo/dashboard', label: 'Dashboard' },
                    { to: '/ngo/browse', label: 'Browse Donations' },
                    { to: '/ngo/claimed', label: 'My Claims' },
                    { to: '/ngo/profile', label: 'Profile' },
                ];
            case 'admin':
                return [
                    { to: '/admin/dashboard', label: 'Dashboard' },
                    { to: '/admin/users', label: 'Users' },
                    { to: '/admin/donations', label: 'Donations' },
                ];
            case 'volunteer':
                return [
                    { to: '/volunteer/dashboard', label: 'Dashboard' },
                    { to: '/volunteer/deliveries', label: 'Food Posts' },
                    { to: '/volunteer/history', label: 'Accepted Pickups' },
                    { to: '/volunteer/profile', label: 'Profile' },
                ];
            default:
                return [];
        }
    };

    const navLinks = getNavLinks();

    return (
        <nav className="glass-card sticky top-0 z-50 mb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xl">FR</span>
                        </div>
                        <span className="text-xl font-bold gradient-text hidden sm:block">Food Rescue</span>
                    </Link>

                    {/* Desktop Navigation */}
                    {user && (
                        <div className="hidden md:flex items-center space-x-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="px-4 py-2 rounded-lg text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors font-medium"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* User Menu */}
                    {user ? (
                        <div className="hidden md:flex items-center space-x-4">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors relative"
                                >
                                    <FiBell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notifDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-slide-up">
                                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                            <h3 className="font-bold text-slate-800">Notifications</h3>
                                            <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.map(n => (
                                                    <div
                                                        key={n.id}
                                                        onClick={() => {
                                                            markAsRead(n.id);
                                                            if (n.donationId) navigate(`/volunteer/donation/${n.donationId}`);
                                                            setNotifDropdownOpen(false);
                                                        }}
                                                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}
                                                    >
                                                        <p className="text-sm font-bold text-slate-800">{n.title}</p>
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                                        <p className="text-[10px] text-slate-400 mt-2">{new Date(n.createdAt).toLocaleTimeString()}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-slate-400">
                                                    <FiBell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                    <p className="text-sm">No notifications yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg hover:bg-danger-50 hover:text-danger-600 transition-colors"
                                title="Logout"
                            >
                                <FiLogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center space-x-4">
                            <Link
                                to="/login"
                                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all font-medium"
                            >
                                Login
                            </Link>
                        </div>
                    )}

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-slate-100"
                    >
                        {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-slate-200 animate-slide-down">
                        <div className="flex flex-col space-y-2">
                            {user ? (
                                <>
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="px-4 py-2 rounded-lg text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors font-medium"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                    <div className="px-4 py-2 border-t border-slate-200 mt-2">
                                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="mx-4 px-4 py-2 rounded-lg bg-danger-50 text-danger-600 hover:bg-danger-100 transition-colors font-medium flex items-center space-x-2"
                                    >
                                        <FiLogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="mx-4 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium text-center"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
