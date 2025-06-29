// Global Design System for Cashalyst
// Use this for all colors, fonts, spacing, radii, shadows, and reusable component styles

const colors = {
  background: '#0F172A',
  card: '#1E293B',
  input: '#1E293B',
  accent: '#3B82F6',
  accentGreen: '#10B981',
  textMain: '#F9FAFB',
  textSubtle: '#94A3B8',
  textBody: '#CBD5E1',
  textHelper: '#64748B',
  border: '#334155',
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.1)',
  errorBorder: 'rgba(239, 68, 68, 0.2)',
  shadow: 'rgba(0,0,0,0.08)',
  glass: 'rgba(30,41,59,0.8)',
};

const font = {
  family: {
    regular: 'Inter_400Regular',
    medium: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  size: {
    title: 28,
    section: 20,
    label: 16,
    body: 14,
    amount: 22,
    note: 12,
  },
  weight: {
    medium: '600',
    bold: '700',
  },
  lineHeight: {
    title: 36,
    section: 26,
    label: 20,
    body: 18,
    amount: 28,
    note: 16,
  },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const radii = {
  card: 16,
  button: 8,
  input: 12,
};

const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
};

// Reusable component styles
const input = {
  height: 52,
  borderRadius: radii.input,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.card,
  color: colors.textMain,
  fontFamily: font.family.medium,
  fontSize: font.size.label,
  paddingHorizontal: spacing.md,
  marginBottom: spacing.md,
};

const button = {
  filled: {
    backgroundColor: colors.accent,
    borderRadius: radii.button,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: radii.button,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    backgroundColor: 'transparent',
    borderRadius: radii.button,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textLabel: {
    color: colors.accent,
    fontFamily: font.family.medium,
    fontSize: font.size.label,
  },
  filledLabel: {
    color: colors.textMain,
    fontFamily: font.family.bold,
    fontSize: font.size.label,
  },
  outlinedLabel: {
    color: colors.accent,
    fontFamily: font.family.bold,
    fontSize: font.size.label,
  },
};

const card = {
  backgroundColor: colors.card,
  borderRadius: radii.card,
  padding: spacing.lg,
  marginBottom: spacing.md,
  ...shadow.card,
};

const icon = {
  size: 22,
  color: colors.textMain,
};

export default {
  colors,
  font,
  spacing,
  radii,
  shadow,
  input,
  button,
  card,
  icon,
}; 