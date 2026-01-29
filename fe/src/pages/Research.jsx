import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

import BlogCard from '../components/research/BlogCard';
import Footer from '../components/landing/Footer';
import NoiseOverlay from '../components/landing/NoiseOverlay';

gsap.registerPlugin(ScrollTrigger);

const Research = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const headerRef = useRef(null);
  const gridRef = useRef(null);

  // Sample research posts
  const posts = [
    {
      slug: 'point-cloud-neural-representations',
      category: 'Technical',
      title: 'Point Cloud Neural Representations',
      date: 'January 2026',
      excerpt: 'Exploring implicit neural representations for efficient point cloud compression and rendering. We investigate how signed distance fields can replace traditional voxel representations.',
    },
    {
      slug: 'su3-spatial-ai',
      category: 'Update',
      title: 'su3: First Steps into Spatial AI',
      date: 'December 2025',
      excerpt: 'Announcing our first product: an agent that understands and transforms 3D spaces. Built on novel transformer architectures optimized for spatial reasoning.',
    },
    {
      slug: 'geometry-of-language',
      category: 'Paper',
      title: 'The Geometry of Language',
      date: 'November 2025',
      excerpt: 'How large language models can be grounded in 3D spatial reasoning without explicit training. A new approach to multi-modal understanding.',
    },
    {
      slug: 'agent-architectures',
      category: 'Technical',
      title: 'Agent Architectures for 3D Understanding',
      date: 'October 2025',
      excerpt: 'Designing agents that perceive and act in 3D environments. We explore attention mechanisms that capture spatial relationships in point cloud data.',
    },
    {
      slug: 'mibu-launch',
      category: 'Announcement',
      title: 'Introducing mibu labs',
      date: 'September 2025',
      excerpt: 'We are building the future of spatial AI. Starting with agents that understand 3D space through point clouds, meshes, and natural language.',
    },
    {
      slug: 'point-cloud-semantics',
      category: 'Paper',
      title: 'Semantics from Point Clouds',
      date: 'August 2025',
      excerpt: 'Semantic segmentation without RGB information. Our approach leverages geometric priors to achieve state-of-the-art results on semantic 3D datasets.',
    },
  ];

  const categories = ['All', 'Technical', 'Paper', 'Update', 'Announcement'];

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesFilter = activeFilter === 'All' || post.category === activeFilter;
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.set(headerRef.current, { opacity: 0, y: 30 });
      gsap.to(headerRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
      });

      // Grid animation
      const cards = gridRef.current?.querySelectorAll('.research-card');
      if (cards) {
        gsap.set(cards, { opacity: 0, y: 30 });
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.3,
        });
      }
    });

    return () => ctx.revert();
  }, [filteredPosts]);

  return (
    <div className="relative min-h-screen bg-[#050505]">
      <NoiseOverlay />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-light text-white tracking-tight">
            mibu
          </Link>
          <div className="flex items-center gap-8">
            <Link to="/su3" className="text-sm text-white/60 hover:text-white transition-colors">
              su3
            </Link>
            <Link to="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header ref={headerRef} className="pt-32 pb-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <p className="font-mono text-sm tracking-widest text-white/40 mb-4">RESEARCH</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white">
                From our lab
              </h1>

            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search research..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/10
                          text-white placeholder:text-white/30 font-light
                          focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Filter bar */}
      <div className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-white/30 mr-2 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-3 py-1.5 text-sm font-mono tracking-wider transition-colors
                          whitespace-nowrap ${
                            activeFilter === cat
                              ? 'bg-white/10 text-white'
                              : 'text-white/40 hover:text-white/60'
                          }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <main className="px-6 lg:px-12 py-12">
        <div className="max-w-7xl mx-auto">
          {filteredPosts.length > 0 ? (
            <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {filteredPosts.map((post) => (
                <div key={post.slug} className="research-card h-full">
                  <BlogCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="text-white/40 font-light">No research found matching your criteria.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Research;
