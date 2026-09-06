'use client';

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Expand,
  Minus,
  Plus,
  RotateCcw,
  X,
  ImageOff,
} from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { asset, type gallery } from '@/lib/content';
import { imageDimensions } from '@/lib/images';
import {
  constrainView,
  fitPhoto,
  INITIAL_VIEW,
  MAX_ZOOM,
  zoomPhoto,
  type PhotoView,
  type Point,
  type Size,
} from '@/lib/photo-zoom';

type Photo = (typeof gallery)[number];
type Gesture =
  | {
      kind: 'drag';
      point: Point;
      view: PhotoView;
      swipe: boolean;
      moved: boolean;
    }
  | { kind: 'pinch'; point: Point; distance: number; view: PhotoView };

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function ZoomablePhoto({
  photo,
  index,
  count,
  expanded,
  onMove,
  onExpand,
  expandButton,
}: {
  photo: Photo;
  index: number;
  count: number;
  expanded: boolean;
  onMove: (delta: number) => void;
  onExpand: () => void;
  expandButton: RefObject<HTMLButtonElement | null>;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [view, setView] = useState<PhotoView>(INITIAL_VIEW);
  const camera = useRef<PhotoView>(INITIAL_VIEW);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const frame = useRef<number | null>(null);
  const bounds = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const measured = useRef<Size>({ width: 0, height: 0 });
  const lastTap = useRef<{ time: number; point: Point } | null>(null);
  const [imageState, setImageState] = useState({
    image: '',
    ready: false,
    failed: false,
  });
  const loaded = imageState.image === photo.image && imageState.ready;
  const failed = imageState.image === photo.image && imageState.failed;
  const [interacting, setInteracting] = useState(false);
  const fitted = fitPhoto(imageDimensions[photo.image], viewport);

  function update(next: PhotoView) {
    camera.current = next;
    // Pointer input is coalesced into one small viewer update per frame.
    if (frame.current === null)
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        setView(camera.current);
      });
  }
  function reset() {
    pointers.current.clear();
    gesture.current = null;
    setInteracting(false);
    update(INITIAL_VIEW);
    lastTap.current = null;
  }
  function zoomTo(scale: number, point: Point = { x: 0, y: 0 }) {
    if (!loaded || failed) return;
    pointers.current.clear();
    gesture.current = null;
    setInteracting(false);
    update(zoomPhoto(camera.current, scale, point, point, fitted, viewport));
  }

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    let sizeFrame: number | null = null;
    let firstMeasure = true;
    const measure = () => {
      if (sizeFrame !== null) cancelAnimationFrame(sizeFrame);
      sizeFrame = requestAnimationFrame(() => {
        sizeFrame = null;
        const rect = element.getBoundingClientRect();
        const width = element.clientWidth,
          height = element.clientHeight;
        if (
          !firstMeasure &&
          width === measured.current.width &&
          height === measured.current.height
        )
          return;
        firstMeasure = false;
        measured.current = { width, height };
        bounds.current = {
          left: rect.left,
          top: rect.top,
          width,
          height,
        };
        pointers.current.clear();
        gesture.current = null;
        lastTap.current = null;
        camera.current = INITIAL_VIEW;
        setViewport({ width, height });
        setView(INITIAL_VIEW);
        setInteracting(false);
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => {
      observer.disconnect();
      if (sizeFrame !== null) cancelAnimationFrame(sizeFrame);
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    };
  }, [photo.image]);

  function localPoint(event: ReactPointerEvent): Point {
    return {
      x: event.clientX - bounds.current.left - bounds.current.width / 2,
      y: event.clientY - bounds.current.top - bounds.current.height / 2,
    };
  }
  function beginGesture(allowTap: boolean) {
    const points = [...pointers.current.values()];
    if (points.length >= 2) {
      gesture.current = {
        kind: 'pinch',
        point: midpoint(points[0], points[1]),
        distance: Math.max(1, distance(points[0], points[1])),
        view: { ...camera.current },
      };
      lastTap.current = null;
    } else if (points.length === 1) {
      gesture.current = {
        kind: 'drag',
        point: points[0],
        view: { ...camera.current },
        swipe: allowTap && camera.current.scale === 1,
        moved: !allowTap,
      };
    } else gesture.current = null;
  }
  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      !loaded ||
      failed ||
      (event.pointerType === 'mouse' && event.button !== 0)
    )
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    bounds.current = {
      left: rect.left,
      top: rect.top,
      width: event.currentTarget.clientWidth,
      height: event.currentTarget.clientHeight,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, localPoint(event));
    beginGesture(pointers.current.size === 1);
    setInteracting(true);
  }
  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, localPoint(event));
    const active = gesture.current;
    const points = [...pointers.current.values()];
    if (active?.kind === 'pinch' && points.length >= 2) {
      update(
        zoomPhoto(
          active.view,
          (active.view.scale * distance(points[0], points[1])) /
            active.distance,
          active.point,
          midpoint(points[0], points[1]),
          fitted,
          viewport,
        ),
      );
    } else if (active?.kind === 'drag' && points.length === 1) {
      const dx = points[0].x - active.point.x,
        dy = points[0].y - active.point.y;
      if (Math.hypot(dx, dy) > 8) active.moved = true;
      if (active.view.scale > 1)
        update(
          constrainView(
            { ...active.view, x: active.view.x + dx, y: active.view.y + dy },
            fitted,
            viewport,
          ),
        );
    }
  }
  function finishPointer(
    event: ReactPointerEvent<HTMLDivElement>,
    cancelled = false,
  ) {
    if (!pointers.current.has(event.pointerId)) return;
    const active = gesture.current;
    const point = localPoint(event);
    if (!cancelled && active?.kind === 'drag' && pointers.current.size === 1) {
      const dx = point.x - active.point.x,
        dy = point.y - active.point.y;
      if (
        active.swipe &&
        Math.abs(dx) > 65 &&
        Math.abs(dx) > Math.abs(dy) * 1.4
      ) {
        lastTap.current = null;
        onMove(dx < 0 ? 1 : -1);
      } else if (!active.moved) {
        const previous = lastTap.current;
        if (
          previous &&
          event.timeStamp - previous.time < 320 &&
          distance(previous.point, point) < 28
        ) {
          zoomTo(camera.current.scale > 1 ? 1 : 2, point);
          lastTap.current = null;
        } else lastTap.current = { time: event.timeStamp, point };
      } else lastTap.current = null;
    }
    pointers.current.delete(event.pointerId);
    if (cancelled) lastTap.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    // A pinch ending with one finger becomes pan, never an accidental photo swipe.
    beginGesture(false);
    setInteracting(pointers.current.size > 0);
  }
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomTo(camera.current.scale + 0.5);
    }
    if (event.key === '-') {
      event.preventDefault();
      zoomTo(camera.current.scale - 0.5);
    }
    if (event.key === '0') {
      event.preventDefault();
      reset();
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      if (camera.current.scale === 1)
        onMove(event.key === 'ArrowRight' ? 1 : -1);
      else
        update(
          constrainView(
            {
              ...camera.current,
              x: camera.current.x + (event.key === 'ArrowRight' ? -60 : 60),
            },
            fitted,
            viewport,
          ),
        );
    }
    if (
      camera.current.scale > 1 &&
      (event.key === 'ArrowUp' || event.key === 'ArrowDown')
    ) {
      event.preventDefault();
      update(
        constrainView(
          {
            ...camera.current,
            y: camera.current.y + (event.key === 'ArrowDown' ? -60 : 60),
          },
          fitted,
          viewport,
        ),
      );
    }
  });
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => handleKeyDown(event);
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);

  return (
    <div className="viewer-body">
      <div
        ref={stage}
        className="viewer-stage"
        data-zoomed={view.scale > 1 || undefined}
        data-interacting={interacting || undefined}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={(event) => finishPointer(event)}
        onPointerCancel={(event) => finishPointer(event, true)}
        onLostPointerCapture={(event) => finishPointer(event, true)}
      >
        {!loaded && !failed && (
          <output className="viewer-loading">Завантажуємо фото…</output>
        )}
        {failed && (
          <div className="viewer-error" aria-live="polite">
            <ImageOff />
            <p>Фото не завантажилося.</p>
            <a
              href={asset(photo.image)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Відкрити оригінал
            </a>
          </div>
        )}
        <img
          src={asset(photo.image)}
          alt={`${photo.title}. ${photo.subtitle}`}
          draggable={false}
          width={imageDimensions[photo.image].width}
          height={imageDimensions[photo.image].height}
          decoding="async"
          onLoad={() =>
            setImageState({ image: photo.image, ready: true, failed: false })
          }
          onError={() =>
            setImageState({ image: photo.image, ready: false, failed: true })
          }
          style={{
            width: fitted.width || '100%',
            height: fitted.height || '100%',
            opacity: loaded ? 1 : 0,
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          }}
        />
      </div>
      <div className="viewer-controls">
        <p className="viewer-hint">
          Два пальці або «+» — збільшити. Збільшене фото можна пересувати.
        </p>
        <div className="viewer-toolbar">
          <div className="viewer-paging" aria-label="Перемикання фотографій">
            <button
              type="button"
              aria-label="Попереднє фото"
              onClick={() => onMove(-1)}
              disabled={count < 2}
            >
              <ChevronLeft />
            </button>
            <span aria-live="polite" aria-atomic="true">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              aria-label="Наступне фото"
              onClick={() => onMove(1)}
              disabled={count < 2}
            >
              <ChevronRight />
            </button>
          </div>
          <div className="viewer-zoom" aria-label="Масштаб фотографії">
            <button
              type="button"
              aria-label="Зменшити фото"
              onClick={() => zoomTo(camera.current.scale - 0.5)}
              disabled={!loaded || failed || view.scale <= 1}
            >
              <Minus />
            </button>
            <output aria-label="Поточний масштаб">
              {Math.round(view.scale * 100)}%
            </output>
            <button
              type="button"
              aria-label="Збільшити фото"
              onClick={() => zoomTo(camera.current.scale + 0.5)}
              disabled={!loaded || failed || view.scale >= MAX_ZOOM}
            >
              <Plus />
            </button>
            <button
              type="button"
              className="viewer-reset"
              aria-label="Скинути масштаб фотографії"
              onClick={reset}
              disabled={view.scale === 1}
            >
              <RotateCcw />
              <span>Скинути</span>
            </button>
          </div>
          {!expanded && (
            <button
              type="button"
              className="viewer-expand"
              ref={expandButton}
              onClick={onExpand}
            >
              <Expand />
              <span>На весь екран</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PhotoViewer({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: Photo[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const previousMode = useRef(false);
  const photo = index === null ? null : (photos[index] ?? null);
  useEffect(() => {
    if (previousMode.current === expanded) return;
    previousMode.current = expanded;
    if (index !== null)
      (expanded ? backButton.current : expandButton.current)?.focus({
        preventScroll: true,
      });
  }, [expanded, index]);
  function close() {
    setExpanded(false);
    onClose();
  }
  return (
    <Dialog
      open={photo !== null}
      onOpenChange={(open, details) => {
        if (open) return;
        if (expanded && details.reason === 'escape-key') {
          details.cancel();
          setExpanded(false);
        } else close();
      }}
    >
      <DialogContent
        className="photo-viewer"
        data-expanded={expanded || undefined}
        showCloseButton={false}
        initialFocus={closeButton}
      >
        <header className="viewer-header">
          <div className="viewer-title">
            <DialogTitle>{photo?.title}</DialogTitle>
            <DialogDescription>{photo?.subtitle}</DialogDescription>
          </div>
          <div className="viewer-header-actions">
            {expanded && (
              <button
                type="button"
                className="viewer-back"
                aria-label="Повернутися до віконного перегляду"
                ref={backButton}
                onClick={() => setExpanded(false)}
              >
                <ArrowLeft />
                <span>До вікна</span>
              </button>
            )}
            <DialogClose
              ref={closeButton}
              className="viewer-close"
              aria-label="Закрити перегляд фотографій"
            >
              <X />
              <span>Закрити</span>
            </DialogClose>
          </div>
        </header>
        {photo && index !== null && (
          <ZoomablePhoto
            photo={photo}
            index={index}
            count={photos.length}
            expanded={expanded}
            expandButton={expandButton}
            onExpand={() => setExpanded(true)}
            onMove={(delta) =>
              onIndexChange((index + delta + photos.length) % photos.length)
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
