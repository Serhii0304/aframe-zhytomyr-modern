import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { imageDimensions } from '../lib/images.ts';
import { gallery } from '../lib/content.ts';
test('Every photo and responsive variant referenced by the gallery exists', () => {
  assert.equal(gallery.length, 10);
  for (const item of gallery) {
    const meta = imageDimensions[item.image];
    assert.ok(meta && meta.width > 0 && meta.height > 0);
    for (const suffix of ['', '-360', ...(meta.medium ? ['-600'] : [])])
      assert.ok(
        fs.existsSync(
          new URL(
            `../public/images/${item.image}${suffix}.webp`,
            import.meta.url,
          ),
        ),
        `${item.image}${suffix}`,
      );
  }
});
test('Gallery shows only the crew’s own projects, grouped by building type', () => {
  const counts = {};
  for (const photo of gallery)
    counts[photo.category] = (counts[photo.category] || 0) + 1;
  assert.deepEqual(counts, { aframe: 4, house: 3, interior: 3 });
  // Знімки з інтернету прибрано: на комерційному сайті це ризик щодо прав
  for (const image of [
    'hero',
    'frame-1',
    'frame-2',
    'frame-3',
    'model-3d',
    'model-red',
    'dusk-vertical',
  ])
    assert.ok(!gallery.some((photo) => photo.image === image), image);
  for (const image of [
    'aframe-front',
    'aframe-side',
    'aframe-group',
    'house-porch',
  ])
    assert.ok(
      gallery.some((photo) => photo.image === image),
      image,
    );
});
test('Every gallery tab either fills the mosaic exactly or is a single row', () => {
  for (const category of ['aframe', 'house', 'interior', undefined]) {
    const n = gallery.filter(
      (p) => !category || p.category === category,
    ).length;
    const mosaic = n >= 4 && (n - 4) % 3 === 0;
    assert.ok(mosaic || n === 3, `${category ?? 'all'}: ${n}`);
  }
});
test('Messenger preview uses a JPEG cover that exists', () => {
  assert.ok(
    fs.existsSync(new URL('../public/images/og-cover.jpg', import.meta.url)),
  );
});
