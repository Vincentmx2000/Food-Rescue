import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { VolunteerTask } from '../../types';
import { FiPackage, FiTruck } from 'react-icons/fi';

import DonationCard from '../../components/DonationCard';

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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12 animate-fade-in text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-900 mb-2 flex items-center justify-center md:justify-start">
                        <FiTruck className="mr-4 text-primary-600" /> Available Missions
                    </h1>
                    <p className="text-xl text-slate-500 font-medium tracking-tight">Pick up donations from donors and deliver them to NGO centers.</p>
                </div>

                {tasks.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiPackage className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">No Missions Found</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            There are currently no broadcasted donations requiring pickup. Please check back later!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {tasks.map((task) => (
                            <DonationCard
                                key={task.id}
                                donation={task.donationId}
                                linkTo={`/volunteer/donation/${task.donationId.id || (task.donationId as any)._id}`}
                                action={{
                                    label: acceptingId === task.id ? 'Accepting...' : 'Accept Mission',
                                    onClick: () => handleAcceptDelivery(task.id)
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VolunteerDeliveries;
