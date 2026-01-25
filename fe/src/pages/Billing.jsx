import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowLeft } from 'lucide-react';
import BackgroundScene from "../components/BackgroundScene";

const Billing = () => {
    const Motion = motion;
    const [selectedTier, setSelectedTier] = useState(null);

    const tiers = [
        {
            name: "Free",
            price: "$0",
            period: "forever",
            description: "Perfect for getting started",
            features: [
                "Basic 3D modeling",
                "5 projects per month",
                "Community support",
                "Standard export formats"
            ],
            cta: "Get Started",
            highlight: false
        },
        {
            name: "Sub Designer",
            price: "$0.01",
            period: "per month",
            description: "For serious designers",
            features: [
                "Everything in Free",
                "Unlimited projects",
                "Advanced mesh tools",
                "Priority support",
                "Custom color palettes",
                "High-res exports"
            ],
            cta: "Start Free Trial",
            highlight: true
        },
        {
            name: "Sub+",
            price: "$0.99",
            period: "per month",
            description: "Professional workflow",
            features: [
                "Everything in Sub Designer",
                "AI-powered suggestions",
                "Collaboration tools",
                "Version history",
                "Cloud storage (50GB)",
                "API access"
            ],
            cta: "Upgrade Now",
            highlight: false
        },
        {
            name: "Sub++",
            price: "$9.99",
            period: "per month",
            description: "Enterprise-grade power",
            features: [
                "Everything in Sub+",
                "Unlimited cloud storage",
                "Advanced analytics",
                "Dedicated support",
                "Custom integrations",
                "Team management",
                "White-label options"
            ],
            cta: "Contact Sales",
            highlight: false
        }
    ];

    return (
        <div className="relative w-full min-h-screen overflow-hidden text-white font-sans selection:bg-white selection:text-black">
            <BackgroundScene />
            
            {/* Overlay Content */}
            <div className="relative z-10 w-full min-h-screen flex flex-col p-6 md:p-10 pointer-events-none">
                
                {/* Navbar */}
                <header className="flex justify-between items-center w-full pointer-events-auto mb-12">
                    <Link 
                        to="/"
                        className="flex items-center gap-2 text-xl tracking-tight font-bold hover:text-gray-300 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Sub Labs</span>
                    </Link>
                    
                    <div className="flex items-center gap-6">
                        <Link 
                            to="/edit"
                            className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors duration-300"
                        >
                            Launch Editor
                        </Link>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex flex-col items-center justify-center pointer-events-auto max-w-7xl mx-auto w-full">
                    <Motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-tighter leading-[0.9] mb-6 mix-blend-exclusion">
                            Choose Your Plan
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl tracking-tight font-normal max-w-2xl mx-auto">
                            Select the perfect tier for your 3D modeling needs
                        </p>
                    </Motion.div>

                    {/* Pricing Tiers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-12">
                        {tiers.map((tier, index) => (
                            <Motion.div
                                key={tier.name}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                                className={`relative bg-neutral-950/60 backdrop-blur-md border rounded-2xl p-6 flex flex-col ${
                                    tier.highlight 
                                        ? 'border-white/30 shadow-2xl scale-105' 
                                        : 'border-white/10 hover:border-white/20'
                                } transition-all duration-300 cursor-pointer`}
                                onClick={() => setSelectedTier(tier.name)}
                            >
                                {tier.highlight && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                        Popular
                                    </div>
                                )}
                                
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                                    <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
                                    
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold">{tier.price}</span>
                                        <span className="text-gray-500 text-sm ml-2">/{tier.period}</span>
                                    </div>
                                    
                                    <ul className="space-y-3 mb-6">
                                        {tier.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                                <Check size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <button
                                    className={`w-full py-3 rounded-full font-semibold transition-all duration-300 ${
                                        tier.highlight
                                            ? 'bg-white text-black hover:bg-gray-200'
                                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                    }`}
                                >
                                    {tier.cta}
                                </button>
                            </Motion.div>
                        ))}
                    </div>

                    {/* Additional Info */}
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-center text-gray-400 text-sm"
                    >
                        <p>All plans include a 14-day free trial. Cancel anytime.</p>
                    </Motion.div>
                </main>

                {/* Footer */}
                <footer className="w-full flex justify-between items-end text-[10px] md:text-xs text-gray-500 uppercase tracking-widest pointer-events-auto border-t border-gray-900 pt-6 mt-12">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        System Operational
                    </div>
                    
                    <div className="flex gap-4">
                        <span>© 2026 Sub Labs</span>
                        <span className="hidden sm:inline"> | </span>
                        <span className="hidden sm:inline">Privacy</span>
                        <span className="hidden sm:inline">Terms</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Billing;
