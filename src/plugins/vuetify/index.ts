import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    themes: {
      light: {
        colors: {
          background: '#FAFAFA' // 只改背景色为柔和的浅灰，其他保持默认
        }
      }
    }
  }
})
