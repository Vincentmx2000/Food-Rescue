import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
// import type { Donation } from '../../types'; // Removed as any[] is used for now
import { FiMapPin, FiPackage, FiTruck, FiUser } from 'react-icons/fi';

const VolunteerHistory: React.FC = () => {
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState<any[]>([]); // Using any[] to handle the Task + nested Donation structure
    const [loading, setLoading] = useState(true);
    const [completingId, setCompletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchMyDeliveries();
    }, [user]);

    const fetchMyDeliveries = async () => {
        if (!user) {
            console.log('No user in VolunteerHistory, skipping fetch');
            return;
        }
        try {
            console.log('Fetching tasks for user ID:', user.id);
            setLoading(true);

            let assigned: any[] = [];
            let history: any[] = [];

            try {
                assigned = await api.getAssignedTasks();
                console.log('Assigned tasks response:', assigned);
            } catch (e) {
                console.error('Error fetching assigned tasks:', e);
            }

            try {
                history = await api.getRescueHistory();
                console.log('History tasks response:', history);
            } catch (e) {
                console.error('Error fetching history tasks:', e);
            }

            // Combine and map
            const rawTasks = [...(Array.isArray(assigned) ? assigned : []), ...(Array.isArray(history) ? history : [])];
            console.log('Raw tasks combined:', rawTasks.length);

            const allDeliveries = rawTasks
                .filter(task => task && task.donationId)
                .map(task => ({
                    ...task,
                    id: task.id || task._id,
                    donation: task.donationId
                }));

            console.log('Final mapped deliveries:', allDeliveries);
            setDeliveries(allDeliveries);
        } catch (error) {
            console.error('Fatal error in fetchMyDeliveries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPickedUp = async (taskId: string) => {
        setCompletingId(taskId);
        try {
            const delivery = deliveries.find(d => d.id === taskId);
            // Get string IDs
            const donationId = typeof delivery.donation === 'string'
                ? delivery.donation
                : (delivery.donation?.id || delivery.donation?._id || delivery.donationId);

            const taskObjectId = delivery.id || delivery._id;

            console.log(`Attempting pickup: Task=${taskObjectId}, Donation=${donationId}`);
            await api.pickupDonation(donationId, taskObjectId);

            // Refresh list to show updated status
            await fetchMyDeliveries();
            alert('Success! Donation marked as picked up.');
        } catch (error: any) {
            console.error('Failed to pick up delivery', error);
            const message = error.response?.data?.message || 'Failed to update status. Please try again.';
            alert(message);
        } finally {
            setCompletingId(null);
        }
    };

    const handleMarkDistributed = async (taskId: string) => {
        setCompletingId(taskId);
        try {
            const delivery = deliveries.find(d => d.id === taskId);
            const donationId = typeof delivery.donation === 'string'
                ? delivery.donation
                : (delivery.donation?.id || delivery.donation?._id || delivery.donationId);

            const taskObjectId = delivery.id || delivery._id;

            await api.completeDonation(donationId, [], taskObjectId);

            // Refresh list
            await fetchMyDeliveries();
            alert('Great job! Donation marked as distributed.');
        } catch (error: any) {
            console.error('Failed to distribute delivery', error);
            const message = error.response?.data?.message || 'Failed to update status. Please try again.';
            alert(message);
        } finally {
            setCompletingId(null);
        }
    };

    const getStatusInfo = (status: string) => {
        const map: Record<string, { label: string, classes: string }> = {
            'CLAIMED_BY_NGO': { label: 'Community Pickup', classes: 'bg-purple-100 text-purple-700 border-purple-200' },
            'ASSIGNED': { label: 'My Task', classes: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
            'VOLUNTEER_ASSIGNED': { label: 'My Task', classes: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
            'PICKED_UP': { label: 'Picked Up', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
            'DISTRIBUTED': { label: 'Distributed', classes: 'bg-green-100 text-green-700 border-green-200' },
            'DELIVERED': { label: 'Delivered', classes: 'bg-green-100 text-green-700 border-green-200' },
            'CANCELLED': { label: 'Cancelled', classes: 'bg-red-100 text-red-700 border-red-200' },
        };
        return map[status] || { label: status, classes: 'bg-slate-100 text-slate-700 border-slate-200' };
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
                        <FiTruck className="mr-3 text-primary-600" /> My Deliveries
                    </h1>
                    <p className="text-slate-600 ml-12">Track your assigned and completed pickups</p>
                </div>

                {loading === false && deliveries.length === 0 && (
                    <div className="text-xs text-slate-300 mb-2">Debug: 0 deliveries found in fetch</div>
                )}

                {deliveries.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-slate-200">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiPackage className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Deliveries Assigned</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-6">
                            You haven't been assigned any deliveries yet. Head over to the Available Deliveries page to accept a task!
                        </p>
                        <a
                            href="/volunteer/deliveries"
                            className="inline-flex px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all"
                        >
                            Find Available Tasks
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {deliveries.map((delivery) => {
                            const statusInfo = getStatusInfo(delivery.status);
                            return (
                                <div key={delivery.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full animate-slide-up">
                                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.classes}`}>
                                                {statusInfo.label}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const dId = delivery.donation?.id || delivery.donation?._id || delivery.donationId;
                                                    if (dId) window.location.href = `/volunteer/donation/${dId}`;
                                                }}
                                                className="text-xs text-primary-600 font-bold hover:underline"
                                            >
                                                Details →
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{delivery.donation?.foodType || 'Food Donation'}</h3>
                                        <div className="flex items-center text-slate-500 text-sm mt-1">
                                            <FiUser className="w-4 h-4 mr-1.5" />
                                            <span>{delivery.donation?.donorName || delivery.donation?.donorId?.name || 'Donor'}</span>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-4 flex-1">
                                        <div className="flex items-start">
                                            <FiMapPin className="w-5 h-5 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">Pickup Location</p>
                                                <p className="text-sm text-slate-600 line-clamp-2">{delivery.donation?.pickupLocation || delivery.donation?.address || 'See details'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <FiPackage className="w-5 h-5 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">Details</p>
                                                <p className="text-sm text-slate-600">{delivery.donation?.quantity || '-'} {delivery.donation?.unit || ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {(delivery.status === 'ASSIGNED' || delivery.status === 'VOLUNTEER_ASSIGNED' || (!delivery.volunteerId && delivery.status === 'OPEN')) && (
                                        <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                                            {(delivery.volunteerId === user?.id || (delivery.volunteerId as any) === (user as any)?._id) ? (
                                                <button
                                                    onClick={() => handleMarkPickedUp(delivery.id)}
                                                    disabled={!!completingId}
                                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                                >
                                                    {completingId === delivery.id ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <FiTruck className="mr-2" /> Mark as Picked Up
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        if (!user) return;
                                                        setCompletingId(delivery.id);
                                                        try {
                                                            // Corrected: pass taskId as first argument
                                                            await api.acceptTask(delivery.id);
                                                            fetchMyDeliveries();
                                                            alert('Task accepted! You can now pick up the donation.');
                                                        } catch (e) {
                                                            console.error('Failed to accept task:', e);
                                                            alert('Failed to accept broadcast task. It might have been claimed by someone else.');
                                                        } finally {
                                                            setCompletingId(null);
                                                        }
                                                    }}
                                                    disabled={!!completingId}
                                                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center"
                                                >
                                                    {completingId === delivery.id ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <FiTruck className="mr-2" /> Start This Pickup
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {(delivery.status === 'PICKED_UP' && (delivery.volunteerId === user?.id || (delivery.volunteerId as any) === (user as any)?._id)) && (
                                        <div className="p-4 bg-emerald-50 border-t border-emerald-100 mt-auto">
                                            <button
                                                onClick={() => handleMarkDistributed(delivery.id)}
                                                disabled={!!completingId}
                                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center font-bold"
                                            >
                                                {completingId === delivery.id ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <FiPackage className="mr-2" /> Confirm Distribution
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VolunteerHistory;
