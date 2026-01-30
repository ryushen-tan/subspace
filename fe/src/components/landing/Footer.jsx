import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = [
    { label: 'su3', href: '/su3' },
    { label: 'Research', href: '/research' },
    { label: 'Pricing', href: '/pricing' },
  ];

  const socials = [
    { label: 'GitHub', href: '#' },
    { label: 'Twitter', href: '#' },
    { label: 'Discord', href: '#' },
  ];

  return (
    <footer className="relative bg-[#050505] border-t border-white/10 overflow-hidden">
      {/* Dither background */}
      <div className="absolute inset-0 dither-grid opacity-10" />
      <div className="absolute inset-0 halftone-overlay opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-4 group">
              <span className="text-2xl font-light text-white tracking-tight group-hover:text-[#ffb6c1] transition-colors">mibu</span>
            </Link>
            <p className="text-white/40 font-light text-sm max-w-xs mb-6">
              Frontier research at the intersection of space and intelligence.
            </p>

          </div>

          {/* Links */}
          <div>
            <h4 className="font-mono text-xs tracking-widest text-[#ffb6c1]/40 mb-4">PAGES</h4>
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-white/60 hover:text-[#ffb6c1] transition-colors text-sm font-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h4 className="font-mono text-xs tracking-widest text-[#ffb6c1]/40 mb-4">CONNECT</h4>
            <ul className="space-y-3">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    className="text-white/60 hover:text-[#ffb6c1] transition-colors text-sm font-light"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar with pink border */}
        <div className="mt-16 pt-8 border-t border-[#ffb6c1]/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-[#ffb6c1]/30">
            © {currentYear} mibu labs. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 pink-seal rounded-full" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
