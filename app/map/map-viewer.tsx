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
  title: string;
  description: string;
  tiles: MapTile[];
};

type PlayerMap = {
  name: string;
  width: number;
  height: number;
  knownLocationCount: number;
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
const MIN_SCALE = 0.005;
const MAX_SCALE = 2.25;

export function MapViewer({ map }: { map: PlayerMap }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    cellIndex: number | null;
  } | null>(null);
  const draggedRef = useRef(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; worldX: number; worldY: number; scale: number } | null>(null);
  const initialized = useRef(false);
  const [selectedCell, setSelectedCell] = useState<MapCell | null>(null);
  const [view, setView] = useState<ViewTransform>({ x: 0, y: 0, scale: 0.3 });
  const [query, setQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [linkStatus, setLinkStatus] = useState("");
  const [tileError, setTileError] = useState(false);
  const storageKey = `campaign-map-view:${map.name}:${map.width}x${map.height}`;
  const knownLocations = map.cells.filter((cell) => cell.title);
  const matches = (query.trim() ? map.cells : knownLocations).filter((cell) => `${cell.title} ${cell.coordinate}`.toLowerCase().includes(query.trim().toLowerCase()));

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
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
      if (saved && Number.isFinite(saved.scale) && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        if (saved.width === viewport.clientWidth && saved.height === viewport.clientHeight) setView({ x: saved.x, y: saved.y, scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, saved.scale)) });
        const cell = map.cells.find((cell) => cell.coordinate === saved.coordinate);
        if (cell) setSelectedCell(cell);
      }
    } catch { /* A map remains usable when browser storage is unavailable. */ }
    initialized.current = true;
    let width = viewport.clientWidth;
    let height = viewport.clientHeight;
    const observer = new ResizeObserver(() => {
      if (viewport.clientWidth !== width || viewport.clientHeight !== height) {
        const nextWidth = viewport.clientWidth;
        const nextHeight = viewport.clientHeight;
        setView((current) => ({ ...current, x: current.x + (nextWidth - width) / 2, y: current.y + (nextHeight - height) / 2 }));
        width = nextWidth; height = nextHeight;
      }
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitMap, storageKey, map.cells]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!initialized.current || !viewport) return;
    const save = () => { try { sessionStorage.setItem(storageKey, JSON.stringify({ ...view, coordinate: selectedCell?.coordinate, width: viewport.clientWidth, height: viewport.clientHeight })); } catch { /* Optional preference only. */ } };
    const timer = window.setTimeout(save, 150);
    return () => { window.clearTimeout(timer); save(); };
  }, [storageKey, view, selectedCell]);

  function centerOn(cell: MapCell) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const x = (cell.column - 1) * X_STEP + ((cell.row - 1) % 2) * ROW_OFFSET + TILE_SIZE / 2;
    const y = (cell.row - 1) * Y_STEP + TILE_SIZE / 2;
    setView((current) => { const scale = Math.max(current.scale, .5); return { scale, x: viewport.clientWidth / 2 - x * scale, y: viewport.clientHeight / 2 - y * scale }; });
  }

  function selectCell(cell: MapCell, center = false) {
    setSelectedCell(cell);
    setDetailsOpen(true);
    const hash = `#hex-${cell.coordinate}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    if (center) centerOn(cell);
  }

  useEffect(() => {
    function readHash(fromHistory = false) {
      const match = window.location.hash.match(/^#hex-(\d{4})$/);
      if (!match) { if (fromHistory && !window.location.hash) setSelectedCell(null); return; }
      const cell = map.cells.find((cell) => cell.coordinate === match[1]);
      if (cell) { setSelectedCell(cell); setDetailsOpen(true); centerOn(cell); }
    }
    readHash();
    const onHistory = () => readHash(true);
    window.addEventListener("hashchange", onHistory);
    window.addEventListener("popstate", onHistory);
    return () => { window.removeEventListener("hashchange", onHistory); window.removeEventListener("popstate", onHistory); };
  }, [map.cells]);

  function panBy(x: number, y: number) { setView((current) => ({ ...current, x: current.x + x, y: current.y + y })); }

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
    const target = event.target as HTMLElement;
    if (target.closest("[data-map-control]")) return;

    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const rect = event.currentTarget.getBoundingClientRect();
      pinch.current = { distance: Math.hypot(b.x - a.x, b.y - a.y), scale: view.scale,
        worldX: ((a.x + b.x) / 2 - rect.left - view.x) / view.scale,
        worldY: ((a.y + b.y) / 2 - rect.top - view.y) / view.scale };
      draggedRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const cellButton = target.closest<HTMLButtonElement>("[data-cell-index]");
    event.currentTarget.setPointerCapture(event.pointerId);
    draggedRef.current = false;
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: view.x,
      originY: view.y,
      cellIndex: cellButton ? Number(cellButton.dataset.cellIndex) : null,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const rect = event.currentTarget.getBoundingClientRect();
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinch.current.scale * Math.hypot(b.x - a.x, b.y - a.y) / Math.max(1, pinch.current.distance)));
      setView({ scale, x: (a.x + b.x) / 2 - rect.left - pinch.current.worldX * scale, y: (a.y + b.y) / 2 - rect.top - pinch.current.worldY * scale });
      return;
    }
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
    pointers.current.delete(event.pointerId);
    if (pinch.current) { pinch.current = null; pointerRef.current = null; draggedRef.current = true; }
    const pointer = pointerRef.current;
    if (pointer?.id === event.pointerId) {
      const cellIndex = pointer.cellIndex;
      pointerRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      if (!draggedRef.current && cellIndex !== null) {
        const cell = map.cells.find((cell) => cell.index === cellIndex);
        if (cell && event.type !== "pointercancel") selectCell(cell);
      }
      draggedRef.current = false;
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className={styles.mapPage}>
      <header className={styles.mapHeader}>
        <div>
          <p className={styles.eyebrow}>Player map</p>
          <h1>{map.name}</h1>
        </div>
        <div className={styles.headerActions}>
          <span>{map.knownLocationCount} known locations</span>
          <Link href="/house-rules/#wilderness-travel">Travel rules</Link>
        </div>
      </header>

      <section className={styles.viewerShell} aria-label={`${map.name} hex map`}>
        <div
          ref={viewportRef}
          tabIndex={0}
          role="region"
          aria-label="Interactive map"
          aria-describedby="map-help"
          className={styles.viewport}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
            if (directions[event.key]) {
              event.preventDefault();
              const [dx, dy] = directions[event.key];
              const from = selectedCell ?? map.cells[Math.floor(map.cells.length / 2)];
              const cell = map.cells.find((cell) => cell.column === Math.max(1, Math.min(map.width, from.column + dx)) && cell.row === Math.max(1, Math.min(map.height, from.row + dy)));
              if (cell) selectCell(cell, true);
            } else if (event.key === "+" || event.key === "=") { event.preventDefault(); zoomBy(1.25); }
            else if (event.key === "-") { event.preventDefault(); zoomBy(.8); }
            else if (event.key.toLowerCase() === "f") { event.preventDefault(); fitMap(); }
          }}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className={styles.mapTools}
            aria-label="Map controls"
            data-map-control
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={() => zoomBy(1.25)} aria-label="Zoom in">
              +
            </button>
            <button type="button" onClick={() => zoomBy(0.8)} aria-label="Zoom out">
              −
            </button>
            <button type="button" onClick={fitMap} aria-label="Fit map to screen">
              Fit
            </button>
            <button type="button" onClick={() => panBy(100, 0)} aria-label="Pan map left">←</button>
            <button type="button" onClick={() => panBy(-100, 0)} aria-label="Pan map right">→</button>
            <button type="button" onClick={() => panBy(0, 100)} aria-label="Pan map up">↑</button>
            <button type="button" onClick={() => panBy(0, -100)} aria-label="Pan map down">↓</button>
          </div>
          {tileError && <p className={styles.assetError} role="status">Some map artwork could not load. You can still search locations and read field notes. Reload the page to retry.</p>}

          <div
            className={styles.mapWorld}
            aria-hidden="true"
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
                      onError={() => setTileError(true)}
                      style={{
                        transform: `rotate(${tile.rotation * 60}deg) scaleX(${tile.mirror ? -1 : 1})`,
                      }}
                    />
                  ))}
                  {cell.title ? (
                    <span className={styles.poiLabel} aria-hidden="true">
                      {cell.title}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={`${styles.hexButton} ${isSelected ? styles.selectedHex : ""}`}
                    data-cell-index={cell.index}
                    tabIndex={-1}
                    onClick={(event) => {
                      if (event.detail === 0) selectCell(cell);
                    }}
                    aria-label={`Hex ${cell.coordinate}${cell.title ? `, ${cell.title}` : ""}`}
                  >
                    <span>{cell.coordinate}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <aside className={`${styles.details} ${!detailsOpen ? styles.detailsCollapsed : ""}`}>
          <button className={styles.detailsToggle} type="button" aria-expanded={detailsOpen} aria-controls="map-details" onClick={() => setDetailsOpen(!detailsOpen)}>{detailsOpen ? "Hide details & locations ↓" : "Show details & locations ↑"}</button>
          <div id="map-details" hidden={!detailsOpen}>
          <div aria-live="polite" aria-atomic="true">
          {selectedCell ? (
            <>
              <p className={styles.detailCoordinate}>Hex {selectedCell.coordinate}</p>
              <h2>{selectedCell.title || "Open country"}</h2>
              <p>
                {selectedCell.description || "No discovery has been recorded here yet."}
              </p>
            </>
          ) : (
            <>
              <p className={styles.detailCoordinate}>Field notes</p>
              <h2>Select a hex</h2>
              <p>Tap a hex to read what the party knows about it.</p>
            </>
          )}
          </div>
          {selectedCell && <button className={styles.copyLink} type="button" onClick={async () => {
            try { const url = new URL(window.location.href); url.hash = `hex-${selectedCell.coordinate}`; await navigator.clipboard.writeText(url.href); setLinkStatus("Link copied"); } catch { setLinkStatus(`Share this page with #hex-${selectedCell.coordinate} at the end of its address.`); }
          }}>Copy hex link</button>}
          <p role="status" className={styles.linkStatus}>{linkStatus}</p>
          <details className={styles.locationIndex} open><summary>Find a location or hex</summary>
            <label htmlFor="map-search">Location name or coordinate</label><input id="map-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or hex, e.g. 0101" />
            <p>{query ? `${matches.length} match${matches.length === 1 ? "" : "es"}` : `${knownLocations.length} known locations`}</p>
            <ul>{matches.slice(0, 50).map((cell) => <li key={cell.coordinate}><button type="button" onClick={() => selectCell(cell, true)} aria-pressed={selectedCell?.coordinate === cell.coordinate}><span>{cell.title || "Open country"}</span><span>{cell.coordinate}</span></button></li>)}</ul>
            {matches.length === 0 && <p>No match. Try a four-digit hex coordinate or part of a location name.</p>}
            {matches.length > 50 && <p>Showing 50 results. Enter more of the name or coordinate.</p>}
          </details>
          <p id="map-help" className={styles.help}>Drag to pan; pinch or use + / − to zoom. With the map focused, use arrow keys to explore hexes, + / − to zoom, and F to fit the whole map.</p>
          <div className={styles.legend}>
            <span><i className={styles.legendLocation} /> Named location</span>
            <span><i className={styles.legendKnown} /> Known terrain</span>
          </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
