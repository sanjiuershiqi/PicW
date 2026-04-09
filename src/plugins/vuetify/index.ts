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
          background: '#EAE6DF', // Brutalist paper/beige
          surface: '#F4F1EC', // Slightly lighter for cards
          primary: '#111111', // Almost pure black
          secondary: '#4A4A4A', // Dark gray
          accent: '#FF3300', // Brutalist neon red/orange
          error: '#FF0000',
          info: '#0000FF',
          success: '#00FF00',
          warning: '#FFFF00',
          'surface-variant': '#111111',
          'on-background': '#111111',
          'on-surface': '#111111',
          'on-primary': '#FFFFFF',
          'on-surface-variant': '#FFFFFF',
        },
        variables: {
          'border-color': '#111111',
          'border-opacity': 1,
          'high-emphasis-opacity': 1,
          'medium-emphasis-opacity': 0.8,
          'disabled-opacity': 0.4,
          'idle-opacity': 1,
          'hover-opacity': 0.1,
          'focus-opacity': 0.2,
          'selected-opacity': 0.2,
          'activated-opacity': 0.2,
          'pressed-opacity': 0.3,
          'dragged-opacity': 0.2,
        }
      },
      dark: {
        dark: true,
        colors: {
          background: '#0F0F0F', // Brutalist deep black
          surface: '#1A1A1A', // Dark surface
          primary: '#EAE6DF', // Paper white for text/primary
          secondary: '#888888',
          accent: '#00FF00', // Brutalist neon green
          error: '#FF0000',
          info: '#0000FF',
          success: '#00FF00',
          warning: '#FFFF00',
          'surface-variant': '#EAE6DF',
          'on-background': '#EAE6DF',
          'on-surface': '#EAE6DF',
          'on-primary': '#0F0F0F',
          'on-surface-variant': '#0F0F0F',
        },
        variables: {
          'border-color': '#EAE6DF',
          'border-opacity': 1,
          'high-emphasis-opacity': 1,
          'medium-emphasis-opacity': 0.8,
          'disabled-opacity': 0.4,
          'idle-opacity': 1,
          'hover-opacity': 0.1,
          'focus-opacity': 0.2,
          'selected-opacity': 0.2,
          'activated-opacity': 0.2,
          'pressed-opacity': 0.3,
          'dragged-opacity': 0.2,
        }
      }
    }
  },
  defaults: {
    VCard: {
      elevation: 0,
      rounded: '0', // No rounded corners in brutalism
    },
    VBtn: {
      rounded: '0', // Sharp corners
      elevation: 0,
      style: 'text-transform: uppercase; font-family: "Space Mono", monospace; font-weight: 700; letter-spacing: 1px;',
    },
    VTextField: {
      variant: 'outlined',
      rounded: '0',
      hideDetails: 'auto',
    },
    VFileInput: {
      variant: 'outlined',
      rounded: '0',
      hideDetails: 'auto',
    },
    VChip: {
      rounded: '0',
    },
    VAvatar: {
      rounded: '0',
    }
  }
})
