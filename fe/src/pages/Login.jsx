import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../state/useAuthStore';
import NoiseOverlay from '../components/landing/NoiseOverlay';
import Footer from '../components/landing/Footer';

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-[#050505]">
      <NoiseOverlay />

      {/* Dither / halftone background */}
      <div className="absolute inset-0 dither-grid opacity-20" />
      <div className="absolute inset-0 halftone-overlay pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 60% 40%, #1a0a0a 0%, #050505 60%)',
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-light text-white tracking-tight hover:text-[#ffb6c1] transition-colors cursor-pointer"
          >
            mibu
          </Link>
          <div className="flex items-center gap-8">
            <Link
              to="/su3"
              className="text-sm text-white/60 hover:text-[#ffb6c1] transition-colors cursor-pointer"
            >
              su3
            </Link>
            <Link
              to="/research"
              className="text-sm text-white/60 hover:text-[#ffb6c1] transition-colors cursor-pointer"
            >
              Research
            </Link>
            <Link
              to="/pricing"
              className="text-sm text-white/60 hover:text-[#ffb6c1] transition-colors cursor-pointer"
            >
              Pricing
            </Link>
            <Link
              to="/signup"
              className="text-sm text-white/60 hover:text-[#ffb6c1] transition-colors cursor-pointer"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 flex items-center justify-center min-h-screen px-6 pt-24 pb-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="p-8 border border-white/10 bg-white/[0.02]">
            {/* Header */}
            <div className="mb-8">
              <p className="font-mono text-sm tracking-widest text-[#ffb6c1]/60 mb-2">
                SIGN IN
              </p>
              <h1 className="text-3xl font-light text-white mb-2">Welcome back</h1>
              <p className="text-white/50 font-light text-sm">
                Sign in to continue to mibu
              </p>
            </div>

            <div className="w-20 h-px bg-gradient-to-r from-[#ffb6c1]/40 to-transparent mb-8" />

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 border border-red-500/20 bg-red-500/5">
                <p className="text-sm text-red-400/90 font-light">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-mono text-xs tracking-widest text-white/40 mb-2">
                  EMAIL
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10
                             text-white placeholder-white/20 font-light
                             focus:outline-none focus:border-[#ffb6c1]/40 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs tracking-widest text-white/40 mb-2">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10
                             text-white placeholder-white/20 font-light
                             focus:outline-none focus:border-[#ffb6c1]/40 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 flex items-center justify-center gap-2
                         border border-white/20 text-white font-medium tracking-wider
                         hover:bg-white hover:text-black transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white group cursor-pointer"
              >
                {loading ? (
                  'Signing in…'
                ) : (
                  <>
                    SIGN IN
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Sign up link */}
            <p className="mt-8 text-center text-sm text-white/50 font-light">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-[#ffb6c1] hover:text-[#ffb6c1]/80 transition-colors cursor-pointer"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Accent dot */}
          <div className="mt-8 flex justify-center">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #ffb6c1, #dc143c)',
                boxShadow: '0 0 15px rgba(255, 182, 193, 0.4)',
              }}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
