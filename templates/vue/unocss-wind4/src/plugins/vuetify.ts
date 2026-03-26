/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
import { forVuetify } from '../theme/breakpoints'

// Styles
import '@mdi/font/css/materialdesignicons.css'
import '../styles/layers.css'
// @ts-ignore
import 'vuetify/styles'

import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'system',
  },
  display: {
    mobileBreakpoint: 'md',
    thresholds: forVuetify,
  },
})
