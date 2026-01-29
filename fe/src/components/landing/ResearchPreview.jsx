import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const ResearchPreview = () => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef(null);

  // Sample research posts for preview
  const posts = [
    {
      category: 'Technical',
      title: 'Point Cloud Neural Representations',
      date: 'January 2026',
      excerpt: 'Exploring implicit neural representations for efficient point cloud compression and rendering.',
    },
    {
      category: 'Update',
      title: 'su3: First Steps into Spatial AI',
      date: 'December 2025',
      excerpt: 'Announcing our first product: an agent that understands and transforms 3D spaces.',
    },
    {
      category: 'Paper',
      title: 'The Geometry of Language',
      date: 'November 2025',
      excerpt: 'How large language models can be grounded in 3D spatial reasoning without explicit training.',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.set(titleRef.current, { opacity: 0, y: 40 });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 60%',
        onEnter: () => {
          gsap.to(titleRef.current, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
          });
        },
      });

      // Card animations
      const cards = cardsRef.current.querySelectorAll('.post-card');
      gsap.set(cards, { opacity: 0, y: 30 });

      ScrollTrigger.create({
        trigger: cardsRef.current,
        start: 'top 70%',
        onEnter: () => {
          gsap.to(cards, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
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
      className="relative min-h-screen w-full flex items-center bg-[#050505] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Vertical Japanese text */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
        <p className="vertical-rl font-mono text-xs tracking-[0.4em] text-white/20">
          RESEARCH
        </p>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-32">
        {/* Section header */}
        <div ref={titleRef} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
          <div>
            <p className="font-mono text-sm tracking-widest text-white/40 mb-4">LATEST RESEARCH</p>
            <h2 className="text-4xl sm:text-5xl font-light text-white">From our lab</h2>
          </div>

          <Link
            to="/research"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
          >
            View all research
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Post cards */}
        <div ref={cardsRef} className="space-y-px">
          {posts.map((post) => (
            <Link
              key={post.title}
              to="/research"
              className="post-card block group"
            >
              <div className="flex items-center gap-4 sm:gap-8 py-8 border-b border-white/10
                            hover:bg-white/[0.02] hover:border-[#ffb6c1]/20 hover:pl-2 transition-all px-4 -mx-4">
                {/* Category */}
                <div className="w-24 shrink-0">
                  <span className="font-mono text-xs tracking-widest text-[#ffb6c1]/40">
                    {post.category.toUpperCase()}
                  </span>
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-light text-white truncate group-hover:text-[#ffb6c1]/90 transition-colors">
                    {post.title}
                  </h3>
                </div>

                {/* Excerpt - hidden on mobile */}
                <div className="hidden lg:block flex-1 max-w-md">
                  <p className="text-sm text-white/40 font-light line-clamp-1 group-hover:text-white/50">
                    {post.excerpt}
                  </p>
                </div>

                {/* Date - pink tint */}
                <div className="hidden sm:block w-32 shrink-0 text-right">
                  <span className="font-mono text-sm text-[#ffb6c1]/30">{post.date}</span>
                </div>

                {/* Arrow - pink on hover */}
                <div className="shrink-0">
                  <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-[#ffb6c1]/70 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom decoration with pink accent */}
        <div className="mt-16 pt-16 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 pink-dot rounded-full pink-pulse" />
              <span className="font-mono text-xs tracking-widest text-[#ffb6c1]/30">
                mibu labs · EST. 2025
              </span>
            </div>
            <div className="w-24 h-px pink-divider" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResearchPreview;
