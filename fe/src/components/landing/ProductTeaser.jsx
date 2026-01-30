import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Box, MessageSquare, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import Su3EntryLink from '../Su3EntryLink';

gsap.registerPlugin(ScrollTrigger);

const ProductTeaser = () => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef(null);

  const features = [
    {
      icon: Box,
      title: 'Spatial Understanding',
      description: 'Agents that comprehend 3D geometry, spatial relationships, and point cloud structures.',
    },
    {
      icon: MessageSquare,
      title: 'Natural Language',
      description: 'Converse with your 3D models. Ask questions, request transformations, get insights.',
    },
    {
      icon: Layers,
      title: 'Semantic Segmentation',
      description: 'AI that recognizes and labels components within complex 3D environments.',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.set(titleRef.current, { opacity: 0, y: 50 });

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

      // Cards stagger animation - trigger earlier and faster
      const cards = cardsRef.current.querySelectorAll('.feature-card');
      gsap.set(cards, { opacity: 0, y: 30, scale: 0.95 });

      ScrollTrigger.create({
        trigger: cardsRef.current,
        start: 'top 80%', // Appear earlier
        onEnter: () => {
          gsap.to(cards, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.2, // Very snappy
            stagger: 0.06,
            ease: 'power2.out',
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
      {/* Dither background */}
      <div className="absolute inset-0 dither-grid opacity-15" />
      <div className="absolute inset-0 halftone-overlay opacity-20" />

      {/* Vertical Japanese text */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:block">
        <p className="vertical-rl font-mono text-xs tracking-[0.4em] text-white/20">
          PRODUCTS
        </p>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-32">
        {/* Section header */}
        <div ref={titleRef} className="mb-20">
          <p className="font-mono text-sm tracking-widest text-white/40 mb-4">OUR FIRST PRODUCT</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white">su3</h2>
        </div>

        {/* Product description */}
        <div className="mb-24 max-w-3xl">
          <p className="text-xl sm:text-2xl text-white/60 font-light leading-relaxed">
            The first agent that truly understands 3D space. Upload any point cloud,
            mesh, or 3D model — and let su3 analyze, interpret, and transform your data.
          </p>
        </div>

        {/* Feature cards */}
        <div ref={cardsRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="feature-card p-8 border border-white/10 bg-white/[0.02] backdrop-blur-sm
                        hover:border-[#ffb6c1]/30 hover:bg-white/[0.04] transition-all duration-500
                        group cursor-default"
            >
              <div className="mb-6">
                <feature.icon className="w-8 h-8 text-white/60 group-hover:text-[#ffb6c1]/80 transition-colors" />
              </div>
              <h3 className="text-xl font-light text-white mb-3">{feature.title}</h3>
              <p className="text-white/40 font-light text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-12">
          <Su3EntryLink
            className="inline-flex items-center gap-3 px-8 py-4 border border-[#ffb6c1]/30
                      text-white font-medium tracking-wider hover:bg-[#ffb6c1]/10 hover:text-white
                      hover:border-[#ffb6c1]/50 pink-hover transition-all duration-300 group cursor-pointer"
          >
            TRY SU3
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Su3EntryLink>

          <div className="hidden sm:block h-px flex-1 pink-divider" />
        </div>

        {/* Pink accent seal */}
        <div className="absolute bottom-8 right-8 w-3 h-3 pink-seal rounded-full" />
      </div>
    </section>
  );
};

export default ProductTeaser;
