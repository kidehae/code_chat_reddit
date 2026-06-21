import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import { nitro } from 'nitro/vite';

export default defineConfig({
  plugins: [
    tanstackStart(), 
    nitro({
      preset: 'vercel' // 👈 Explicitly tell Nitro to compile for Vercel functions
    })
  ],
});