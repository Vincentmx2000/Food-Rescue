import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import Navbar from '../../components/Navbar.jsx';
import { FiUpload, FiMapPin, FiCalendar, FiType, FiCrosshair, FiImage, FiX } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for Leaflet default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const CreateDonation = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState([51.505, -0.09]); // Default: London
    const [markerPosition, setMarkerPosition] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = React.useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        foodCategory: 'Veg',
        foodType: '',
        quantity: '',
        unit: 'servings',
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Default to tomorrow
        pickupLocation: user?.address || '',
        description: '',
        latitude: null,
        longitude: null
    });

    // Component to handle map clicks
    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                setMarkerPosition([e.latlng.lat, e.latlng.lng]);
                setFormData(prev => ({
                    ...prev,
                    latitude: e.latlng.lat,
                    longitude: e.latlng.lng
                }));
                fetchAddressFromCoords(e.latlng.lat, e.latlng.lng);
            },
        });

        return markerPosition ? <Marker position={markerPosition} /> : null;
    };

    // Component to update map view when center changes
    const MapUpdater = ({ center }) => {
        const map = useMapEvents({});
        useEffect(() => {
            map.setView(center, map.getZoom());
        }, [center, map]);
        return null;
    };

    const fetchAddressFromCoords = async (lat, lng) => {
        setFormData(prev => ({
            ...prev,
            pickupLocation: `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        }));
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setMapCenter([latitude, longitude]);
                setMarkerPosition([latitude, longitude]);
                setFormData(prev => ({
                    ...prev,
                    latitude,
                    longitude
                }));
                fetchAddressFromCoords(latitude, longitude);
                setLocationLoading(false);
            },
            (error) => {
                console.error('Error getting location', error);
                alert('Unable to retrieve your location');
                setLocationLoading(false);
            }
        );
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);
            const newImages = files.map(file => URL.createObjectURL(file));
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (formData.latitude === null || formData.longitude === null) {
            alert('Please select a location on the map');
            setLoading(false);
            return;
        }

        try {
            await api.createDonation({
                foodCategory: formData.foodCategory,
                foodType: formData.foodType,
                quantity: Number(formData.quantity),
                unit: formData.unit,
                expiryTime: formData.expiryDate,
                address: formData.pickupLocation,
                description: formData.description,
                latitude: formData.latitude,
                longitude: formData.longitude,
                images: selectedFiles
            });
            navigate('/donor/dashboard');
        } catch (error) {
            console.error('Failed to create donation', error);
            const message = error.response?.data?.message || 'Failed to create donation. Please try again.';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="bg-gradient-to-r from-orange-400 to-orange-500 p-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold mb-2">Donate Food</h1>
                            <p className="opacity-90">Share your surplus food with those in need.</p>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-12"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Section 1: Food Details */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800 border-b pb-2 flex items-center">
                                <FiType className="mr-2 text-primary-500" /> Food Details
                            </h2>

                            <div className="mb-6">
                                <label className="text-sm font-semibold text-slate-700 mb-3 block">Dietary Category</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer px-4 py-4 rounded-xl border-2 transition-all ${formData.foodCategory === 'Veg' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                        <input type="radio" name="foodCategory" value="Veg" checked={formData.foodCategory === 'Veg'} onChange={handleChange} className="hidden" />
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.foodCategory === 'Veg' ? 'border-emerald-500' : 'border-slate-300'}`}>
                                            {formData.foodCategory === 'Veg' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                                        </div>
                                        <span className="font-bold">Vegetarian</span>
                                    </label>
                                    <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer px-4 py-4 rounded-xl border-2 transition-all ${formData.foodCategory === 'Non-Veg' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                        <input type="radio" name="foodCategory" value="Non-Veg" checked={formData.foodCategory === 'Non-Veg'} onChange={handleChange} className="hidden" />
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.foodCategory === 'Non-Veg' ? 'border-rose-500' : 'border-slate-300'}`}>
                                            {formData.foodCategory === 'Non-Veg' && <div className="w-2 h-2 rounded-full bg-rose-500"></div>}
                                        </div>
                                        <span className="font-bold">Non-Vegetarian</span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Food Type</label>
                                    <input
                                        type="text"
                                        name="foodType"
                                        required
                                        value={formData.foodType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                        placeholder="e.g. Cooked Rice, Bread"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 mb-2 block">Quantity</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            required
                                            min="1"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                            placeholder="Amount"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 mb-2 block">Unit</label>
                                        <select
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none bg-white"
                                        >
                                            <option value="servings">Servings</option>
                                            <option value="kg">Kg</option>
                                            <option value="items">Items</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Expiry Date</label>
                                    <div className="relative">
                                        <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="datetime-local"
                                            name="expiryDate"
                                            required
                                            value={formData.expiryDate}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Description (Optional)</label>
                                    <textarea
                                        name="description"
                                        rows={1}
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none resize-none"
                                        placeholder="Specific instructions..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Food Images */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800 border-b pb-2 flex items-center">
                                <FiImage className="mr-2 text-primary-500" /> Food Images
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {images.map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                                        <img
                                            src={url}
                                            alt={`Food ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-zoom-in"
                                            onClick={() => setSelectedImage(url)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <FiX className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-all group"
                                >
                                    <FiUpload className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Add Photo</span>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Section 3: Pickup Location */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800 border-b pb-2 flex items-center">
                                <FiMapPin className="mr-2 text-primary-500" /> Pickup Location
                            </h2>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            name="pickupLocation"
                                            required
                                            value={formData.pickupLocation}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                            placeholder="Enter address or select on map"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCurrentLocation}
                                        disabled={locationLoading}
                                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-200 transition-colors flex items-center font-medium whitespace-nowrap"
                                        title="Use Current Location"
                                    >
                                        {locationLoading ? (
                                            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <FiCrosshair className="mr-2" />
                                                <span className="hidden sm:inline">Use Current</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Map Container */}
                                <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner relative z-0">
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={13}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <LocationMarker />
                                        <MapUpdater center={mapCenter} />
                                    </MapContainer>

                                    {!markerPosition && (
                                        <div className="absolute top-2 right-2 bg-white/90 p-2 rounded-lg text-xs text-slate-500 shadow-sm pointer-events-none z-[1000]">
                                            Click map to select location
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                                        Readying Donation...
                                    </>
                                ) : (
                                    'Post Donation'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Full Image Viewer Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors bg-white/10 p-4 rounded-full backdrop-blur-md"
                        onClick={() => setSelectedImage(null)}
                    >
                        <FiX size={32} />
                    </button>

                    <img
                        src={selectedImage}
                        alt="Full View"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-zoom-in"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default CreateDonation;
