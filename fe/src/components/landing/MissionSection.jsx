import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MissionSection = () => {
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const visualRef = useRef(null);
  const quoteRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Split text animation
      const chars = textRef.current.querySelectorAll('.char');

      gsap.set([chars, quoteRef.current], {
        opacity: 0,
        y: 40,
      });

      // Text reveal
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 60%',
        end: 'center center',
        onEnter: () => {
          gsap.to(chars, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.03,
            ease: 'power3.out',
          });
          gsap.to(quoteRef.current, {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: 0.4,
            ease: 'power3.out',
          });
        },
      });

      // Visual parallax
      gsap.to(visualRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
        y: '15%',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Split text into chars for animation
  const splitText = (text) => {
    return text.split('').map((char, i) => (
      <span key={i} className="char inline-block">
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full flex items-center bg-[#050505] overflow-hidden"
    >
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Decorative lines */}
      <div className="absolute left-1/4 top-0 bottom-0 line-dashed-vertical hidden lg:block" />

      {/* Vertical Japanese text */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
        <p className="vertical-rl font-mono text-xs tracking-[0.4em] text-white/20">
          MISSION
        </p>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text content */}
          <div ref={textRef} className="space-y-8">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight">
              {splitText('Understanding space')}
              <br />
              <span className="text-white/50">{splitText('through data')}</span>
            </h2>

            <p
              ref={quoteRef}
              className="text-lg sm:text-xl text-white/50 font-light leading-relaxed max-w-lg"
            >
              We build agents that perceive, reason, and interact with 3D space.
              Starting with point clouds — the raw language of the physical world.
            </p>

            {/* Stats */}
            <div className="flex gap-12 pt-8 border-t border-white/10">
              <div>
                <p className="text-3xl font-light text-white">su3</p>
                <p className="text-sm font-mono text-white/40 mt-1">First Product</p>
              </div>
              <div>
                <p className="text-3xl font-light text-white">3D</p>
                <p className="text-sm font-mono text-white/40 mt-1">Spatial Agents</p>
              </div>
              <div>
                <p className="text-3xl font-light text-white">∞</p>
                <p className="text-sm font-mono text-white/40 mt-1">Possibilities</p>
              </div>
            </div>
          </div>

          {/* Visual element - Abstract point cloud visualization */}
          <div ref={visualRef} className="relative aspect-square lg:aspect-[4/5] hidden lg:block">
            {/* Concentric circles representing point cloud layers with pink accent */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Ring 1 */}
              <div className="absolute w-full h-full border border-[#ffb6c1]/5 rounded-full" />
              <div className="absolute w-[90%] h-[90%] border border-white/10 rounded-full" />
              <div className="absolute w-[80%] h-[80%] border border-[#ffb6c1]/8 rounded-full" />
              <div className="absolute w-[70%] h-[70%] border border-white/10 rounded-full" />
              <div className="absolute w-[60%] h-[60%] border border-[#ffb6c1]/5 rounded-full" />
              <div className="absolute w-[50%] h-[50%] border border-[#ffb6c1]/20 rounded-full" />
              <div className="absolute w-[40%] h-[40%] border border-white/10 rounded-full" />
              <div className="absolute w-[30%] h-[30%] bg-gradient-to-br from-[#ffb6c1]/10 to-[#dc143c]/5 rounded-full pink-glow" />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0">
              {[
                { top: '25%', left: '30%' },
                { top: '40%', left: '25%' },
                { top: '60%', left: '35%' },
                { top: '70%', left: '45%' },
                { top: '35%', left: '55%' },
                { top: '55%', left: '65%' },
                { top: '75%', left: '60%' },
                { top: '20%', left: '70%' },
                { top: '45%', left: '75%' },
                { top: '65%', left: '80%' },
                { top: '30%', left: '45%' },
                { top: '80%', left: '30%' },
              ].map((pos, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white/40 rounded-full"
                  style={{
                    top: pos.top,
                    left: pos.left,
                    animationDelay: `${i * 0.2}s`,
                    animation: 'pulse 3s ease-in-out infinite',
                  }}
                />
              ))}
            </div>

            {/* Corner accent with pink seal */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-r border-b border-[#ffb6c1]/20" />
            <div className="absolute bottom-0 right-0 w-3 h-3 pink-seal rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
