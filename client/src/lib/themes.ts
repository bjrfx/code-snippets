// Theme definitions for the application

export type ThemeColors = {
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  variables: Record<string, string>;
};

export type ThemeOption = {
  id: string;
  name: string;
  description: string;
  type: 'color' | 'gradient';
  theme: ThemeColors;
};

// Color themes
export const colorThemes: ThemeOption[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'The default light theme',
    type: 'color',
    theme: {
      name: 'Default',
      description: 'Clean, minimal light theme',
      preview: {
        primary: '#0f172a',
        secondary: '#64748b',
        accent: '#2563eb',
        background: '#ffffff'
      },
      variables: {
        '--background': '0 0% 100%',
        '--foreground': '222.2 47.4% 11.2%',
        '--card': '0 0% 100%',
        '--card-foreground': '222.2 47.4% 11.2%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '222.2 47.4% 11.2%',
        '--primary': '222.2 47.4% 11.2%',
        '--primary-foreground': '210 40% 98%',
        '--secondary': '210 40% 96.1%',
        '--secondary-foreground': '222.2 47.4% 11.2%',
        '--muted': '210 40% 96.1%',
        '--muted-foreground': '215.4 16.3% 46.9%',
        '--accent': '210 40% 96.1%',
        '--accent-foreground': '222.2 47.4% 11.2%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '210 40% 98%',
        '--border': '214.3 31.8% 91.4%',
        '--input': '214.3 31.8% 91.4%',
        '--ring': '222.2 47.4% 11.2%',
        '--radius': '0.5rem'
      }
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark mode theme',
    type: 'color',
    theme: {
      name: 'Dark',
      description: 'Sleek dark theme',
      preview: {
        primary: '#f8fafc',
        secondary: '#94a3b8',
        accent: '#3b82f6',
        background: '#020617'
      },
      variables: {
        '--background': '222.2 84% 4.9%',
        '--foreground': '210 40% 98%',
        '--card': '222.2 84% 4.9%',
        '--card-foreground': '210 40% 98%',
        '--popover': '222.2 84% 4.9%',
        '--popover-foreground': '210 40% 98%',
        '--primary': '210 40% 98%',
        '--primary-foreground': '222.2 47.4% 11.2%',
        '--secondary': '217.2 32.6% 17.5%',
        '--secondary-foreground': '210 40% 98%',
        '--muted': '217.2 32.6% 17.5%',
        '--muted-foreground': '215 20.2% 65.1%',
        '--accent': '217.2 32.6% 17.5%',
        '--accent-foreground': '210 40% 98%',
        '--destructive': '0 62.8% 30.6%',
        '--destructive-foreground': '210 40% 98%',
        '--border': '217.2 32.6% 17.5%',
        '--input': '217.2 32.6% 17.5%',
        '--ring': '212.7 26.8% 83.9%',
        '--radius': '0.5rem'
      }
    }
  },
  {
    id: 'blue',
    name: 'Blue',
    description: 'Calming blue theme',
    type: 'color',
    theme: {
      name: 'Blue',
      description: 'Soothing blue color scheme',
      preview: {
        primary: '#1e40af',
        secondary: '#60a5fa',
        accent: '#3b82f6',
        background: '#eff6ff'
      },
      variables: {
        '--background': '213.8 100% 96.9%',
        '--foreground': '224 71.4% 4.1%',
        '--card': '0 0% 100%',
        '--card-foreground': '224 71.4% 4.1%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '224 71.4% 4.1%',
        '--primary': '221.2 83.2% 53.3%',
        '--primary-foreground': '210 40% 98%',
        '--secondary': '214.3 94.6% 92.7%',
        '--secondary-foreground': '222.2 47.4% 11.2%',
        '--muted': '214.3 94.6% 92.7%',
        '--muted-foreground': '215.4 16.3% 46.9%',
        '--accent': '214.3 94.6% 92.7%',
        '--accent-foreground': '222.2 47.4% 11.2%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '210 40% 98%',
        '--border': '214.3 31.8% 91.4%',
        '--input': '214.3 31.8% 91.4%',
        '--ring': '221.2 83.2% 53.3%',
        '--radius': '0.5rem'
      }
    }
  },
  {
    id: 'green',
    name: 'Green',
    description: 'Fresh green theme',
    type: 'color',
    theme: {
      name: 'Green',
      description: 'Refreshing green color scheme',
      preview: {
        primary: '#166534',
        secondary: '#4ade80',
        accent: '#22c55e',
        background: '#f0fdf4'
      },
      variables: {
        '--background': '142.1 76.2% 96.7%',
        '--foreground': '142.1 76.2% 11.2%',
        '--card': '0 0% 100%',
        '--card-foreground': '142.1 76.2% 11.2%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '142.1 76.2% 11.2%',
        '--primary': '142.1 76.2% 36.3%',
        '--primary-foreground': '355.7 100% 97.3%',
        '--secondary': '142.1 76.2% 96.7%',
        '--secondary-foreground': '142.1 76.2% 11.2%',
        '--muted': '142.1 76.2% 96.7%',
        '--muted-foreground': '142.1 76.2% 36.3%',
        '--accent': '142.1 76.2% 96.7%',
        '--accent-foreground': '142.1 76.2% 11.2%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '210 40% 98%',
        '--border': '142.1 76.2% 86.7%',
        '--input': '142.1 76.2% 86.7%',
        '--ring': '142.1 76.2% 36.3%',
        '--radius': '0.5rem'
      }
    }
  },
  {
    id: 'purple',
    name: 'Purple',
    description: 'Rich purple theme',
    type: 'color',
    theme: {
      name: 'Purple',
      description: 'Elegant purple color scheme',
      preview: {
        primary: '#6b21a8',
        secondary: '#c084fc',
        accent: '#a855f7',
        background: '#faf5ff'
      },
      variables: {
        '--background': '270 100% 98%',
        '--foreground': '272.9 73.5% 28.8%',
        '--card': '0 0% 100%',
        '--card-foreground': '272.9 73.5% 28.8%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '272.9 73.5% 28.8%',
        '--primary': '272.9 73.5% 28.8%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '270 100% 98%',
        '--secondary-foreground': '272.9 73.5% 28.8%',
        '--muted': '270 100% 98%',
        '--muted-foreground': '272.9 73.5% 52.4%',
        '--accent': '270 100% 98%',
        '--accent-foreground': '272.9 73.5% 28.8%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '210 40% 98%',
        '--border': '270 100% 88%',
        '--input': '270 100% 88%',
        '--ring': '272.9 73.5% 28.8%',
        '--radius': '0.5rem'
      }
    }
  }
];

// Gradient themes
export const gradientThemes: ThemeOption[] = [
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm sunset gradient',
    type: 'gradient',
    theme: {
      name: 'Sunset',
      description: 'Warm orange to purple gradient',
      preview: {
        primary: '#f97316',
        secondary: '#c026d3',
        accent: '#f59e0b',
        background: 'linear-gradient(to right, #f97316, #c026d3)'
      },
      variables: {
        '--background': '0 0% 100%',
        '--foreground': '20 14.3% 4.1%',
        '--card': '0 0% 100%',
        '--card-foreground': '20 14.3% 4.1%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '20 14.3% 4.1%',
        '--primary': '24.6 95% 53.1%',
        '--primary-foreground': '60 9.1% 97.8%',
        '--secondary': '60 4.8% 95.9%',
        '--secondary-foreground': '24 9.8% 10%',
        '--muted': '60 4.8% 95.9%',
        '--muted-foreground': '25 5.3% 44.7%',
        '--accent': '60 4.8% 95.9%',
        '--accent-foreground': '24 9.8% 10%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '60 9.1% 97.8%',
        '--border': '20 5.9% 90%',
        '--input': '20 5.9% 90%',
        '--ring': '24.6 95% 53.1%',
        '--radius': '0.5rem'
      }
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool ocean gradient',
    type: 'gradient',
    theme: {
      name: 'Ocean',
      description: 'Calming blue to teal gradient',
      preview: {
        primary: '#0ea5e9',
        secondary: '#14b8a6',
        accent: '#06b6d4',
        background: 'linear-gradient(to right, #0ea5e9, #14b8a6)'
      },
      variables: {
        '--background': '0 0% 100%',
        '--foreground': '222.2 84% 4.9%',
        '--card': '0 0% 100%',
        '--card-foreground': '222.2 84% 4.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '222.2 84% 4.9%',
        '--primary': '199 89% 48%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '0 0% 96.1%',
        '--secondary-foreground': '222.2 47.4% 11.2%',
        '--muted': '0 0% 96.1%',
        '--muted-foreground': '215.4 16.3% 46.9%',
        '--accent': '0 0% 96.1%',
        '--accent-foreground': '222.2 47.4% 11.2%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '210 40% 98%',
        '--border': '214.3 31.8% 91.4%',
        '--input': '214.3 31.8% 91.4%',
        '--ring': '199 89% 48%',
        '--radius': '0.5rem'
      }
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural forest gradient',
    type: 'gradient',
    theme: {
      name: 'Forest',
      description: 'Earthy green to brown gradient',
      preview: {
        primary: '#166534',
        secondary: '#854d0e',
        accent: '#4d7c0f',
        background: 'linear-gradient(to right, #166534, #854d0e)'
      },
      variables: {
        '--background': '0 0% 100%',
        '--foreground': '123 11% 9%',
        '--card': '0 0% 100%',
        '--card-foreground': '123 11% 9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '123 11% 9%',
        '--primary': '123 41% 24%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '80 4.8% 95.9%',
        '--secondary-foreground': '123 11% 9%',
        '--muted': '80 4.8% 95.9%',
        '--muted-foreground': '123 11% 40%',
        '--accent': '80 4.8% 95.9%',
        '--accent-foreground': '123 11% 9%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '123 11% 90%',
        '--input': '123 11% 90%',
        '--ring': '123 41% 24%',
        '--radius': '0.5rem'
      }
    }
  }
];

// Get all themes combined
export const allThemes = [...colorThemes, ...gradientThemes];

// Helper function to find a theme by ID
export function getThemeById(id: string): ThemeOption | undefined {
  return allThemes.find(theme => theme.id === id);
}