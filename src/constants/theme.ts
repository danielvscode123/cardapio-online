export const colors = {
  canvas: '#F4EBDD',
  cream: '#FFF9EE',
  ink: '#17382D',
  inkSoft: '#285044',
  tomato: '#E85D3F',
  mustard: '#E6B84A',
  sage: '#C9D8C4',
  line: '#D8CDBD',
  muted: '#6F766E',
  success: '#2D8A61',
  danger: '#C33F37',
  white: '#FFFFFF',
} as const;

export const fonts = {
  display: 'Fraunces_700Bold',
  body: 'DMSans_500Medium',
  bodyBold: 'DMSans_600SemiBold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#17382D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
} as const;
