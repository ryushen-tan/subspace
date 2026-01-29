const NoiseOverlay = () => {
  return (
    <div className="noise-overlay">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="noiseFilter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="0.5" intercept="0.5" />
              <feFuncG type="linear" slope="0.3" intercept="0.35" />
              <feFuncB type="linear" slope="0.4" intercept="0.4" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="0.4" />
      </svg>
    </div>
  );
};

export default NoiseOverlay;
