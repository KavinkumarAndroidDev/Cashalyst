// Theme safety helpers to prevent runtime errors
import theme from './theme';

// Safe theme property access with fallbacks
export const safeTheme = {
  colors: {
    background: theme?.colors?.background || '#0F172A',
    card: theme?.colors?.card || '#1E293B',
    textMain: theme?.colors?.textMain || '#F9FAFB',
    textSubtle: theme?.colors?.textSubtle || '#94A3B8',
    accent: theme?.colors?.accent || '#3B82F6',
    border: theme?.colors?.border || '#334155',
    error: theme?.colors?.error || '#EF4444',
  },
  font: {
    family: {
      regular: theme?.font?.family?.regular || 'System',
      medium: theme?.font?.family?.medium || 'System', 
      bold: theme?.font?.family?.bold || 'System',
    },
    size: {
      label: theme?.font?.size?.label || 16,
      body: theme?.font?.size?.body || 14,
      section: theme?.font?.size?.section || 20,
    },
  },
  spacing: {
    lg: theme?.spacing?.lg || 20,
    md: theme?.spacing?.md || 16,
  },
};

// Helper function to safely access theme properties
export const getThemeProperty = (path, fallback = null) => {
  try {
    const properties = path.split('.');
    let current = theme;
    
    for (const property of properties) {
      if (current && current[property] !== undefined) {
        current = current[property];
      } else {
        return fallback;
      }
    }
    
    return current;
  } catch (error) {
    console.warn('Theme property access error:', path, error);
    return fallback;
  }
};

// Check if theme is fully loaded
export const isThemeReady = () => {
  return theme && 
         theme.colors && 
         theme.font && 
         theme.font.family && 
         theme.font.family.medium && 
         theme.spacing;
};
