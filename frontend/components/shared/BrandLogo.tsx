export default function BrandLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
      <rect width="100" height="100" rx="20" fill="var(--primary)" />
      <g fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
        <path d="M50 20 L50 45" />
        <path d="M35 35 L50 45 L65 35" />
        <path d="M50 45 L38 70" />
        <path d="M50 45 L62 70" />
        <circle cx="50" cy="16" r="6" fill="white" />
        <circle cx="32" cy="38" r="5" fill="white" />
        <circle cx="68" cy="38" r="5" fill="white" />
        <circle cx="35" cy="73" r="5" fill="white" />
        <circle cx="65" cy="73" r="5" fill="white" />
      </g>
    </svg>
  )
}
