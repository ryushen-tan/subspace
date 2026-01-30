import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const BlogCard = ({ post }) => {
  const categoryColors = {
    Technical: 'border-purple-400/50 text-purple-300',
    Update: 'border-blue-400/50 text-blue-300',
    Paper: 'border-green-400/50 text-green-300',
    Announcement: 'border-orange-400/50 text-orange-300',
  };

  const categoryClass = categoryColors[post.category] || 'border-white/20 text-white/40';

  return (
    <Link
      to={`/research/${post.slug}`}
      className="group block h-full cursor-pointer"
    >
      <article className="h-full flex flex-col p-6 border border-white/10 bg-white/[0.02]
                        hover:border-white/20 hover:bg-white/[0.04]
                        transition-all duration-500"
      >
        {/* Category tag */}
        <div className="mb-4">
          <span className={`inline-block px-2 py-1 text-xs font-mono tracking-widest
                           border ${categoryClass}`}>
            {post.category.toUpperCase()}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-light text-white mb-3 group-hover:text-white/80
                      transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt - flex-grow to push footer down */}
        <p className="text-white/40 font-light text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
          {post.excerpt}
        </p>

        {/* Footer - always at bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
          <span className="font-mono text-xs text-white/30">{post.date}</span>
          <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/60
                                  transition-colors" />
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
