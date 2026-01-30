import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderPlus, FolderOpen, LogOut, Loader2 } from 'lucide-react';
import { useAuthStore } from '../state/useAuthStore';
import { listProjects, deleteProject } from '../services/projectService';
import NoiseOverlay from '../components/landing/NoiseOverlay';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const items = await listProjects();
        if (!cancelled) setProjects(items);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load projects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err?.message || 'Failed to delete');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative min-h-screen bg-[#050505]">
      <NoiseOverlay />
      <div className="absolute inset-0 dither-grid opacity-20" />
      <div className="absolute inset-0 halftone-overlay pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 60% 40%, #1a0a0a 0%, #050505 60%)',
        }}
      />

      <header className="relative flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="text-lg font-light text-white/80 hover:text-[#ffb6c1] transition-colors">
          SubSpace
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/60">{user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:text-[#ffb6c1] border border-white/10 hover:border-[#ffb6c1]/30 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-light text-white">My projects</h1>
          <Link
            to="/su3"
            className="flex items-center gap-2 px-4 py-2 bg-[#ffb6c1]/20 hover:bg-[#ffb6c1]/30 border border-[#ffb6c1]/40 rounded-lg text-[#ffb6c1] text-sm font-medium transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            Create new project
          </Link>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-400">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#ffb6c1] animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/50 mb-6">No projects yet</p>
            <Link
              to="/su3"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffb6c1]/20 border border-[#ffb6c1]/40 rounded-lg text-[#ffb6c1] text-sm font-medium hover:bg-[#ffb6c1]/30 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              Create your first project
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  to={`/su3/${project.id}`}
                  className="block h-full p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FolderOpen className="w-5 h-5 text-[#ffb6c1]/80 flex-shrink-0" />
                      <span className="font-medium text-white truncate group-hover:text-[#ffb6c1]/90">
                        {project.name || 'Untitled Project'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, project.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 rounded transition-opacity cursor-pointer"
                      aria-label="Delete project"
                    >
                      ×
                    </button>
                  </div>
                  {project.description && (
                    <p className="mt-2 text-sm text-white/50 line-clamp-2">{project.description}</p>
                  )}
                  <p className="mt-3 text-xs font-mono text-white/30">
                    Updated {project.updated ? new Date(project.updated).toLocaleDateString() : '—'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
