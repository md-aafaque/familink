export default function BrandLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
      <defs>
        <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#brand-grad)" />
      <g fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 18 L50 48" />
        <path d="M33 33 L50 48 L67 33" />
        <path d="M50 48 L36 75" />
        <path d="M50 48 L64 75" />
        <circle cx="50" cy="14" r="7" fill="white" stroke="none" />
        <circle cx="30" cy="36" r="6" fill="white" stroke="none" />
        <circle cx="70" cy="36" r="6" fill="white" stroke="none" />
        <circle cx="33" cy="78" r="6" fill="white" stroke="none" />
        <circle cx="67" cy="78" r="6" fill="white" stroke="none" />
      </g>
    </svg>
  )
}
