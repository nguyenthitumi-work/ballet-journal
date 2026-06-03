import type { MetadataRoute } from 'next';

// Web app manifest — makes the app installable to a phone home screen / desktop.
// Next serves this at /manifest.webmanifest and auto-links it from <head>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ballet & Yoga Journal',
    short_name: 'Journal',
    description: 'Track ballet and yoga practice — poses, flows, and progress.',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf5ff',
    theme_color: '#6d28d9',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
