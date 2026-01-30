import { Check, ArrowRight } from 'lucide-react';

const PricingCard = ({ tier }) => {
  const isHighlighted = tier.highlighted;

  return (
    <div className={`relative group ${isHighlighted ? 'lg:-mt-4 lg:mb-4' : ''}`}>
      {/* Highlighted badge */}
      {isHighlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-white text-black text-xs font-mono tracking-widest">
            RECOMMENDED
          </span>
        </div>
      )}

      <div
        className={`h-full p-8 border transition-all duration-500 animate-fade-in
                   ${isHighlighted
                     ? 'border-white/30 bg-white/[0.05]'
                     : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                   }`}
      >
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-2xl font-light text-white mb-2">{tier.name}</h3>
          <p className="text-white/50 text-sm font-light line-clamp-2">
            {tier.description}
          </p>
        </div>

        {/* Price */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light text-white">{tier.price}</span>
            <span className="text-white/40 font-light">{tier.period}</span>
          </div>
          {tier.originalPrice && (
            <p className="text-white/30 text-sm mt-1 line-through">
              {tier.originalPrice}
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-4 mb-8">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
              <span className="text-white/70 text-sm font-light leading-relaxed">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          className={`w-full py-4 flex items-center justify-center gap-2 cursor-pointer
                     text-sm font-medium tracking-wider transition-all duration-300
                     group/btn ${
                       isHighlighted
                         ? 'bg-white text-black hover:bg-white/90'
                         : 'border border-white/20 text-white hover:bg-white hover:text-black'
                     }`}
        >
          {tier.cta}
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>

        {/* Corner decorations */}
        {isHighlighted && (
          <>
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/30" />
          </>
        )}
      </div>
    </div>
  );
};

export default PricingCard;
