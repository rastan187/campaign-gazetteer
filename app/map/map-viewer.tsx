"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import styles from "./map.module.css";

type MapTile = {
  layer: string;
  asset: string;
  rotation: number;
  mirror: boolean;
};

type MapCell = {
  index: number;
  coordinate: string;
  column: number;
  row: number;
  fogged: boolean;
  title: string;
  description: string;
  tiles: MapTile[];
};

type PlayerMap = {
  name: string;
  width: number;
  height: number;
  foggedHexCount: number;
  cells: MapCell[];
};

type ViewTransform = {
  x: number;
  y: number;
  scale: number;
};

const TILE_SIZE = 176;
const X_STEP = TILE_SIZE * 0.79;
const Y_STEP = TILE_SIZE * 0.68;
const ROW_OFFSET = X_STEP / 2;
const MIN_SCALE = 0.22;
const MAX_SCALE = 2.25;

export function MapViewer({ map }: { map: PlayerMap }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const draggedRef = useRef(false);
  const [selectedCell, setSelectedCell] = useState<MapCell | null>(null);
  const [view, setView] = useState<ViewTransform>({ x: 0, y: 0, scale: 0.3 });

  const world = useMemo(
    () => ({
      width: TILE_SIZE + (map.width - 1) * X_STEP + ROW_OFFSET,
      height: TILE_SIZE + (map.height - 1) * Y_STEP,
    }),
    [map.height, map.width],
  );

  const fitMap = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const padding = viewport.clientWidth < 640 ? 20 : 48;
    const nextScale = Math.max(
      MIN_SCALE,
      Math.min(
        (viewport.clientWidth - padding) / world.width,
        (viewport.clientHeight - padding) / world.height,
        1,
      ),
    );

    setView({
      scale: nextScale,
      x: (viewport.clientWidth - world.width * nextScale) / 2,
      y: (viewport.clientHeight - world.height * nextScale) / 2,
    });
  }, [world.height, world.width]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    fitMap();
    const observer = new ResizeObserver(fitMap);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitMap]);

  function zoomBy(factor: number) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const centerX = viewport.clientWidth / 2;
    const centerY = viewport.clientHeight / 2;

    setView((current) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor));
      const worldX = (centerX - current.x) / current.scale;
      const worldY = (centerY - current.y) / current.scale;
      return {
        scale,
        x: centerX - worldX * scale,
        y: centerY - worldY * scale,
      };
    });
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const anchorX = event.clientX - rect.left;
    const anchorY = event.clientY - rect.top;
    const factor = event.deltaY < 0 ? 1.12 : 0.89;

    setView((current) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor));
      const worldX = (anchorX - current.x) / current.scale;
      const worldY = (anchorY - current.y) / current.scale;
      return {
        scale,
        x: anchorX - worldX * scale,
        y: anchorY - worldY * scale,
      };
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggedRef.current = false;
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: view.x,
      originY: view.y,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const deltaX = event.clientX - pointer.startX;
    const deltaY = event.clientY - pointer.startY;
    if (Math.hypot(deltaX, deltaY) > 5) draggedRef.current = true;
    setView((current) => ({
      ...current,
      x: pointer.originX + deltaX,
      y: pointer.originY + deltaY,
    }));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerRef.current?.id === event.pointerId) {
      pointerRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function selectCell(cell: MapCell) {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setSelectedCell(cell);
  }

  return (
    <main className={styles.mapPage}>
      <header className={styles.mapHeader}>
        <div>
          <p className={styles.eyebrow}>Campaign Gazetteer</p>
          <h1>{map.name}</h1>
        </div>
        <div className={styles.headerActions}>
          <span>{map.foggedHexCount} uncharted features</span>
          <Link href="/">Atlas</Link>
        </div>
      </header>

      <section className={styles.viewerShell} aria-label={`${map.name} hex map`}>
        <div
          ref={viewportRef}
          className={styles.viewport}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className={styles.mapTools} aria-label="Map controls">
            <button type="button" onClick={() => zoomBy(1.25)} aria-label="Zoom in">
              +
            </button>
            <button type="button" onClick={() => zoomBy(0.8)} aria-label="Zoom out">
              −
            </button>
            <button type="button" onClick={fitMap} aria-label="Fit map to screen">
              Fit
            </button>
          </div>

          <div
            className={styles.mapWorld}
            style={
              {
                width: world.width,
                height: world.height,
                transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
              } as CSSProperties
            }
          >
            {map.cells.map((cell) => {
              const left = (cell.column - 1) * X_STEP + ((cell.row - 1) % 2) * ROW_OFFSET;
              const top = (cell.row - 1) * Y_STEP;
              const isSelected = selectedCell?.coordinate === cell.coordinate;

              return (
                <div
                  className={styles.hexCell}
                  key={cell.coordinate}
                  style={{ left, top, width: TILE_SIZE, height: TILE_SIZE }}
                >
                  {cell.tiles.map((tile, tileIndex) => (
                    // The generated dataset contains player-safe asset names only.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${tile.layer}-${tileIndex}`}
                      className={styles.tile}
                      src={`../map-tiles/${tile.asset}`}
                      alt=""
                      draggable={false}
                      style={{
                        transform: `rotate(${tile.rotation * 60}deg) scaleX(${tile.mirror ? -1 : 1})`,
                      }}
                    />
                  ))}
                  {cell.fogged ? (
                    <span className={styles.fogMarker} aria-hidden="true">
                      ?
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={`${styles.hexButton} ${isSelected ? styles.selectedHex : ""}`}
                    onClick={() => selectCell(cell)}
                    aria-label={
                      cell.fogged
                        ? `Hex ${cell.coordinate}, uncharted feature`
                        : `Hex ${cell.coordinate}${cell.title ? `, ${cell.title}` : ""}`
                    }
                  >
                    <span>{cell.coordinate}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <aside className={styles.details} aria-live="polite">
          {selectedCell ? (
            <>
              <p className={styles.detailCoordinate}>Hex {selectedCell.coordinate}</p>
              <h2>
                {selectedCell.fogged
                  ? "Uncharted feature"
                  : selectedCell.title || "Open country"}
              </h2>
              <p>
                {selectedCell.fogged
                  ? "The terrain is known, but whatever lies here has not yet been discovered."
                  : selectedCell.description || "No discovery has been recorded here yet."}
              </p>
            </>
          ) : (
            <>
              <p className={styles.detailCoordinate}>Field notes</p>
              <h2>Select a hex</h2>
              <p>Tap a hex to read what the party knows about it.</p>
            </>
          )}
          <div className={styles.legend}>
            <span><i className={styles.legendFog}>?</i> Concealed feature</span>
            <span><i className={styles.legendKnown} /> Known terrain</span>
          </div>
        </aside>
      </section>
    </main>
  );
}
