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
          background: '#F5F5F7', // Apple-like subtle gray background
          surface: '#FFFFFF',
          primary: '#000000', // Bold black for primary actions
          secondary: '#6E6E73', // Subtle secondary text/icons
          accent: '#2997FF', // Vibrant blue for accents
          error: '#FF3B30',
          info: '#007AFF',
          success: '#34C759',
          warning: '#FF9500',
          'surface-variant': '#F5F5F7',
          'on-background': '#1D1D1F',
          'on-surface': '#1D1D1F',
          'on-primary': '#FFFFFF',
        },
        variables: {
          'border-color': '#000000',
          'border-opacity': 0.08,
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
          'theme-kbd': '#212529',
          'theme-on-kbd': '#FFFFFF',
          'theme-code': '#F5F5F5',
          'theme-on-code': '#000000',
        }
      },
      dark: {
        dark: true,
        colors: {
          background: '#000000', // Deep pure black
          surface: '#1C1C1E', // Apple-like dark gray surface
          primary: '#FFFFFF', // Pure white for primary
          secondary: '#86868B', // Subtle secondary
          accent: '#0A84FF', // Vibrant dark mode blue
          error: '#FF453A',
          info: '#0A84FF',
          success: '#32D74B',
          warning: '#FF9F0A',
          'surface-variant': '#2C2C2E',
          'on-background': '#F5F5F7',
          'on-surface': '#F5F5F7',
          'on-primary': '#000000',
        },
        variables: {
          'border-color': '#FFFFFF',
          'border-opacity': 0.12,
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
          'theme-kbd': '#212529',
          'theme-on-kbd': '#FFFFFF',
          'theme-code': '#343434',
          'theme-on-code': '#CCCCCC',
        }
      }
    }
  },
  defaults: {
    VCard: {
      elevation: 0,
      rounded: 'xl',
    },
    VBtn: {
      rounded: 'pill',
      elevation: 0,
      style: 'text-transform: none; font-weight: 600; letter-spacing: 0;',
    },
    VTextField: {
      variant: 'solo-filled',
      rounded: 'lg',
      hideDetails: 'auto',
    },
    VFileInput: {
      variant: 'solo-filled',
      rounded: 'lg',
      hideDetails: 'auto',
    }
  }
})
