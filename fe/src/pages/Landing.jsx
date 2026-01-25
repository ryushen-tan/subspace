import React from 'react';
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from 'lucide-react';
import BackgroundScene from "../components/BackgroundScene";

const Landing = () => {
    const Motion = motion;
    return (
        <div className="relative w-full h-screen overflow-hidden text-white font-sans selection:bg-white selection:text-black">
            <BackgroundScene />
            
            {/* Overlay Content */}
            <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-10 pointer-events-none">
                
                {/* Navbar */}
                <header className="flex justify-between items-center w-full pointer-events-auto">
                    <div className="flex items-center gap-12">
                         <Motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-xl tracking-tight font-bold"
                        >
                            Sub Labs
                        </Motion.div>
                        
                        {/* Desktop Nav Links */}
                        <Motion.nav 
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             transition={{ duration: 0.8, delay: 0.2 }}
                             className="hidden md:flex gap-6 text-sm text-gray-400 font-medium"
                        >
                            <a href="#" className="hover:text-white transition-colors">Features</a>
                            <a href="#" className="hover:text-white transition-colors">Research</a>
                            <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
                                Resources <ChevronDown size={14} />
                            </a>
                            <Link to="/billing" className="hover:text-white transition-colors">Billing</Link>
                        </Motion.nav>
                    </div>

                    <Motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        className="flex items-center gap-6"
                    >
                         <Link to="/login" className="hidden md:block text-sm font-medium hover:text-gray-300 transition-colors">Sign In</Link>
                         <Link 
                            to="/edit"
                            className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors duration-300 flex items-center gap-2"
                        >
                            Launch Editor
                        </Link>
                    </Motion.div>
                </header>

                {/* Hero Section - Left Aligned */}
                <main className="flex flex-col justify-center items-start text-left flex-grow pointer-events-auto max-w-4xl mt-12 md:mt-0">
                     <Motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-6xl md:text-8xl lg:text-9xl font-serif tracking-tighter leading-[0.9] mb-8 mix-blend-exclusion"
                    >
                        Subspace <br /> 3D Intelligence.
                    </Motion.h1>
                    
                    <Motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        className="text-gray-400 text-lg md:text-2xl tracking-tight font-normal max-w-xl mb-10 leading-relaxed"
                    >
                        The world's first kinetic modeling engine. Build physical products at the speed of thought.
                    </Motion.p>

                    <Motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                        className="flex flex-col sm:flex-row items-start gap-4"
                    >
                        <Link 
                            to="/create-project"
                            className="bg-white text-black px-8 py-3 rounded-full text-base font-semibold hover:bg-gray-200 transition-all duration-300"
                        >
                            Start Modeling
                        </Link>
                        
                         <a href="#" className="group flex items-center gap-2 px-6 py-3 rounded-full border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white transition-all duration-300">
                            <span>Read the research</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </Motion.div>
                </main>

                 {/* Footer / Status Line */}
                 <div className="w-full flex justify-between items-end text-[10px] md:text-xs text-gray-500 uppercase tracking-widest pointer-events-auto border-t border-gray-900 pt-6">
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1 }}
                        className="flex items-center gap-2"
                    >
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        System Operational
                    </Motion.div>
                    
                    <Motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ duration: 1, delay: 1.1 }}
                         className="flex gap-4"
                    >
                        <span>© 2026 Sub Labs</span>
                        <span className="hidden sm:inline"> | </span>
                        <span className="hidden sm:inline">Privacy</span>
                        <span className="hidden sm:inline">Terms</span>
                    </Motion.div>
                 </div>
            </div>
        </div>
    );
}

export default Landing;
