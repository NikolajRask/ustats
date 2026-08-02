export function LandingChart() {
  return (
    <svg
      aria-hidden
      className="landing-chart absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <linearGradient id="land-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--land-accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--land-accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="land-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--land-accent)" stopOpacity="0" />
          <stop offset="20%" stopColor="var(--land-accent)" stopOpacity="1" />
          <stop offset="80%" stopColor="var(--land-accent)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--land-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={`v-${i}`}
          className="landing-grid"
          x1={120 + i * 110}
          y1="0"
          x2={120 + i * 110}
          y2="900"
          stroke="var(--land-grid)"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={`h-${i}`}
          className="landing-grid"
          x1="0"
          y1={80 + i * 100}
          x2="1440"
          y2={80 + i * 100}
          stroke="var(--land-grid)"
          strokeWidth="1"
        />
      ))}

      <path
        className="landing-area"
        d="M0 620 C180 580 260 700 420 540 C560 400 620 460 780 380 C940 300 1020 340 1180 280 C1300 240 1380 260 1440 220 L1440 900 L0 900 Z"
        fill="url(#land-fill)"
      />
      <path
        className="landing-stroke"
        d="M0 620 C180 580 260 700 420 540 C560 400 620 460 780 380 C940 300 1020 340 1180 280 C1300 240 1380 260 1440 220"
        stroke="url(#land-line)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        className="landing-stroke landing-stroke-delay"
        d="M0 740 C200 710 280 760 440 680 C600 600 680 640 820 590 C980 530 1080 560 1240 500 C1340 460 1400 470 1440 450"
        stroke="var(--land-muted-line)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
