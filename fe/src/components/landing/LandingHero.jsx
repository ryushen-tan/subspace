import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas } from '@react-three/fiber';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import CherryBlossomPointCloud from './CherryBlossomPointCloud';

// Register GSAP
gsap.registerPlugin(ScrollTrigger);

const LandingHero = () => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const taglineRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const threeContainerRef = useRef(null);
  
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll progress tracking
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        },
      });

      // Text animations
      gsap.set([titleRef.current, subtitleRef.current, taglineRef.current], {
        opacity: 0,
        y: 60,
      });
      gsap.set(scrollIndicatorRef.current, { opacity: 0, y: 20 });

      const tl = gsap.timeline({ delay: 0.5 });

      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.4,
        ease: 'power3.out',
      })
        .to(subtitleRef.current, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
        }, '-=0.9')
        .to(taglineRef.current, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
        }, '-=0.7')
        .to(scrollIndicatorRef.current, {
          opacity: 0.5,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        }, '-=0.5');

      // Scroll fade out
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '60% top',
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          gsap.to([titleRef.current, subtitleRef.current, taglineRef.current], {
            opacity: 1 - progress * 1.5,
            y: progress * -60,
            duration: 0.1,
            overwrite: true,
          });
          gsap.to(scrollIndicatorRef.current, {
            opacity: 0.5 - progress * 2,
            duration: 0.1,
            overwrite: true,
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleScrollClick = () => {
    const nextSection = sectionRef.current?.nextElementSibling;
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505]"
    >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-light text-white tracking-tight hover:text-[#ffb6c1] transition-colors">
            mibu
          </Link>
          <div className="flex items-center gap-8">
            <Link to="/su3" className="text-sm text-white/60 hover:text-[#ffb6c1] transition-colors">
              su3
            </Link>
            <Link to="/research" className="text-sm text-white/60 hover:text-[#ffb6c1] transition-colors">
              Research
            </Link>
            <Link to="/pricing" className="text-sm text-white/60 hover:text-[#ffb6c1] transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </nav>

      {/* Dither Grid Background */}
      <div className="absolute inset-0 dither-grid opacity-20" />
      
      {/* Halftone overlay */}
      <div className="absolute inset-0 halftone-overlay pointer-events-none" />

      {/* Warm pink gradient background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 60% 40%, #1a0a0a 0%, #050505 60%)',
        }}
      />

      {/* Three.js Cherry Blossom - Right Side */}
      <div 
        ref={threeContainerRef}
        className="absolute right-0 top-0 w-full lg:w-2/3 h-full"
        style={{ opacity: 1 - scrollProgress * 0.5 }}
      >
        <Canvas
          camera={{ position: [0, 0, 32], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <CherryBlossomPointCloud scrollProgress={scrollProgress} />
        </Canvas>
      </div>

      {/* Content - Left Side */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8">
            {/* Brand */}
            <div>
              <h1
                ref={titleRef}
                className="text-8xl sm:text-9xl lg:text-[12rem] font-thin tracking-tighter text-white leading-none pink-text-shadow"
                style={{ letterSpacing: '-0.04em' }}
              >
                mibu
              </h1>
              <p
                ref={subtitleRef}
                className="mt-4 font-mono text-xl sm:text-2xl tracking-[0.3em] text-[#ffb6c1]/40"
              >
                ミブラボラトリ
              </p>
            </div>

            {/* Divider */}
            <div className="w-32 h-px bg-gradient-to-r from-[#ffb6c1]/40 via-[#dc143c]/30 to-transparent" />

            {/* Tagline */}
            <div ref={taglineRef} className="space-y-4">
              <p className="text-lg sm:text-xl text-white/50 font-light leading-relaxed max-w-md">
                FRONTIER RESEARCH
                <br />
                <span className="text-[#ffb6c1]/40">at the intersection of</span>
                <br />
                SPACE and INTELLIGENCE
              </p>
              <p className="font-mono text-sm text-white/20 tracking-widest">
                Agents that understand 3D space
              </p>
            </div>

            {/* Pink Gradient Accent Dots */}
            <div className="flex gap-3 pt-4">
              <div 
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, #ffb6c1, #dc143c)',
                  boxShadow: '0 0 15px rgba(255, 182, 193, 0.5)',
                }}
              />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: 'rgba(255, 182, 193, 0.3)' }}
              />
            </div>
          </div>

          {/* Spacer for visual balance */}
          <div className="hidden lg:block" />
        </div>
      </div>

      {/* Vertical Japanese Text */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:block">
        <p className="vertical-rl font-mono text-xs tracking-[0.5em] text-[#ffb6c1]/20">
          桜 · 空間 · 知能
        </p>
      </div>

      {/* Scroll Indicator with pink glow */}
      <button
        ref={scrollIndicatorRef}
        onClick={handleScrollClick}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3
                   text-white/30 hover:text-[#ffb6c1]/60 transition-colors cursor-pointer group"
        aria-label="Scroll down"
      >
        <div 
          className="w-px h-12 bg-gradient-to-b from-transparent via-[#ffb6c1]/30 to-[#ffb6c1]/60
                     group-hover:h-16 transition-all duration-500"
          style={{ boxShadow: '0 0 10px rgba(255, 182, 193, 0.3)' }}
        />
        <span className="text-xs font-mono tracking-[0.3em] group-hover:text-[#ffb6c1]/80">SCROLL</span>
      </button>
    </section>
  );
};

export default LandingHero;
