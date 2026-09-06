export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type PhotoView = Point & { scale: number };
export const INITIAL_VIEW: PhotoView = { scale: 1, x: 0, y: 0 };
export const MAX_ZOOM = 4;

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
