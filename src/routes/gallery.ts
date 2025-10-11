import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fs from 'fs';
import path from 'path';

function isImageFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.jpeg') || lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.webp') || lower.endsWith('.gif');
}

function fileNameToId(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

export default async function galleryRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.get('/gallery', async (_request, reply) => {
    const imagesDir = path.resolve(process.cwd(), 'images');
    let files: string[] = [];
    try {
      files = fs.readdirSync(imagesDir).filter(isImageFile).sort((a, b) => a.localeCompare(b));
    } catch (e) {
      fastify.log.error(e);
      return reply.type('text/html').send('<h1>Gallery</h1><p>No images found or images directory missing.</p>');
    }

    const itemsHtml = files.map((file, index) => {
      const id = fileNameToId(file);
      const src = `/images/${encodeURIComponent(file)}`;
      return `<figure class="item"><img loading="lazy" src="${src}" alt="${id}"><figcaption>${index + 1}: ${id}</figcaption></figure>`;
    }).join('');

    const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>图片库</title>
  <style>
    :root { --gap: 12px; --bg: #0b0c0f; --fg: #e8eaed; --muted: #9aa0a6; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'; background: var(--bg); color: var(--fg); }
    header { position: sticky; top: 0; background: rgba(11,12,15,0.9); backdrop-filter: blur(8px); padding: 12px 16px; border-bottom: 1px solid #222; }
    header h1 { margin: 0; font-size: 18px; }
    main { padding: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(700px, 1fr)); gap: var(--gap); }
    .item { display: flex; flex-direction: column; gap: 8px; background: #111418; border: 1px solid #1f2328; border-radius: 10px; padding: 10px; overflow: hidden; }
    .item img { width: 100%; object-fit: cover; border-radius: 6px; background: #0d1117; }
    .item figcaption { font-size: 12px; color: var(--muted); word-break: break-all; }
    footer { color: var(--muted); font-size: 12px; padding: 16px; text-align: center; }
  </style>
  <link rel="preload" as="image" href="/images/${encodeURIComponent(files[0] || '')}">
  <meta name="robots" content="noindex">
</head>
<body>
  <header>
    <h1>图片库（${files.length}）</h1>
  </header>
  <main>
    <section class="grid">${itemsHtml}</section>
  </main>
  <footer>由系统自动生成，新增图片会自动展示。</footer>
</body>
</html>`;

    return reply.type('text/html; charset=utf-8').send(html);
  });
}


