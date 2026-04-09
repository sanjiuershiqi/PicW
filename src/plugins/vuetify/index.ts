import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#FAFAFA', // Clean light gray
          surface: '#FFFFFF', // Pure white cards
          primary: '#1A1A1A', // Soft black for text/primary
          secondary: '#737373', // Medium gray for secondary text
          accent: '#000000', // Solid black for emphasis
          error: '#E53935',
          info: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
          'surface-variant': '#F5F5F5',
          'on-background': '#1A1A1A',
          'on-surface': '#1A1A1A',
          'on-primary': '#FFFFFF',
          'on-surface-variant': '#1A1A1A',
        },
        variables: {
          'border-color': '#E5E5E5',
          'border-opacity': 1,
          'high-emphasis-opacity': 0.87,
          'medium-emphasis-opacity': 0.6,
          'disabled-opacity': 0.38,
          'idle-opacity': 0.04,
          'hover-opacity': 0.04,
          'focus-opacity': 0.12,
          'selected-opacity': 0.08,
          'activated-opacity': 0.12,
          'pressed-opacity': 0.12,
          'dragged-opacity': 0.08,
        }
      },
      dark: {
        dark: true,
        colors: {
          background: '#121212', // Deep dark gray
          surface: '#1E1E1E', // Slightly lighter surface
          primary: '#FAFAFA', // Off-white for text
          secondary: '#A3A3A3', // Lighter gray
          accent: '#FFFFFF', // Pure white for emphasis
          error: '#EF4444',
          info: '#60A5FA',
          success: '#34D399',
          warning: '#FBBF24',
          'surface-variant': '#262626',
          'on-background': '#FAFAFA',
          'on-surface': '#FAFAFA',
          'on-primary': '#121212',
          'on-surface-variant': '#FAFAFA',
        },
        variables: {
          'border-color': '#333333',
          'border-opacity': 1,
          'high-emphasis-opacity': 1,
          'medium-emphasis-opacity': 0.7,
          'disabled-opacity': 0.5,
          'idle-opacity': 0.1,
          'hover-opacity': 0.04,
          'focus-opacity': 0.12,
          'selected-opacity': 0.08,
          'activated-opacity': 0.12,
          'pressed-opacity': 0.16,
          'dragged-opacity': 0.08,
        }
      }
    }
  },
  defaults: {
    VCard: {
      elevation: 0,
      rounded: 'lg', // 8px border radius for a clean look
    },
    VBtn: {
      rounded: 'md', // 6px border radius
      elevation: 0,
      style: 'text-transform: none; font-weight: 500; letter-spacing: 0;',
    },
    VTextField: {
      variant: 'outlined',
      rounded: 'md',
      hideDetails: 'auto',
      density: 'comfortable',
    },
    VFileInput: {
      variant: 'outlined',
      rounded: 'md',
      hideDetails: 'auto',
    },
    VChip: {
      rounded: 'md',
    },
    VAvatar: {
      rounded: 'md',
    }
  }
})
