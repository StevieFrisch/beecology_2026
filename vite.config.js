import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The live site is a GitHub Pages project page: https://steviefrisch.github.io/beecology_2026/
// Builds use that sub-folder as the base; the dev server stays at the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/beecology_2026/' : '/',
  plugins: [react(), tailwindcss()],
}))
