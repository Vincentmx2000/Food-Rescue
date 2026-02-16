import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiClock, FiMapPin, FiPackage } from 'react-icons/fi';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';

const VolunteerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [availableTasks, setAvailableTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const tasks = await api.getAvailableTasks();
                setAvailableTasks(tasks.slice(0, 3)); // Show top 3
            } catch (error) {
                console.error('Failed to fetch tasks', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">
                        Welcome back, <span className="text-primary-600">{user?.name}</span>!
                    </h1>
                    <p className="text-slate-600 mt-2">Ready to make a difference today?</p>
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={() => window.location.href = '/volunteer/deliveries'}
                            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                        >
                            Find Deliveries
                        </button>
                        <button
                            onClick={() => window.location.href = '/volunteer/history'}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
                        >
                            My Deliveries
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="stat-card">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                                <FiPackage className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Available Deliveries</p>
                                <p className="text-2xl font-bold text-slate-800">12</p>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-full bg-green-100 text-green-600">
                                <FiClock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Hours Volunteered</p>
                                <p className="text-2xl font-bold text-slate-800">24</p>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                                <FiMapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Area</p>
                                <p className="text-lg font-semibold text-slate-800">{user?.address || 'Not Set'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Available Pickups Section (Mock) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Urgent Pickups Near You</h2>
                    <div className="space-y-4">
                        {availableTasks.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-500">No urgent pickups available at the moment.</p>
                            </div>
                        ) : (
                            availableTasks.map((task: any) => (
                                <div key={task.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors flex justify-between items-center group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">
                                            📦
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{task.donationId?.foodType}</h3>
                                            <p className="text-sm text-slate-500">{task.donationId?.pickupLocation || task.donationId?.address}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.location.href = `/volunteer/donation/${task.donationId?.id || task.donationId?._id}`}
                                        className="px-4 py-2 bg-primary-50 text-primary-600 rounded-lg font-medium group-hover:bg-primary-600 group-hover:text-white transition-all"
                                    >
                                        View Details
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VolunteerDashboard;
