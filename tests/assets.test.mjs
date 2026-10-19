import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { imageDimensions } from '../lib/images.ts';
import { gallery } from '../lib/content.ts';
test('Every photo and responsive variant referenced by the gallery exists', () => {
  assert.equal(gallery.length, 14);
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
test('Factual photos and architectural examples retain separate categories', () => {
  assert.equal(
    gallery.filter((photo) => photo.category === 'portfolio').length,
    7,
  );
  for (const image of ['house-front', 'house-stairs', 'house-deck'])
    assert.equal(
      gallery.find((photo) => photo.image === image).category,
      'portfolio',
      image,
    );
  assert.equal(
    gallery.find((photo) => photo.image === 'hero').category,
    'ideas',
  );
});
test('Messenger preview uses a JPEG cover that exists', () => {
  assert.ok(
    fs.existsSync(new URL('../public/images/og-cover.jpg', import.meta.url)),
  );
});
