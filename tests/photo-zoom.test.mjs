import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fitPhoto,
  constrainView,
  zoomPhoto,
  INITIAL_VIEW,
  wheelZoomScale,
  resizeMouseView,
} from '../lib/photo-zoom.ts';

test('Desktop fullscreen preserves zoom and viewed detail; refitting constrains bounds', () => {
  const image = { width: 1200, height: 1600 };
  const compact = { width: 900, height: 600 },
    full = { width: 1600, height: 900 };
  const before = fitPhoto(image, compact),
    after = fitPhoto(image, full);
  const start = { scale: 3, x: 80, y: -100 };
  const result = resizeMouseView(start, before, after, full);
  assert.deepEqual(result, { scale: 3, x: 120, y: -150 });
  assert.deepEqual(resizeMouseView(result, after, before, compact), start);
  assert.deepEqual(
    resizeMouseView(INITIAL_VIEW, before, after, full),
    INITIAL_VIEW,
  );
  assert.equal(
    resizeMouseView({ scale: 2, x: 80, y: 100 }, before, after, full).x,
    0,
  );
});

test('Wheels and trackpads use consistent units and remain bounded', () => {
  assert.equal(wheelZoomScale(2, 16, 0, 600), wheelZoomScale(2, 1, 1, 600));
  assert.equal(wheelZoomScale(2, 120, 0, 600), wheelZoomScale(2, 0.2, 2, 600));
  assert.equal(wheelZoomScale(1, 100, 0, 600), 1);
  assert.equal(wheelZoomScale(4, -100, 0, 600), 4);
  const zoomed = wheelZoomScale(2, -100, 0, 600);
  assert.ok(zoomed > 2 && zoomed < 3);
  assert.ok(Math.abs(wheelZoomScale(zoomed, 100, 0, 600) - 2) < 1e-10);
  assert.ok(wheelZoomScale(1, -100000, 0, 600) < 2);
});

test('Portrait and landscape viewports contain the whole photo without stretching', () => {
  assert.deepEqual(
    fitPhoto({ width: 1200, height: 1600 }, { width: 360, height: 480 }),
    { width: 360, height: 480 },
  );
  assert.deepEqual(
    fitPhoto({ width: 1200, height: 1600 }, { width: 700, height: 280 }),
    { width: 210, height: 280 },
  );
  assert.deepEqual(
    fitPhoto({ width: 1600, height: 900 }, { width: 320, height: 400 }),
    { width: 320, height: 180 },
  );
  assert.deepEqual(
    fitPhoto({ width: 1200, height: 1600 }, { width: 0, height: 0 }),
    { width: 0, height: 0 },
  );
});
test('Pinch preserves the image detail under the moving midpoint of two fingers', () => {
  const size = { width: 400, height: 400 };
  const start = { scale: 2, x: 30, y: -20 };
  const from = { x: 50, y: 60 },
    to = { x: 70, y: 80 };
  const result = zoomPhoto(start, 3, from, to, size, size);
  assert.deepEqual(result, { scale: 3, x: 40, y: -40 });
  assert.equal(
    (from.x - start.x) / start.scale,
    (to.x - result.x) / result.scale,
  );
  assert.equal(
    (from.y - start.y) / start.scale,
    (to.y - result.y) / result.scale,
  );
});
test('Zoom and pan stay within bounds, including letterboxing and returning to 100%', () => {
  const image = { width: 300, height: 400 },
    viewport = { width: 600, height: 400 };
  assert.deepEqual(
    constrainView({ scale: 2, x: 1000, y: -1000 }, image, viewport),
    { scale: 2, x: 0, y: -200 },
  );
  assert.deepEqual(
    constrainView({ scale: 7, x: 1000, y: 1000 }, image, viewport),
    { scale: 4, x: 300, y: 600 },
  );
  assert.deepEqual(
    zoomPhoto(
      { scale: 4, x: 300, y: 600 },
      0.5,
      { x: 100, y: 100 },
      { x: 100, y: 100 },
      image,
      viewport,
    ),
    INITIAL_VIEW,
  );
});
test('Rotating a device recalculates letterboxing and valid pan limits', () => {
  const viewport = { width: 720, height: 240 };
  const fit = fitPhoto({ width: 1200, height: 1600 }, viewport);
  assert.deepEqual(fit, { width: 180, height: 240 });
  assert.deepEqual(constrainView({ scale: 2, x: 240, y: 400 }, fit, viewport), {
    scale: 2,
    x: 0,
    y: 120,
  });
});
