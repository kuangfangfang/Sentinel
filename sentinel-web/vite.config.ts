import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SITE_DESCRIPTION =
  'Sentinel Rights is a guided, accessible portal for lodging and tracking human rights and discrimination complaints in Australia.';

const SITEMAP_PATHS = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/report', priority: '0.9', changefreq: 'monthly' },
  { loc: '/track', priority: '0.8', changefreq: 'monthly' },
  { loc: '/what-we-handle', priority: '0.8', changefreq: 'monthly' },
  { loc: '/about', priority: '0.7', changefreq: 'monthly' },
  { loc: '/resources', priority: '0.6', changefreq: 'monthly' },
];

function siteUrl(): string {
  return (process.env.VITE_SITE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
}

function siteUrlSeoPlugin(): Plugin {
  return {
    name: 'sentinel-site-url-seo',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', siteUrl());
    },
    generateBundle() {
      const base = siteUrl();
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`,
      });

      const urls = SITEMAP_PATHS.map(
        (entry) =>
          `  <url>\n    <loc>${base}${entry.loc}</loc>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`,
      ).join('\n');

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), siteUrlSeoPlugin()],
  server: {
    port: 5173,
  },
});
