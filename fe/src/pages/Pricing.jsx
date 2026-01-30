import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare } from 'lucide-react';

import PricingCard from '../components/pricing/PricingCard';
import Footer from '../components/landing/Footer';
import NoiseOverlay from '../components/landing/NoiseOverlay';

const Pricing = () => {
  const headerRef = useRef(null);

  // Pricing tiers
  const tiers = [
    {
      name: 'Individual',
      description: 'Perfect for researchers, students, and hobbyists exploring spatial AI.',
      price: 'Free',
      period: 'forever',
      features: [
        'Up to 1M points per model',
        '10 generations per month',
        'Standard export formats',
        'Community support',
        'Basic visualization tools',
      ],
      cta: 'GET STARTED',
      highlighted: false,
    },
    {
      name: 'Team',
      description: 'For small teams and startups building spatial AI applications.',
      price: '$29',
      period: '/user/month',
      originalPrice: '$49',
      features: [
        'Unlimited points per model',
        'Unlimited generations',
        'All export formats (OBJ, STL, PLY)',
        'Priority support',
        'Advanced visualization',
        'API access',
        'Team collaboration',
        'Version history (30 days)',
      ],
      cta: 'START FREE TRIAL',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      description: 'Custom solutions for organizations with advanced spatial AI needs.',
      price: 'Custom',
      period: '',
      features: [
        'Everything in Team',
        'Dedicated support',
        'Custom model training',
        'On-premise deployment',
        'SLA guarantees',
        'Advanced analytics',
        'Unlimited users',
        'Version history (unlimited)',
        'Custom integrations',
      ],
      cta: 'CONTACT SALES',
      highlighted: false,
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(headerRef.current, { opacity: 0, y: 40 });
      gsap.to(headerRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
      });
    });

    return () => ctx.revert();
  }, []);

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
            <Link to="/research" className="text-sm text-white/60 hover:text-white transition-colors">
              Research
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header ref={headerRef} className="pt-32 pb-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-mono text-sm tracking-widest text-white/40 mb-4">PRICING</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-4">
            Simple, transparent pricing
          </h1>

          <div className="max-w-2xl mx-auto mt-8">
            <p className="text-lg text-white/50 font-light">
              Get started for free. Upgrade as you grow.
              <br />
              All plans include access to su3 with full features.
            </p>
          </div>
        </div>
      </header>

      {/* Pricing cards */}
      <main className="px-6 lg:px-12 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {tiers.map((tier, index) => (
              <PricingCard key={tier.name} tier={tier} index={index} />
            ))}
          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <section className="px-6 lg:px-12 py-24 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <p className="font-mono text-sm tracking-widest text-white/40 mb-4">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-light text-white mb-4">
                Questions?
              </h2>

              <p className="text-white/50 font-light">
                Can't find what you're looking for? Our team is happy to help.
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  q: 'Can I try su3 for free?',
                  a: 'Yes! Our Individual plan is completely free and includes core features to get started with spatial AI.',
                },
                {
                  q: 'What file formats are supported?',
                  a: 'We support PLY, OBJ, STL, and GLB formats for import and export. Enterprise plans can request custom format support.',
                },
                {
                  q: 'How does the Team plan work?',
                  a: 'Team plans are billed per user and include shared workspaces, collaboration features, and API access for automation.',
                },
                {
                  q: 'Do you offer custom solutions?',
                  a: 'Absolutely. Our Enterprise plan includes custom training, on-premise deployment, and dedicated support for your specific needs.',
                },
              ].map((faq) => (
                <div key={faq.q} className="border-b border-white/10 pb-6">
                  <h3 className="text-white font-medium mb-2">{faq.q}</h3>
                  <p className="text-white/50 font-light text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="px-6 lg:px-12 py-24 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 p-12 border border-white/10 bg-white/[0.02]">
            <div>
              <h3 className="text-2xl font-light text-white mb-2">
                Need a custom solution?
              </h3>
              <p className="text-white/50 font-light">
                Get in touch with our team to discuss your specific requirements.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-3 px-8 py-4 border border-white/20
                        text-white font-medium tracking-wider hover:bg-white hover:text-black
                        transition-all duration-300 group whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4" />
              CONTACT SALES
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
