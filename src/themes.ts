export type ThemeName = 'dark' | 'light';

export interface Theme {
  name: ThemeName;
  app: {
    bg: string;
    headerBg: string;
    sidebarBg: string;
    border: string;
    borderLight: string;
    divider: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    faint: string;
  };
  accent: {
    bg: string;
    bgHover: string;
    text: string;
    border: string;
  };
  atm: {
    bg: string;
    text: string;
  };
  buy: {
    bg: string;
    bgHover: string;
    bgSelected: string;
    text: string;
    border: string;
  };
  sell: {
    bg: string;
    bgHover: string;
    bgSelected: string;
    text: string;
    border: string;
  };
  call: {
    bg: string;
    bgSelected: string;
    text: string;
    border: string;
  };
  put: {
    bg: string;
    bgSelected: string;
    text: string;
    border: string;
  };
  spot: {
    text: string;
    positive: string;
    negative: string;
    positiveBg: string;
    negativeBg: string;
  };
  chart: {
    bg: string;
    grid: string;
    line: string;
    zero: string;
  };
  input: {
    bg: string;
    border: string;
  };
  card: {
    bg: string;
    border: string;
  };
  button: {
    bg: string;
    bgHover: string;
    text: string;
    border: string;
  };
  selected: {
    bg: string;
    text: string;
    border: string;
  };
}

export const darkTheme: Theme = {
  name: 'dark',
  app: {
    bg: '#0f1117',
    headerBg: '#161822',
    sidebarBg: '#12141c',
    border: '#1f2937',
    borderLight: '#374151',
    divider: '#1f2937',
  },
  text: {
    primary: '#f3f4f6',
    secondary: '#9ca3af',
    muted: '#6b7280',
    faint: '#4b5563',
  },
  accent: {
    bg: 'rgba(99, 102, 241, 0.12)',
    bgHover: 'rgba(99, 102, 241, 0.2)',
    text: '#a5b4fc',
    border: 'rgba(99, 102, 241, 0.3)',
  },
  atm: {
    bg: 'rgba(99, 102, 241, 0.08)',
    text: '#818cf8',
  },
  buy: {
    bg: 'rgba(16, 185, 129, 0.10)',
    bgHover: 'rgba(16, 185, 129, 0.20)',
    bgSelected: 'rgba(16, 185, 129, 0.35)',
    text: '#6ee7b7',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  sell: {
    bg: 'rgba(239, 68, 68, 0.10)',
    bgHover: 'rgba(239, 68, 68, 0.20)',
    bgSelected: 'rgba(239, 68, 68, 0.35)',
    text: '#fca5a5',
    border: 'rgba(239, 68, 68, 0.4)',
  },
  call: {
    bg: 'rgba(139, 92, 246, 0.10)',
    bgSelected: 'rgba(139, 92, 246, 0.25)',
    text: '#c4b5fd',
    border: 'rgba(139, 92, 246, 0.4)',
  },
  put: {
    bg: 'rgba(168, 85, 247, 0.10)',
    bgSelected: 'rgba(168, 85, 247, 0.25)',
    text: '#d8b4fe',
    border: 'rgba(168, 85, 247, 0.4)',
  },
  spot: {
    text: '#f3f4f6',
    positive: '#34d399',
    negative: '#f87171',
    positiveBg: 'rgba(16, 185, 129, 0.10)',
    negativeBg: 'rgba(239, 68, 68, 0.10)',
  },
  chart: {
    bg: 'rgba(31, 41, 55, 0.3)',
    grid: '#1f2937',
    line: '#6366f1',
    zero: '#4b5563',
  },
  input: {
    bg: '#1f2937',
    border: '#374151',
  },
  card: {
    bg: 'rgba(31, 41, 55, 0.3)',
    border: '#1f2937',
  },
  button: {
    bg: '#1f2937',
    bgHover: '#374151',
    text: '#9ca3af',
    border: '#374151',
  },
  selected: {
    bg: 'rgba(99, 102, 241, 0.20)',
    text: '#c7d2fe',
    border: 'rgba(99, 102, 241, 0.5)',
  },
};

export const lightTheme: Theme = {
  name: 'light',
  app: {
    bg: '#f8fafc',
    headerBg: '#ffffff',
    sidebarBg: '#ffffff',
    border: '#e2e8f0',
    borderLight: '#cbd5e1',
    divider: '#e2e8f0',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#94a3b8',
    faint: '#cbd5e1',
  },
  accent: {
    bg: 'rgba(99, 102, 241, 0.08)',
    bgHover: 'rgba(99, 102, 241, 0.14)',
    text: '#4f46e5',
    border: 'rgba(99, 102, 241, 0.3)',
  },
  atm: {
    bg: 'rgba(99, 102, 241, 0.08)',
    text: '#4f46e5',
  },
  buy: {
    bg: 'rgba(16, 185, 129, 0.08)',
    bgHover: 'rgba(16, 185, 129, 0.15)',
    bgSelected: 'rgba(16, 185, 129, 0.25)',
    text: '#059669',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  sell: {
    bg: 'rgba(239, 68, 68, 0.08)',
    bgHover: 'rgba(239, 68, 68, 0.15)',
    bgSelected: 'rgba(239, 68, 68, 0.25)',
    text: '#dc2626',
    border: 'rgba(239, 68, 68, 0.4)',
  },
  call: {
    bg: 'rgba(139, 92, 246, 0.06)',
    bgSelected: 'rgba(139, 92, 246, 0.18)',
    text: '#7c3aed',
    border: 'rgba(139, 92, 246, 0.3)',
  },
  put: {
    bg: 'rgba(168, 85, 247, 0.06)',
    bgSelected: 'rgba(168, 85, 247, 0.18)',
    text: '#9333ea',
    border: 'rgba(168, 85, 247, 0.3)',
  },
  spot: {
    text: '#0f172a',
    positive: '#059669',
    negative: '#dc2626',
    positiveBg: 'rgba(16, 185, 129, 0.10)',
    negativeBg: 'rgba(239, 68, 68, 0.10)',
  },
  chart: {
    bg: 'rgba(241, 245, 249, 0.8)',
    grid: '#e2e8f0',
    line: '#4f46e5',
    zero: '#cbd5e1',
  },
  input: {
    bg: '#f1f5f9',
    border: '#cbd5e1',
  },
  card: {
    bg: '#f8fafc',
    border: '#e2e8f0',
  },
  button: {
    bg: '#f1f5f9',
    bgHover: '#e2e8f0',
    text: '#475569',
    border: '#cbd5e1',
  },
  selected: {
    bg: 'rgba(99, 102, 241, 0.12)',
    text: '#4338ca',
    border: 'rgba(99, 102, 241, 0.4)',
  },
};

export const themes: Record<ThemeName, Theme> = {
  dark: darkTheme,
  light: lightTheme,
};
