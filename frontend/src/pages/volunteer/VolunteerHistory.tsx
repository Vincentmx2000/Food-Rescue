import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { FiPackage, FiTruck } from 'react-icons/fi';

import DonationCard from '../../components/DonationCard';

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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12 animate-fade-in text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-900 mb-2 flex items-center justify-center md:justify-start">
                        <FiTruck className="mr-4 text-primary-600" /> Mission History
                    </h1>
                    <p className="text-xl text-slate-500 font-medium tracking-tight">Track all your amazing rescue missions and see the impact you've made.</p>
                </div>

                {deliveries.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiPackage className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">No Missions Yet</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                            You haven't been assigned any deliveries yet. Head over to the Available Deliveries page to accept a task!
                        </p>
                        <Link
                            to="/volunteer/deliveries"
                            className="inline-flex px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 transition-all uppercase tracking-widest text-xs"
                        >
                            Find Available Tasks
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {deliveries.map((delivery) => {
                            const isMyTask = delivery.volunteerId === user?.id || (delivery.volunteerId as any) === (user as any)?._id;
                            const isAssigned = delivery.status === 'ASSIGNED' || delivery.status === 'VOLUNTEER_ASSIGNED';
                            const isOpen = !delivery.volunteerId && delivery.status === 'OPEN';

                            let action = undefined;
                            if ((isAssigned || isOpen) && isMyTask) {
                                action = {
                                    label: completingId === delivery.id ? 'Working...' : 'Mark Picked Up',
                                    onClick: () => handleMarkPickedUp(delivery.id)
                                };
                            } else if ((isAssigned || isOpen) && !isMyTask) {
                                action = {
                                    label: completingId === delivery.id ? 'Starting...' : 'Start This Pickup',
                                    onClick: async () => {
                                        if (!user) return;
                                        setCompletingId(delivery.id);
                                        try {
                                            await api.acceptTask(delivery.id);
                                            fetchMyDeliveries();
                                            alert('Task accepted! You can now pick up the donation.');
                                        } catch (e) {
                                            alert('Failed to accept task.');
                                        } finally {
                                            setCompletingId(null);
                                        }
                                    }
                                };
                            } else if (delivery.status === 'PICKED_UP' && isMyTask) {
                                action = {
                                    label: completingId === delivery.id ? 'Confirming...' : 'Confirm Distribution',
                                    variant: 'primary' as const,
                                    onClick: () => handleMarkDistributed(delivery.id)
                                };
                            }

                            return (
                                <DonationCard
                                    key={delivery.id}
                                    donation={delivery.donation}
                                    linkTo={`/volunteer/donation/${delivery.donation.id || delivery.donation._id}`}
                                    action={action}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VolunteerHistory;
