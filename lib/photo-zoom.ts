export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type PhotoView = Point & { scale: number };
export const INITIAL_VIEW: PhotoView = { scale: 1, x: 0, y: 0 };
export const MAX_ZOOM = 4;

/** Normalize mouse wheels and trackpads without large jumps from page deltas. */
export function wheelZoomScale(
  scale: number,
  delta: number,
  mode: number,
  height: number,
) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? height : 1);
  const bounded = Math.max(-240, Math.min(240, pixels));
  return Math.min(MAX_ZOOM, Math.max(1, scale * Math.exp(-bounded * 0.002)));
}

export function fitPhoto(image: Size, viewport: Size): Size {
  if (
    image.width <= 0 ||
    image.height <= 0 ||
    viewport.width <= 0 ||
    viewport.height <= 0
  )
    return { width: 0, height: 0 };
  const ratio = Math.min(
    viewport.width / image.width,
    viewport.height / image.height,
  );
  return { width: image.width * ratio, height: image.height * ratio };
}
export function constrainView(
  view: PhotoView,
  image: Size,
  viewport: Size,
): PhotoView {
  const scale = Math.min(MAX_ZOOM, Math.max(1, view.scale));
  const limitX = Math.max(0, (image.width * scale - viewport.width) / 2);
  const limitY = Math.max(0, (image.height * scale - viewport.height) / 2);
  return {
    scale,
    x: Math.max(-limitX, Math.min(limitX, view.x)),
    y: Math.max(-limitY, Math.min(limitY, view.y)),
  };
}
/** Preserve desktop zoom and the viewed detail when the frame changes size. */
export function resizeMouseView(
  view: PhotoView,
  before: Size,
  after: Size,
  viewport: Size,
): PhotoView {
  if (!before.width || !before.height) return INITIAL_VIEW;
  return constrainView(
    {
      scale: view.scale,
      x: (view.x * after.width) / before.width,
      y: (view.y * after.height) / before.height,
    },
    after,
    viewport,
  );
}
/** Keep the same image point beneath the midpoint of a pinch or zoom action. */
export function zoomPhoto(
  view: PhotoView,
  scale: number,
  from: Point,
  to: Point,
  image: Size,
  viewport: Size,
): PhotoView {
  const nextScale = Math.min(MAX_ZOOM, Math.max(1, scale));
  const ratio = nextScale / view.scale;
  return constrainView(
    {
      scale: nextScale,
      x: to.x - (from.x - view.x) * ratio,
      y: to.y - (from.y - view.y) * ratio,
    },
    image,
    viewport,
  );
}
