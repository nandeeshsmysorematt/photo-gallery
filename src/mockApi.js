// Offline stand-in for https://picsum.photos/v2/list, used only when
// VITE_USE_MOCK=true. Serves 4 pages of 30 photos, then an empty page.
export function mockPage(page) {
  if (page > 4) return [];
  return Array.from({ length: 30 }, (_, i) => {
    const n = (page - 1) * 30 + i;
    const color = `hsl(${(n * 37) % 360} 60% 50%)`;
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='267'>` +
      `<rect width='100%' height='100%' fill='${color}'/>` +
      `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' ` +
      `font-size='36' font-family='sans-serif' fill='white'>Photo ${n}</text></svg>`;
    return {
      id: String(n),
      author: `Author ${n}`,
      width: 5000,
      height: 3333,
      download_url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    };
  });
}
