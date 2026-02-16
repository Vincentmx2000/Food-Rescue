import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { VolunteerTask } from '../../types';
import { FiMapPin, FiClock, FiPackage, FiTruck, FiUser, FiInfo, FiCheckCircle } from 'react-icons/fi';

const VolunteerDeliveries: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<VolunteerTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    useEffect(() => {
        fetchAvailableDeliveries();
    }, []);

    const fetchAvailableDeliveries = async () => {
        try {
            const availableTasks = await api.getAvailableTasks();
            setTasks(availableTasks);
        } catch (error) {
            console.error('Failed to fetch deliveries', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptDelivery = async (taskId: string) => {
        if (!user) return;
        setAcceptingId(taskId);
        try {
            await api.acceptTask(taskId);
            navigate('/volunteer/dashboard');
        } catch (error: any) {
            console.error('Failed to accept delivery', error);
            const message = error.response?.data?.message || 'Failed to accept delivery. It may have been claimed by someone else.';
            alert(message);
            fetchAvailableDeliveries(); // Refresh list 
        } finally {
            setAcceptingId(null);
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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        <FiTruck className="mr-3 text-primary-600" /> Available Deliveries
                    </h1>
                    <p className="text-slate-600 ml-12">Claim a donation to pickup and deliver</p>
                </div>

                {tasks.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-slate-200">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiPackage className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Deliveries Available</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            There are currently no broadcasted donations requiring pickup. Please check back later!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tasks.map((task) => {
                            const donation = task.donationId;
                            const ngo = task.ngoId;
                            return (
                                <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full animate-slide-up">
                                    {/* Header */}
                                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-purple-100 text-purple-700 border-purple-200">
                                                Broadcast Pickup
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">#{task.id}</span>
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-900 line-clamp-1" title={donation.foodType}>
                                            {donation.foodType}
                                        </h3>
                                        <div className="flex flex-col space-y-1 mt-1">
                                            <div className="flex items-center text-slate-500 text-sm">
                                                <FiUser className="w-4 h-4 mr-1.5" />
                                                <span>Donor: {donation.donorName}</span>
                                            </div>
                                            <div className="flex items-center text-purple-600 text-sm font-medium">
                                                <FiCheckCircle className="w-4 h-4 mr-1.5" />
                                                <span>NGO: {ngo.organization || ngo.name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 space-y-4 flex-1">
                                        <div className="flex items-start">
                                            <FiPackage className="w-5 h-5 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">Quantity</p>
                                                <p className="text-sm text-slate-600">{donation.quantity} {donation.unit}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <FiMapPin className="w-5 h-5 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">Pickup Location</p>
                                                <p className="text-sm text-slate-600 line-clamp-2" title={donation.pickupLocation}>
                                                    {donation.pickupLocation}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <FiClock className="w-5 h-5 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">Expires</p>
                                                <p className="text-sm text-slate-600">
                                                    {new Date(donation.expiryDate).toLocaleDateString()}
                                                    {' '}at{' '}
                                                    {new Date(donation.expiryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        {donation.description && (
                                            <div className="flex items-start bg-blue-50 p-3 rounded-lg">
                                                <FiInfo className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                                                <p className="text-xs text-blue-800 line-clamp-2">{donation.description}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                                        <button
                                            onClick={() => handleAcceptDelivery(task.id)}
                                            disabled={!!acceptingId}
                                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                        >
                                            {acceptingId === task.id ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    Accept Delivery
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VolunteerDeliveries;
