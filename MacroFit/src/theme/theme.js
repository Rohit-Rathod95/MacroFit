export const theme = {
  colors: {
    primary: '#5B5FEF',
    primaryDark: '#4338CA',
    primaryLight: '#EEF0FF',
    accent: '#22D3A5', // for positive/success states, protein-ish teal
    warning: '#F59E0B',
    danger: '#EF4444',
    background: '#F7F8FC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#EEF0F4',
    macroCalorie: '#5B5FEF',
    macroProtein: '#22D3A5',
    macroCarb: '#F59E0B',
    macroFat: '#EC4899',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    pill: 999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
    h3: { fontSize: 17, fontWeight: '700' },
    body: { fontSize: 15, fontWeight: '500' },
    caption: { fontSize: 12, fontWeight: '600' },
  },
  shadow: {
    card: {
      shadowColor: '#111827',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 16,
      elevation: 3,
    },
    floating: {
      shadowColor: '#5B5FEF',
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 20,
      elevation: 6,
    },
  },
};

export default theme;
