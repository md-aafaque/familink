export const COLORS = {
  primary: '#F97316',
  primaryHover: '#EA580C',
  primaryLight: '#FFF7ED',
  background: '#FFFDF5',
  card: '#FFFFFF',
  border: '#1E293B',
  muted: '#64748B',
  ring: '#F97316',

  dark: {
    primary: '#FB923C',
    primaryHover: '#F97316',
    primaryLight: '#1C1917',
    background: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    muted: '#94A3B8',
    ring: '#FB923C',
  },
} as const;

export const ACCENTS = {
  yellow: '#FBBF24',
  pink: '#F472B6',
  teal: '#14B8A6',
  purple: '#A855F7',
  blue: '#38BDF8',
} as const;

export const SOFT_TINTS = {
  peach: '#FEF3C7',
  pink: '#FCE7F3',
  lavender: '#F3E8FF',
  mint: '#D1FAE5',
  sky: '#E0F2FE',
} as const;

export const DARK_ACCENTS = {
  yellow: '#FCD34D',
  pink: '#F9A8D4',
  teal: '#2DD4BF',
  purple: '#C084FC',
  blue: '#7DD3FC',
} as const;

export const SHADOWS = {
  pop: '4px 4px 0px 0px',
  popSm: '3px 3px 0px 0px',
  popLg: '8px 8px 0px 0px',
} as const;

export const RADII = {
  sm: '8px',
  md: '16px',
  lg: '24px',
  full: '9999px',
} as const;

export const Z_LAYERS = {
  canvas: 0,
  sidebar: 10,
  overlay: 20,
  toolbar: 30,
  drawer: 40,
  modal: 50,
} as const;
