/** @type {import('tailwindcss').Config} */
const { heroui } = require('@heroui/react')
const themeLight = require('./src/theme/colors/light')
const themeDark = require('./src/theme/colors/dark')
import { Config } from 'tailwindcss'

const config: Config = {
  mode: 'jit',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      ...themeLight
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1200px',
      '2xl': '1536px'
    }
  },
  darkMode: 'class',
  plugins: [
    heroui({
      layout: {
        radius: {
          small: '7px',
          medium: '9px',
          large: '12px'
        },
        boxShadow: {
          small:
            '0px 0px 3px 0px rgb(0 0 0 / 0.01), 0px 1px 6px 0px rgb(0 0 0 / 0.04), 0px 0px 1px 0px rgb(0 0 0 / 0.2)',
          medium:
            '0px 0px 6px 0px rgb(0 0 0 / 0.02), 0px 1px 12px 0px rgb(0 0 0 / 0.05), 0px 0px 1px 0px rgb(0 0 0 / 0.2)',
          large:
            '0px 0px 15px 0px rgb(0 0 0 / 0.03), 0px 15px 30px 0px rgb(0 0 0 / 0.08), 0px 0px 1px 0px rgb(0 0 0 / 0.2)'
        },
        disabledOpacity: '1'
      },
      addCommonColors: true,
      themes: {
        light: themeLight,
        dark: themeDark
      }
    })
  ]
}

export default config
