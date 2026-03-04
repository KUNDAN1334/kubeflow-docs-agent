// Kubeflow official color palette — strictly enforced
export const theme = {
  colors: {
    primary: '#1976D2',
    primaryDark: '#0D47A1',
    primaryLight: '#42A5F5',
    primaryMuted: '#E3F2FD',
    primaryBorder: '#BBDEFB',

    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceElevated: '#F5F5F5',

    text: '#212121',
    textSecondary: '#616161',
    textMuted: '#9E9E9E',
    textInverse: '#FFFFFF',

    border: '#E0E0E0',
    borderLight: '#EEEEEE',

    success: '#4CAF50',
    successLight: '#E8F5E9',
    warning: '#FF6F00',
    warningLight: '#FFF3E0',
    error: '#D32F2F',
    errorLight: '#FFEBEE',

    // Source type accent colors
    docs: '#1976D2',
    docsLight: '#E3F2FD',
    issues: '#FF6F00',
    issuesLight: '#FFF3E0',
    platform: '#2E7D32',
    platformLight: '#E8F5E9',
  },

  fonts: {
    sans: '"DM Sans", system-ui, sans-serif',
    mono: '"DM Mono", "Fira Code", monospace',
  },

  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.08)',
    md: '0 2px 8px rgba(0,0,0,0.10)',
    lg: '0 4px 16px rgba(0,0,0,0.12)',
  },
} as const;

export type SourceType = 'docs' | 'issues' | 'platform';

export const sourceConfig: Record<SourceType, { label: string; color: string; lightColor: string; icon: string }> = {
  docs: {
    label: 'Documentation',
    color: theme.colors.docs,
    lightColor: theme.colors.docsLight,
    icon: '📄',
  },
  issues: {
    label: 'GitHub Issues',
    color: theme.colors.issues,
    lightColor: theme.colors.issuesLight,
    icon: '🐛',
  },
  platform: {
    label: 'Architecture / KEPs',
    color: theme.colors.platform,
    lightColor: theme.colors.platformLight,
    icon: '🏗️',
  },
};

export const toolMessages: Record<string, string> = {
  search_docs: 'Searching documentation...',
  search_issues: 'Checking known issues...',
  search_platform: 'Looking up architecture...',
};

export const toolIcons: Record<string, string> = {
  search_docs: '🔍',
  search_issues: '🐛',
  search_platform: '🏗️',
};
