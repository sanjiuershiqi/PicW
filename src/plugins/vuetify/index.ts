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
          background: '#FFFFFF00', // Transparent to show body liquid background
          surface: '#FFFFFF40', // Translucent white for glassmorphism
          primary: '#1A1A2E', // Deep purple-black for text
          secondary: '#64748B', // Slate gray
          accent: '#FF3366', // Vibrant pink-red for interactive elements
          error: '#F43F5E',
          info: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
          'surface-variant': '#FFFFFF60', // Slightly more opaque white
          'on-background': '#1A1A2E',
          'on-surface': '#1A1A2E',
          'on-primary': '#FFFFFF',
          'on-surface-variant': '#1A1A2E'
        },
        variables: {
          'border-color': '#FFFFFF',
          'border-opacity': 0.4,
          'high-emphasis-opacity': 0.87,
          'medium-emphasis-opacity': 0.6,
          'disabled-opacity': 0.38,
          'idle-opacity': 0.1,
          'hover-opacity': 0.15,
          'focus-opacity': 0.2,
          'selected-opacity': 0.15,
          'activated-opacity': 0.2,
          'pressed-opacity': 0.25,
          'dragged-opacity': 0.2
        }
      },
      dark: {
        dark: true,
        colors: {
          background: '#00000000', // Transparent
          surface: '#0F172A60', // Translucent deep blue-slate
          primary: '#F8FAFC', // Crisp white text
          secondary: '#94A3B8', // Slate gray
          accent: '#FF3366', // Vibrant pink-red
          error: '#EF4444',
          info: '#60A5FA',
          success: '#34D399',
          warning: '#FBBF24',
          'surface-variant': '#1E293B80', // Slightly more opaque slate
          'on-background': '#F8FAFC',
          'on-surface': '#F8FAFC',
          'on-primary': '#FFFFFF',
          'on-surface-variant': '#F8FAFC'
        },
        variables: {
          'border-color': '#FFFFFF',
          'border-opacity': 0.15,
          'high-emphasis-opacity': 1,
          'medium-emphasis-opacity': 0.7,
          'disabled-opacity': 0.5,
          'idle-opacity': 0.1,
          'hover-opacity': 0.15,
          'focus-opacity': 0.2,
          'selected-opacity': 0.15,
          'activated-opacity': 0.2,
          'pressed-opacity': 0.25,
          'dragged-opacity': 0.2
        }
      }
    }
  },
  defaults: {
    VCard: {
      elevation: 0,
      rounded: 'xl', // Soft organic curves
      style: 'backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); box-shadow: 0 8px 32px rgba(0,0,0,0.05);'
    },
    VBtn: {
      rounded: 'pill', // Liquid/organic pill shapes
      elevation: 0,
      style: 'text-transform: none; font-weight: 600; letter-spacing: 0.5px; backdrop-filter: blur(8px);'
    },
    VTextField: {
      variant: 'solo',
      rounded: 'pill',
      hideDetails: 'auto',
      density: 'comfortable',
      bgColor: 'surface',
      style: 'backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);'
    },
    VFileInput: {
      variant: 'solo',
      rounded: 'xl',
      hideDetails: 'auto',
      bgColor: 'surface'
    },
    VChip: {
      rounded: 'pill',
      style: 'backdrop-filter: blur(8px);'
    },
    VAvatar: {
      rounded: 'circle'
    }
  }
})
