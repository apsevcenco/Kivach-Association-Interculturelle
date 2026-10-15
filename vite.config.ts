import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        association: resolve(root, 'association/index.html'),
        presidente: resolve(root, 'presidente/index.html'),
        projets: resolve(root, 'projets/index.html'),
        galerie: resolve(root, 'galerie/index.html'),
        contact: resolve(root, 'contact/index.html'),
        admin: resolve(root, 'admin/index.html'),
      },
    },
  },
})
