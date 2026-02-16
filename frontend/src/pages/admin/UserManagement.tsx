import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';
import type { User } from '../../types';
import { FiUsers, FiSearch, FiCheckCircle, FiXCircle, FiSlash } from 'react-icons/fi';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
    const [roleFilter, setRoleFilter] = useState<'all' | 'donor' | 'ngo' | 'volunteer'>('all');

    // Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
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
        // Admin cannot block themselves
        if (user.role === 'admin') return;

        setSelectedUser(user);
        setIsStatusModalOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!selectedUser) return;

        setActionLoading(true);
        try {
            const newStatus = selectedUser.status === 'active' ? 'blocked' : 'active';
            await api.updateUser(selectedUser.id, { status: newStatus });

            // Update local state
            setUsers(users.map(u =>
                u.id === selectedUser.id ? { ...u, status: newStatus } : u
            ));

            setIsStatusModalOpen(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Failed to update user status', error);
            alert('Failed to update user status');
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
            case 'donor': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'ngo': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'volunteer': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'admin': return 'bg-slate-100 text-slate-800 border-slate-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        <FiUsers className="mr-3" /> User Management
                    </h1>
                    <p className="text-slate-600 ml-11">Monitor and manage user accounts</p>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                    </div>

                    <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as any)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white min-w-[150px]"
                        >
                            <option value="all">All Roles</option>
                            <option value="donor">Donors</option>
                            <option value="ngo">NGOs</option>
                            <option value="volunteer">Volunteers</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white min-w-[150px]"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">User</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Role</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Contact</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Joined</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No users found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold mr-3 uppercase">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{user.name}</p>
                                                        <p className="text-xs text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-600">{user.phone || 'N/A'}</p>
                                                {user.organization && (
                                                    <p className="text-xs text-slate-400 mt-0.5">{user.organization}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                    ${user.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'}`}>
                                                    {user.status === 'active' ? (
                                                        <FiCheckCircle className="mr-1 w-3 h-3" />
                                                    ) : (
                                                        <FiXCircle className="mr-1 w-3 h-3" />
                                                    )}
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleStatusClick(user)}
                                                        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors
                                                            ${user.status === 'active'
                                                                ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                                                                : 'text-green-600 hover:bg-green-50 hover:text-green-700'}`}
                                                    >
                                                        {user.status === 'active' ? 'Block' : 'Unblock'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {isStatusModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
                        <div className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full mb-4 ${selectedUser.status === 'active' ? 'bg-red-100' : 'bg-green-100'}`}>
                            {selectedUser.status === 'active' ? (
                                <FiSlash className="w-6 h-6 text-red-600" />
                            ) : (
                                <FiCheckCircle className="w-6 h-6 text-green-600" />
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                            {selectedUser.status === 'active' ? 'Block User?' : 'Unblock User?'}
                        </h3>
                        <p className="text-center text-slate-600 mb-6">
                            Are you sure you want to {selectedUser.status === 'active' ? 'block' : 'unblock'} <strong>{selectedUser.name}</strong>?
                            {selectedUser.status === 'active' && ' They will no longer be able to log in.'}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsStatusModalOpen(false)}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                disabled={actionLoading}
                                className={`px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center justify-center
                                    ${selectedUser.status === 'active'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {actionLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    selectedUser.status === 'active' ? 'Block' : 'Unblock'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
