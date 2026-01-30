import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import LandingHero from '../components/landing/LandingHero';
import MissionSection from '../components/landing/MissionSection';
import ProductTeaser from '../components/landing/ProductTeaser';
import VideoDemoPreview from '../components/landing/VideoDemoPreview';
import ResearchPreview from '../components/landing/ResearchPreview';
import Footer from '../components/landing/Footer';
import NoiseOverlay from '../components/landing/NoiseOverlay';

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
  // Setup global scroll smoother
  useEffect(() => {
    // Refresh ScrollTrigger after all components mount
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timeout);
      // Clean up all ScrollTriggers
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="relative bg-[#050505] overflow-x-hidden">
      {/* Global noise overlay */}
      <NoiseOverlay />

      {/* Main content */}
      <main className="relative">
        <LandingHero />
        <MissionSection />
        <ProductTeaser />
        <VideoDemoPreview />
        {/* <ResearchPreview /> */}
        <Footer />
      </main>
    </div>
  );
};

export default Landing;
