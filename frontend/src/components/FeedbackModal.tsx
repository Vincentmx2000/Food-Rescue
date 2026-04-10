import React, { useState } from 'react';
import { api } from '../services/api';

interface FeedbackModalProps {
    donationId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ donationId, isOpen, onClose, onSuccess }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.submitFeedback({ donationId, rating, comment });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 leading-tight">Share Your Experience</h3>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg animate-shake">
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Rating</label>
                            <div className="flex items-center gap-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1 transition-all"
                                    >
                                        <svg
                                            className={`w-10 h-10 transition-colors ${
                                                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current'
                                            }`}
                                            viewBox="0 0 24 24"
                                            stroke="none"
                                        >
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </button>
                                ))}
                                <span className="ml-2 text-lg font-bold text-emerald-600">{rating}/5</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Comment</label>
                            <textarea
                                required
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-0 transition-all resize-none h-32 text-gray-700 bg-gray-50/50"
                                placeholder="How was the food quality? (e.g. well-packed, fresh, enough quantity)"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3.5 border-2 border-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-all uppercase tracking-wider text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-emerald-200 uppercase tracking-wider text-sm"
                            >
                                {loading ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
