import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { FiLogOut, FiMenu, FiX, FiBell } from 'react-icons/fi';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { unreadCount, notifications, markAsRead } = useNotifications();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [notifDropdownOpen, setNotifDropdownOpen] = React.useState(false);

    const handleLogout = () => {
        const isAdmin = user?.role.toLowerCase() === 'admin';
        logout(isAdmin ? '/admin/login' : '/');
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
        <nav className="bg-white/80 sticky top-0 z-50 mb-6 backdrop-blur-xl border-b-2 border-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6">
                            <span className="text-white font-black text-xl">FR</span>
                        </div>
                        <span className="text-2xl font-black tracking-tighter hidden sm:block text-black">
                            Food<span className="text-primary-500">Rescue</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    {user && (
                        <div className="hidden md:flex items-center space-x-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest text-slate-500 hover:text-black hover:bg-slate-50 transition-all"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* User Menu */}
                    {user ? (
                        <div className="hidden md:flex items-center space-x-6">
                            <div className="relative">
                                <button
                                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                                    className="p-2.5 rounded-xl bg-slate-50 text-black border-2 border-slate-100 hover:border-primary-500 transition-colors relative"
                                >
                                    <FiBell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notifDropdownOpen && (
                                    <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2rem] shadow-2xl border-2 border-slate-100 overflow-hidden z-50 animate-slide-up">
                                        <div className="p-6 bg-slate-50 border-b-2 border-slate-100 flex justify-between items-center">
                                            <h3 className="font-black text-black uppercase tracking-tight">Notifications</h3>
                                            <span className="text-[10px] bg-black text-white px-3 py-1 rounded-full font-black uppercase tracking-widest">{unreadCount} New</span>
                                        </div>
                                        <div className="max-h-[30rem] overflow-y-auto divide-y-2 divide-slate-50">
                                            {notifications.length > 0 ? (
                                                notifications.map(n => (
                                                    <div
                                                        key={n.id}
                                                        onClick={() => {
                                                            markAsRead(n.id);
                                                            if (n.link) navigate(n.link);
                                                            setNotifDropdownOpen(false);
                                                        }}
                                                        className={`p-6 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-primary-50/50' : ''} group`}
                                                    >
                                                        <p className="text-sm font-black text-black uppercase tracking-tight group-hover:text-primary-500 transition-colors">{n.title}</p>
                                                        <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">{n.message}</p>
                                                        <div className="flex items-center space-x-2 mt-4">
                                                            <div className="w-1 h-4 bg-primary-500 rounded-full"></div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-12 text-center text-slate-400">
                                                    <FiBell className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                                    <p className="text-xs font-black uppercase tracking-widest">No Notifications</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-4 pl-4 border-l-2 border-slate-100">
                                <div className="text-right">
                                    <p className="text-sm font-black text-black uppercase tracking-tight">{user.name}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-500">{user.role}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-3 bg-black text-white rounded-xl hover:bg-primary-500 transition-all"
                                    title="Terminate Session"
                                >
                                    <FiLogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center space-x-4">
                            <Link
                                to="/login"
                                className="px-8 py-3 bg-black text-white rounded-full hover:bg-primary-500 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200"
                            >
                                Login
                            </Link>
                        </div>
                    )}

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-3 rounded-xl bg-slate-50 text-black border-2 border-slate-100"
                    >
                        {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-8 border-t-2 border-slate-100 animate-slide-down">
                        <div className="flex flex-col space-y-3">
                            {user ? (
                                <>
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-black transition-all"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                    <div className="px-6 py-6 border-t-2 border-slate-50 mt-4">
                                        <p className="text-sm font-black text-black uppercase tracking-tight">{user.name}</p>
                                        <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">{user.role}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="mx-6 px-6 py-4 rounded-2xl bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-primary-500 transition-all flex items-center justify-center space-x-3"
                                    >
                                        <FiLogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="mx-6 px-6 py-4 rounded-2xl bg-black text-white font-black text-xs uppercase tracking-widest text-center shadow-lg"
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
