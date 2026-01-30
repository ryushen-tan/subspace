import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const YOUTUBE_VIDEO_ID = 'Rx1JxwD1Kc8';
const EMBED_URL = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1`;

const VideoDemoPreview = () => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(titleRef.current, { opacity: 0, y: 50 });
      gsap.set(videoRef.current, { opacity: 0, y: 40 });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 65%',
        onEnter: () => {
          gsap.to(titleRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
          });
          gsap.to(videoRef.current, {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: 0.2,
            ease: 'power3.out',
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full flex items-center bg-[#0a0a0a] overflow-hidden"
    >
      {/* Dither / halftone background */}
      <div className="absolute inset-0 dither-grid opacity-15" />
      <div className="absolute inset-0 halftone-overlay opacity-20" />

      {/* Vertical label */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:block">
        <p className="vertical-rl font-mono text-xs tracking-[0.4em] text-white/20">
          DEMO
        </p>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
        {/* Section header */}
        <div ref={titleRef} className="mb-12 lg:mb-16">
          <p className="font-mono text-sm tracking-widest text-white/40 mb-4">
            SEE IT IN ACTION
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white">
            Watch the <span className="text-[#ffb6c1]/90">su3</span> demo
          </h2>
        </div>

        {/* Video container – themed frame */}
        <div
          ref={videoRef}
          className="relative rounded-sm overflow-hidden
            border border-white/10 bg-black/40
            hover:border-[#ffb6c1]/30 transition-all duration-500
            shadow-[0_0_60px_rgba(0,0,0,0.5)] hover:shadow-[0_0_80px_rgba(255,182,193,0.08)]"
        >
          {/* Aspect ratio wrapper (16:9) */}
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={EMBED_URL}
              title="su3 product demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          {/* Play accent – subtle corner */}
          <div
            className="absolute bottom-4 left-4 flex items-center gap-2 font-mono text-xs text-white/50"
            aria-hidden
          >
            <Play className="w-4 h-4 text-[#ffb6c1]/60" strokeWidth={2} />
            <span>Demo</span>
          </div>
          {/* Pink seal accent */}
          <div className="absolute top-4 right-4 w-2 h-2 pink-seal rounded-full opacity-80" />
        </div>

        <p className="mt-6 text-center text-white/40 font-light text-sm max-w-xl mx-auto">
          See how su3 understands 3D space, responds to natural language, and helps you work with point clouds and meshes.
        </p>

        {/* Bottom accent */}
        <div className="absolute bottom-8 right-8 w-3 h-3 pink-seal rounded-full opacity-60" />
      </div>
    </section>
  );
};

export default VideoDemoPreview;
