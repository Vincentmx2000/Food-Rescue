import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';
import type { User } from '../../types';
import { FiSearch, FiCheckCircle, FiSlash } from 'react-icons/fi';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
    const [roleFilter, setRoleFilter] = useState<'all' | 'donor' | 'ngo' | 'volunteer'>('all');

    // Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusClick = (user: User) => {
        if (user.role === 'admin') return;
        setSelectedUser(user);
        setIsStatusModalOpen(true);
    };

    const handleVerifyClick = (user: User) => {
        if (user.role === 'admin') return;
        setSelectedUser(user);
        setIsVerifyModalOpen(true);
    };

    const confirmVerifyChange = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await api.toggleVerifyUser(selectedUser.id);
            setUsers(users.map(u =>
                u.id === selectedUser.id ? { ...u, isVerified: !u.isVerified } : u
            ));
            setIsVerifyModalOpen(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Failed to update user verification', error);
        } finally {
            setActionLoading(false);
        }
    };

    const confirmStatusChange = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            const newStatus = selectedUser.status === 'active' ? 'blocked' : 'active';
            await api.updateUser(selectedUser.id, { status: newStatus });
            setUsers(users.map(u =>
                u.id === selectedUser.id ? { ...u, status: newStatus } : u
            ));
            setIsStatusModalOpen(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Failed to update user status', error);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesStatus && matchesRole;
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'donor': return 'bg-primary-600 text-white';
            case 'ngo': return 'bg-blue-600 text-white';
            case 'volunteer': return 'bg-purple-600 text-white';
            case 'admin': return 'bg-black text-white';
            default: return 'bg-slate-200 text-slate-700';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold mt-6 uppercase tracking-[0.3em] text-[10px]">Loading user directory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
                <div className="mb-16">
                    <div className="inline-flex items-center space-x-2 text-primary-600 font-bold uppercase tracking-widest text-xs mb-4">
                        <span className="w-8 h-[2px] bg-primary-600"></span>
                        <span>User Management</span>
                    </div>
                    <h1 className="text-6xl font-black text-black tracking-tighter leading-none mb-4">
                        User <span className="text-primary-600">Directory</span>
                    </h1>
                </div>

                <div className="mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="relative group w-full md:w-96">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-primary-600 transition-all font-bold placeholder:text-slate-300"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:border-primary-600 transition-all"
                        >
                            <option value="all">Every Status</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                        </select>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as any)}
                            className="px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:border-primary-600 transition-all"
                        >
                            <option value="all">Every Role</option>
                            <option value="donor">Donors</option>
                            <option value="ngo">NGOs</option>
                            <option value="volunteer">Volunteers</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white border-2 border-slate-100 rounded-[3rem] overflow-hidden shadow-xl shadow-slate-200/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b-2 border-slate-100">
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User Details</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User Role</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verification Status</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Organization</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Account Status</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-slate-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center">
                                                <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center font-black text-lg mr-6 group-hover:scale-110 group-hover:bg-primary-600 transition-all">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-black text-lg tracking-tight uppercase group-hover:text-primary-600 transition-colors">{user.name}</p>
                                                    <p className="text-xs font-bold text-slate-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getRoleBadgeColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8">
                                            {user.role === 'donor' ? (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">N/A</span>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-3 h-3 rounded-full ${user.isVerified ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${user.isVerified ? 'text-blue-600' : 'text-slate-400'}`}>
                                                        {user.isVerified ? 'Verified' : 'Pending'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors">{user.organization || 'Independent Entity'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">User ID: {user.id.slice(0, 8)}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center space-x-2">
                                                <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-600'}`}></span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${user.status === 'active' ? 'text-emerald-600' : 'text-red-700'}`}>
                                                    {user.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            {user.role !== 'admin' && (
                                                <div className="flex justify-end items-center gap-3">
                                                    {(user.role === 'ngo' || user.role === 'volunteer') && (
                                                        <button
                                                            onClick={() => handleVerifyClick(user)}
                                                            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all
                                                                ${user.isVerified
                                                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}
                                                        >
                                                            {user.isVerified ? 'Verified' : 'Verify Now'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleStatusClick(user)}
                                                        className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all
                                                            ${user.status === 'active'
                                                                ? 'bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white'
                                                                : 'bg-black text-white hover:bg-primary-600'}`}
                                                    >
                                                        {user.status === 'active' ? 'Block Account' : 'Unblock Account'}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {isStatusModalOpen && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-12 relative overflow-hidden text-center">
                        <div className={`w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center mb-8 border-4 ${selectedUser.status === 'active' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-primary-50 border-primary-100 text-primary-600'}`}>
                            {selectedUser.status === 'active' ? <FiSlash size={40} /> : <FiCheckCircle size={40} />}
                        </div>
                        <h3 className="text-3xl font-black text-black tracking-tighter uppercase mb-4">
                            {selectedUser.status === 'active' ? 'Block Account?' : 'Unblock Account?'}
                        </h3>
                        <p className="text-slate-500 font-bold mb-10 leading-relaxed">
                            Update the account status for <span className="text-black">{selectedUser.name}</span>.
                            This will change the user's login access immediately.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsStatusModalOpen(false)}
                                className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-sans"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                disabled={actionLoading}
                                className={`px-8 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl font-sans
                                    ${selectedUser.status === 'active' ? 'bg-red-600' : 'bg-black'}`}
                            >
                                {actionLoading ? 'Updating...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Verification Modal */}
            {isVerifyModalOpen && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-12 relative overflow-hidden text-center">
                        <div className={`w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center mb-8 border-4 ${selectedUser.isVerified ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                            <FiCheckCircle size={40} />
                        </div>
                        <h3 className="text-3xl font-black text-black tracking-tighter uppercase mb-4">
                            {selectedUser.isVerified ? 'Remove Verification?' : 'Verify User?'}
                        </h3>
                        <p className="text-slate-500 font-bold mb-10 leading-relaxed">
                            {selectedUser.isVerified
                                ? `Downgrade ${selectedUser.name} to unverified status. They will no longer be able to claim food donations.`
                                : `Grant verification status to ${selectedUser.name}. This will allow them to claim available food and start missions.`}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsVerifyModalOpen(false)}
                                className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-sans"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmVerifyChange}
                                disabled={actionLoading}
                                className={`px-8 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-xl font-sans
                                    ${selectedUser.isVerified ? 'bg-slate-400' : 'bg-blue-600'}`}
                            >
                                {actionLoading ? 'Saving...' : 'Confirm Status'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
