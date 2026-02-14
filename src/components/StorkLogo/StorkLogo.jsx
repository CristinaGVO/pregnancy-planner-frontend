export default function StorkLogo({ size = 28 }) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="53" cy="29" r="8" fill="rgba(247, 191, 212, 0.65)" />
        <path
          d="M48 29c2-2 4-3 5-3s3 1 5 3"
          stroke="rgba(162, 18, 110, 0.35)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="52" cy="28" r="1.2" fill="rgba(31, 41, 55, 0.55)" />
        <circle cx="54" cy="28" r="1.2" fill="rgba(31, 41, 55, 0.55)" />
        <path
          d="M52.3 30.7c.7.6 1.7.6 2.4 0"
          stroke="rgba(31, 41, 55, 0.45)"
          strokeWidth="2"
          strokeLinecap="round"
        />
  
        <path
          d="M46.5 20.5 C50 22.5 52 24.5 53 26.5"
          stroke="rgba(162, 18, 110, 0.30)"
          strokeWidth="3"
          strokeLinecap="round"
        />
  
        <g strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M18 46c8 0 14-4 17-10 3-6 2-12-3-16-2-2-4-3-7-4"
            stroke="rgba(31, 41, 55, 0.70)"
            strokeWidth="3.5"
            fill="none"
          />
          <path
            d="M21 40c4 2 8 2 12-1"
            stroke="rgba(31, 41, 55, 0.45)"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M25 16c6 1 10 5 11 10 1 5-2 10-6 14"
            stroke="rgba(31, 41, 55, 0.70)"
            strokeWidth="3.5"
            fill="none"
          />
          <circle
            cx="40"
            cy="16"
            r="6"
            fill="rgba(255,255,255,0.92)"
            stroke="rgba(31, 41, 55, 0.55)"
            strokeWidth="2.5"
          />
          <path
            d="M46 16 L58 18"
            stroke="rgba(249, 210, 184, 0.95)"
            strokeWidth="4"
          />
          <path
            d="M46 18 L57.5 21"
            stroke="rgba(249, 210, 184, 0.85)"
            strokeWidth="3.5"
          />
          <circle cx="41.8" cy="15.5" r="1" fill="rgba(31,41,55,0.65)" />
        </g>
      </svg>
    );
  }
  