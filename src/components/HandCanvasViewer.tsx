import React, { useRef, useEffect, useState, useCallback } from 'react';
import { NailData, NailGlobalSettings, HandDetectionResult } from '../types';
import { renderNailSimulation, shiftPolygon, scalePolygon, normalizeNailPoint } from '../utils/nailRenderer';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  Edit3,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Maximize2,
  Crosshair,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface HandCanvasViewerProps {
  imageSrc: string;
  nails: NailData[];
  settings: NailGlobalSettings;
  detectionResult: HandDetectionResult | null;
  isDetecting: boolean;
  activeNailId: string | null;
  onSelectNail: (id: string | null) => void;
  onUpdateNails: (nails: NailData[]) => void;
  splitActive: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const HandCanvasViewer: React.FC<HandCanvasViewerProps> = ({
  imageSrc,
  nails,
  settings,
  detectionResult,
  isDetecting,
  activeNailId,
  onSelectNail,
  onUpdateNails,
  splitActive,
  onCanvasReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Split comparison state (0 to 100)
  const [splitPos, setSplitPos] = useState<number>(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fine-tuning point drag & calibration panel
  const [editContours, setEditContours] = useState<boolean>(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      setImageObj(img);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Main render pass
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !imageObj) return;

    const canvas = canvasRef.current;
    const naturalW = imageObj.naturalWidth || 1200;
    const naturalH = imageObj.naturalHeight || 900;

    if (canvas.width !== naturalW || canvas.height !== naturalH) {
      canvas.width = naturalW;
      canvas.height = naturalH;
    }

    renderNailSimulation({
      canvas,
      image: imageObj,
      nails,
      settings,
      activeNailId,
      showContours: editContours,
      splitPosition: splitActive ? splitPos : 100,
    });

    if (onCanvasReady) {
      onCanvasReady(canvas);
    }
  }, [imageObj, nails, settings, activeNailId, editContours, splitActive, splitPos, onCanvasReady]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Helper to get normalized 0-100 coordinates directly against physical canvas
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const normX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const normY = Math.max(0, Math.min(100, (y / rect.height) * 100));
    return { normX, normY, rect, x, y };
  };

  // Nudge selected nail or all nails
  const handleNudge = (dx: number, dy: number) => {
    if (activeNailId) {
      const updated = nails.map(n => {
        if (n.id === activeNailId) {
          return { ...n, polygon: shiftPolygon(n.polygon, dx, dy) };
        }
        return n;
      });
      onUpdateNails(updated);
    } else {
      const updated = nails.map(n => ({
        ...n,
        polygon: shiftPolygon(n.polygon, dx, dy),
      }));
      onUpdateNails(updated);
    }
  };

  // Scale selected nail or all nails
  const handleScale = (factor: number) => {
    if (activeNailId) {
      const updated = nails.map(n => {
        if (n.id === activeNailId) {
          return { ...n, polygon: scalePolygon(n.polygon, factor) };
        }
        return n;
      });
      onUpdateNails(updated);
    } else {
      const updated = nails.map(n => ({
        ...n,
        polygon: scalePolygon(n.polygon, factor),
      }));
      onUpdateNails(updated);
    }
  };

  // Mouse & Touch events for Split Slider & Contour Editing & Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;
    const { normX, normY, rect, x } = coords;

    // 1. Check if clicked near Before/After split slider
    if (splitActive) {
      const splitPx = (splitPos / 100) * rect.width;
      if (Math.abs(x - splitPx) < 22) {
        setIsDraggingSplit(true);
        return;
      }
    }

    // 2. Check if editing contours and clicked near a vertex
    if (editContours && activeNailId) {
      const activeNail = nails.find(n => n.id === activeNailId);
      if (activeNail) {
        for (let i = 0; i < activeNail.polygon.length; i++) {
          const pt = normalizeNailPoint(activeNail.polygon[i]);
          const dist = Math.hypot(pt.x - normX, pt.y - normY);
          if (dist < 3.2) {
            setDraggedPointIndex(i);
            return;
          }
        }
      }
    }

    // 3. Check if clicked directly on any nail to select it
    let clickedNail: NailData | null = null;
    for (const nail of nails) {
      const pts = nail.polygon.map(normalizeNailPoint);
      let minX = pts[0].x, maxX = pts[0].x, minY = pts[0].y, maxY = pts[0].y;
      pts.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
      if (normX >= minX - 1.2 && normX <= maxX + 1.2 && normY >= minY - 1.2 && normY <= maxY + 1.2) {
        clickedNail = nail;
        break;
      }
    }

    if (clickedNail) {
      onSelectNail(clickedNail.id);
      return;
    }

    // 4. Start Panning if middle click or zoomed or shift
    if (e.button === 0 && (zoom > 1 || e.shiftKey)) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;
    const { normX, normY, rect, x } = coords;

    if (isDraggingSplit && splitActive) {
      const newPos = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSplitPos(newPos);
      return;
    }

    if (draggedPointIndex !== null && activeNailId) {
      const updated = nails.map(n => {
        if (n.id === activeNailId) {
          const newPoly = [...n.polygon];
          newPoly[draggedPointIndex] = {
            x: Math.round(normX * 10) / 10,
            y: Math.round(normY * 10) / 10,
          };
          return { ...n, polygon: newPoly };
        }
        return n;
      });
      onUpdateNails(updated);
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSplit(false);
    setIsPanning(false);
    setDraggedPointIndex(null);
  };

  const activeNailObj = nails.find(n => n.id === activeNailId);

  return (
    <div className="relative flex-1 min-h-[460px] lg:min-h-[580px] bg-stone-920 border border-stone-800 rounded-2xl overflow-hidden flex items-center justify-center p-2 select-none">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#292524_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          cursor: isDraggingSplit
            ? 'ew-resize'
            : isPanning
            ? 'grabbing'
            : editContours
            ? 'crosshair'
            : 'default',
        }}
        className="relative max-w-full max-h-full transition-transform duration-75 flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-[72vh] w-auto h-auto rounded-lg shadow-2xl shadow-black/80 object-contain block"
        />

        {/* Floating Split Labels */}
        {splitActive && (
          <div className="absolute top-4 inset-x-4 flex justify-between pointer-events-none text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-md bg-stone-900/80 backdrop-blur text-rose-300 border border-rose-500/30 shadow">
              طرح و لاک جدید (شبیه‌سازی)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-stone-900/80 backdrop-blur text-stone-300 border border-stone-700 shadow">
              عکس اصلی (قبل)
            </span>
          </div>
        )}
      </div>

      {/* Floating Status Badges & Info (Top Right) */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-none z-10">
        {/* Cover-up Badge */}
        <div className="px-3 py-1 rounded-lg bg-stone-900/85 backdrop-blur border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5 shadow-lg">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>پوشش ۱۰۰٪ طرح قبلی فعال</span>
        </div>

        {/* Skin Tone & Undertone Info */}
        {detectionResult && (
          <div className="px-3 py-1 rounded-lg bg-stone-900/85 backdrop-blur border border-stone-700 text-stone-300 text-xs font-medium flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              پوست: {detectionResult.skinToneFa || 'طبیعی'} ({detectionResult.skinUndertoneFa || 'خنثی'})
            </span>
          </div>
        )}

        {/* Selected Nail Indicator */}
        {activeNailId && (
          <div className="px-3 py-1 rounded-lg bg-rose-950/90 backdrop-blur border border-rose-500/60 text-rose-200 text-xs font-medium flex items-center gap-1.5 shadow-lg">
            <Eye className="w-3.5 h-3.5 text-rose-400" />
            <span>ناخن در حال تنظیم: {activeNailObj?.fingerNameFa || activeNailId}</span>
          </div>
        )}
      </div>

      {/* Precision Calibration Floating Toolbar (When Edit Contours is ON) */}
      {editContours && (
        <div className="absolute top-3 left-3 bg-stone-900/95 backdrop-blur-md border border-rose-500/40 rounded-2xl p-3 shadow-2xl z-20 w-64 text-right space-y-2.5">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
              <Crosshair className="w-4 h-4" />
              <span>تنظیم دقیق و کالیبراسیون کادر</span>
            </div>
            <button
              type="button"
              onClick={() => setEditContours(false)}
              className="text-stone-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick finger selector buttons */}
          <div>
            <span className="text-[11px] text-stone-400 block mb-1.5">انتخاب ناخن برای تنظیم:</span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => onSelectNail(null)}
                className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold transition ${
                  activeNailId === null
                    ? 'bg-rose-600 text-white'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
                }`}
              >
                همه ناخن‌ها
              </button>
              {nails.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onSelectNail(n.id)}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold transition truncate ${
                    activeNailId === n.id
                      ? 'bg-rose-600 text-white'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
                  }`}
                >
                  {n.fingerNameFa}
                </button>
              ))}
            </div>
          </div>

          {/* Position Nudge D-Pad */}
          <div>
            <span className="text-[11px] text-stone-400 block mb-1">جابجایی کادر (جهت‌ها):</span>
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => handleNudge(-0.5, 0)}
                className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
                title="جابجایی به چپ"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleNudge(0, -0.5)}
                  className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
                  title="جابجایی به بالا"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudge(0, 0.5)}
                  className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
                  title="جابجایی به پایین"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleNudge(0.5, 0)}
                className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
                title="جابجایی به راست"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scale / Cuticle expansion */}
          <div>
            <span className="text-[11px] text-stone-400 block mb-1">اندازه و پوشش لبه‌ها:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleScale(0.97)}
                className="py-1.5 px-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition"
                title="کوچک‌تر کردن کادر"
              >
                <Minus className="w-3.5 h-3.5 text-rose-400" />
                <span>جمع‌تر کردن</span>
              </button>
              <button
                type="button"
                onClick={() => handleScale(1.03)}
                className="py-1.5 px-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition"
                title="بزرگ‌تر کردن کادر (پوشش کامل‌تر کوتیکول)"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>گسترش لبه</span>
              </button>
            </div>
          </div>

          <p className="text-[10px] text-stone-400 leading-tight">
            💡 همچنین می‌توانید نقاط قرمز روی هر ناخن را با ماوس یا لمس جابجا کنید.
          </p>
        </div>
      )}

      {/* Zoom & Action Toolbar (Bottom Center) */}
      <div className="absolute bottom-3 inset-x-0 mx-auto w-fit flex items-center gap-1 bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-xl px-2 py-1 shadow-2xl z-20">
        <button
          type="button"
          onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
          className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition"
          title="بزرگ‌نمایی"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-stone-400 px-1 min-w-[36px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom(z => Math.max(z - 0.25, 0.75))}
          className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition"
          title="کوچک‌نمایی"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition"
          title="تنظیم مجدد بزرگ‌نمایی"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-stone-700 mx-1" />

        {/* Toggle Contour Point Editing & Calibration */}
        <button
          type="button"
          onClick={() => setEditContours(v => !v)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            editContours
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50 ring-2 ring-rose-400/50'
              : 'text-stone-300 hover:bg-stone-800'
          }`}
          title="تنظیم دقیق و کالیبراسیون جایگاه ناخن"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>تنظیم دقیق جایگاه کادر</span>
        </button>
      </div>

      {/* Detection / Generating Loading Spinner Overlay */}
      {isDetecting && (
        <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 p-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
            <Sparkles className="w-5 h-5 text-rose-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-stone-100">
              هوش مصنوعی در حال شناسایی ناخن‌ها و آنالیز کادر دست...
            </p>
            <p className="text-xs text-stone-400 mt-1">
              تشخیص دقیق کانتور صدف ناخن، زاویه انحنا و رنگ پایه پوست
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
