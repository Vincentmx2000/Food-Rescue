import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import heroImage from '../assets/hero_landing.png';
import ngoImage from '../assets/ngo_support.png';
import { FaHandHoldingHeart, FaTruck, FaUsers, FaLeaf, FaArrowRight, FaShieldAlt, FaHeart } from 'react-icons/fa';

const LandingPage = () => {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50/30">
            <Navbar />

            {/* Hero Section */}
            <header className="relative pt-8 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="text-center lg:text-left animate-slide-up">
                            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold mb-6 border border-primary-100 uppercase tracking-wider">
                                <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse"></span>
                                <span>Revolutionizing Food Recovery</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-tight">
                                <span className="block text-slate-900">End Hunger.</span>
                                <span className="gradient-text">Rescue Hope.</span>
                            </h1>
                            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                We bridge the gap between food surplus and community need. Join thousands of restaurants, NGOs, and volunteers in building a world where no meal is wasted.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                                    Start Rescuing
                                    <FaArrowRight className="w-4 h-4" />
                                </Link>
                                <a href="#how-it-works" className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:border-primary-200 hover:bg-primary-50 transition-all flex items-center justify-center">
                                    See How it Works
                                </a>
                            </div>

                            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-80">
                                <div className="flex items-center gap-2 group">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                        <FaShieldAlt />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600">Verified Partnerships</span>
                                </div>
                                <div className="flex items-center gap-2 group">
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                                        <FaTruck />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600">Live Logistics</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary-100/40 to-secondary-100/40 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
                            <div className="relative glass-card p-3 rounded-[2.5rem] border-white/50 border-4 shadow-2xl animate-float">
                                <img
                                    src={heroImage}
                                    alt="Global Community Impact"
                                    className="w-full h-auto rounded-[2rem] object-cover aspect-[4/3]"
                                />
                                <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl border border-slate-100 animate-slide-up animation-delay-500">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl">
                                            🥗
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900">5k+</p>
                                            <p className="text-xs font-bold text-slate-500 uppercase">Meals Re-routed</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -top-6 -right-6 bg-white p-5 rounded-2xl shadow-xl border border-slate-100 animate-slide-up">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xl">
                                            ❤️
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-slate-900">Real-time</p>
                                            <p className="text-xs font-bold text-slate-500 uppercase">Active Rescues</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* How It Works */}
            <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Small Steps, Massive Impact</h2>
                        <p className="text-slate-600 text-xl font-medium">A seamless ecosystem connecting Three Pillars of Change.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden lg:block absolute top-[120px] left-[15%] right-[15%] h-1 bg-slate-100 -z-10"></div>

                        <div className="group">
                            <div className="bg-slate-50 p-10 rounded-[2rem] border-2 border-slate-100 group-hover:border-orange-200 group-hover:bg-orange-50/30 transition-all duration-500 h-full relative overflow-hidden text-center">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-100/50 rounded-full blur-2xl group-hover:bg-orange-200/50 transition-all"></div>
                                <div className="w-20 h-20 mx-auto bg-orange-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-orange-500/30 group-hover:rotate-6 transition-transform">
                                    <FaHandHoldingHeart size={36} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4">Donors List Surplus</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">Restaurants and organizers post excess food with photos, quantity, and pickup times within seconds.</p>
                            </div>
                        </div>

                        <div className="group">
                            <div className="bg-slate-50 p-10 rounded-[2rem] border-2 border-slate-100 group-hover:border-primary-200 group-hover:bg-primary-50/30 transition-all duration-500 h-full relative overflow-hidden text-center">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-100/50 rounded-full blur-2xl group-hover:bg-primary-200/50 transition-all"></div>
                                <div className="w-20 h-20 mx-auto bg-primary-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary-500/30 group-hover:-rotate-6 transition-transform">
                                    <FaTruck size={36} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4">Volunteers Bridge Gap</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">Dedicated volunteers accept deliveries, ensuring the food is safely transported from the donor to the NGOs.</p>
                            </div>
                        </div>

                        <div className="group">
                            <div className="bg-slate-50 p-10 rounded-[2rem] border-2 border-slate-100 group-hover:border-green-200 group-hover:bg-green-50/30 transition-all duration-500 h-full relative overflow-hidden text-center">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-100/50 rounded-full blur-2xl group-hover:bg-green-200/50 transition-all"></div>
                                <div className="w-20 h-20 mx-auto bg-green-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                                    <FaHeart size={36} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4">NGOs Feed Thousands</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">Partner NGOs receive the food and distribute it immediately to shelters and communities in need.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* NGO & Volunteer Focus */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="relative order-2 lg:order-1">
                            <div className="relative z-10 rounded-[3rem] overflow-hidden border-8 border-white/10">
                                <img
                                    src={ngoImage}
                                    alt="Community Impact"
                                    className="w-full h-auto grayscale-0 hover:grayscale-0 transition-all duration-700 hover:scale-105"
                                />
                            </div>
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-600/30 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary-600/30 rounded-full blur-3xl"></div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Built for Organizations, <br /><span className="gradient-text">Fueled by Volunteers.</span></h2>
                            <p className="text-slate-400 text-xl mb-12 font-medium leading-relaxed">
                                Our platform handles the logistics, coordination, and tracking so you can focus on your core mission: serving humanity.
                            </p>
                            <div className="space-y-8 mb-12">
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary-400 border border-white/10">
                                        <FaLeaf className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Sustainability First</h4>
                                        <p className="text-slate-500 font-medium">Reduce carbon footprint by rerouting food from landfills to kitchens.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary-400 border border-white/10">
                                        <FaUsers className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Transparent Networking</h4>
                                        <p className="text-slate-500 font-medium">Real-time status tracking from the moment food is posted to its distribution.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/register" className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 transition-all transform hover:scale-105">
                                    Join as NGO
                                </Link>
                                <Link to="/register-volunteer" className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-black rounded-2xl hover:bg-white/10 transition-all">
                                    Be a Volunteer Helper
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter/CTA */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-br from-primary-600 to-secondary-700 rounded-[3.5rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/5 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff), linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff)', backgroundSize: '60px 60px', backgroundPosition: '0 0, 30px 30px' }}></div>
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-4xl md:text-6xl font-black mb-10 tracking-tight">Make Your First Impact Today.</h2>
                            <p className="text-primary-50 text-xl md:text-2xl mb-12 font-medium opacity-90">Whether you're donating, delivering, or distributing—every contribution counts toward a hunger-free world.</p>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                                <Link to="/register" className="w-full md:w-auto px-12 py-5 bg-white text-primary-700 font-black rounded-2xl shadow-2xl hover:scale-105 transition-all">
                                    Get Started Now
                                </Link>
                                <Link to="/login" className="w-full md:w-auto px-12 py-5 bg-primary-800 text-white font-black rounded-2xl hover:bg-primary-900 transition-all">
                                    Welcome Back
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center space-x-2 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">FR</span>
                                </div>
                                <span className="text-2xl font-black text-slate-900">Food Rescue</span>
                            </div>
                            <p className="text-slate-500 font-medium leading-relaxed">Pioneering the future of social responsibility through technology and empathy.</p>
                        </div>
                        <div>
                            <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8">Platform</h5>
                            <ul className="space-y-4 font-semibold text-slate-600">
                                <li><Link to="/register" className="hover:text-primary-600 transition-colors">Donors</Link></li>
                                <li><Link to="/register-volunteer" className="hover:text-primary-600 transition-colors">Volunteers</Link></li>
                                <li><Link to="/register" className="hover:text-primary-600 transition-colors">Partner NGOs</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8">Resources</h5>
                            <ul className="space-y-4 font-semibold text-slate-600">
                                <li><Link to="#" className="hover:text-primary-600 transition-colors">Help Center</Link></li>
                                <li><Link to="#" className="hover:text-primary-600 transition-colors">Success Stories</Link></li>
                                <li><Link to="#" className="hover:text-primary-600 transition-colors">Privacy & Legal</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8">Stay Connected</h5>
                            <p className="text-slate-500 font-medium mb-6">Join our community newsletter for impact updates.</p>
                            <div className="flex gap-2">
                                <input type="email" placeholder="Email" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500" />
                                <button className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-bold">Go</button>
                            </div>
                        </div>
                    </div>
                    <div className="text-center pt-8 border-t border-slate-200">
                        <p className="text-slate-400 font-bold text-sm">© {new Date().getFullYear()} Food Rescue. Designed for Community Impact.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
