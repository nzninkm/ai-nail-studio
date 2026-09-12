import { NailData, NailFinish, NailDesign, NailGlobalSettings } from '../types';

interface RenderOptions {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  nails: NailData[];
  settings: NailGlobalSettings;
  activeNailId?: string | null;
  showContours?: boolean;
  splitPosition?: number; // 0 to 100 for Before/After split slider
}

/**
 * Normalizes any coordinate value to 0.0 - 100.0 percentage range
 */
export function normalizeNailPoint(p: { x: number; y: number }): { x: number; y: number } {
  let x = typeof p.x === 'number' ? p.x : 0;
  let y = typeof p.y === 'number' ? p.y : 0;

  if (x > 100) x = x / 10;
  else if (x <= 1.0 && x > 0) x = x * 100;

  if (y > 100) y = y / 10;
  else if (y <= 1.0 && y > 0) y = y * 100;

  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
}

/**
 * Shifts polygon points by delta X and delta Y percentages
 */
export function shiftPolygon(points: { x: number; y: number }[], dx: number, dy: number): { x: number; y: number }[] {
  return points.map(p => {
    const np = normalizeNailPoint(p);
    return {
      x: Math.round(Math.max(0, Math.min(100, np.x + dx)) * 100) / 100,
      y: Math.round(Math.max(0, Math.min(100, np.y + dy)) * 100) / 100,
    };
  });
}

/**
 * Scales polygon contour from its centroid
 */
export function scalePolygon(points: { x: number; y: number }[], factor: number): { x: number; y: number }[] {
  if (points.length === 0) return points;
  const npts = points.map(normalizeNailPoint);
  let cx = 0, cy = 0;
  npts.forEach(p => { cx += p.x; cy += p.y; });
  cx /= npts.length;
  cy /= npts.length;

  return npts.map(p => ({
    x: Math.round(Math.max(0, Math.min(100, cx + (p.x - cx) * factor)) * 100) / 100,
    y: Math.round(Math.max(0, Math.min(100, cy + (p.y - cy) * factor)) * 100) / 100,
  }));
}

/**
 * Orders points cyclically around their centroid so the contour never self-intersects
 */
export function sortPolygonPoints(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length <= 3) return points;
  const npts = points.map(normalizeNailPoint);
  let cx = 0, cy = 0;
  npts.forEach(p => { cx += p.x; cy += p.y; });
  cx /= npts.length;
  cy /= npts.length;

  return [...npts].sort((a, b) => {
    const angleA = Math.atan2(a.y - cy, a.x - cx);
    const angleB = Math.atan2(b.y - cy, b.x - cx);
    return angleA - angleB;
  });
}

/**
 * Transforms or morphs the nail contour to match the chosen nail shape (فرم ناخن)
 * and length, while keeping the cuticle base rooted securely to the finger.
 * Strictly operates in-place to preserve sequential loop order and prevent bulging.
 */
export function getSculptedNailPoints(nail: NailData, settings: NailGlobalSettings): { x: number; y: number }[] {
  if (!nail.polygon || nail.polygon.length < 3) return nail.polygon || [];

  const rawPoints = nail.polygon.map(normalizeNailPoint);
  const targetShape = nail.customShape || settings.shape || 'natural';
  const lengthBonus = (settings.nailLength || 0) / 100; // 0.0 to 1.0
  const cuticleExpansion = (settings.cuticleFit || 0) / 100; // -0.1 to +0.1
  const snugInset = ((settings.snugFit ?? 2) || 0) / 100; // 0 to 0.10 micro-inset to stay strictly on nail plate

  let cx = 0, cy = 0;
  rawPoints.forEach(p => { cx += p.x; cy += p.y; });
  cx /= rawPoints.length;
  cy /= rawPoints.length;

  const angleRad = (nail.tiltAngle * Math.PI) / 180;
  const tipX = -Math.sin(angleRad);
  const tipY = -Math.cos(angleRad);
  const sideX = Math.cos(angleRad);
  const sideY = -Math.sin(angleRad);

  // Convert to local coordinates along the nail orientation
  const local = rawPoints.map(p => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    return {
      u: dx * sideX + dy * sideY,
      v: dx * tipX + dy * tipY,
    };
  });

  let minV = Infinity, maxV = -Infinity, maxU = 0.5;
  local.forEach(lp => {
    minV = Math.min(minV, lp.v);
    maxV = Math.max(maxV, lp.v);
    maxU = Math.max(maxU, Math.abs(lp.u));
  });
  const nailHeight = Math.max(1, maxV - minV);
  const halfWidth = Math.max(0.5, maxU);

  // Process points in-place preserving exact loop order:
  return local.map(lp => {
    let u = lp.u;
    let v = lp.v;

    // Snug fit: slightly contract inward so the mask stays strictly inside the nail bed and lateral grooves
    if (snugInset > 0) {
      u *= (1 - snugInset * 0.7);
      v *= (1 - snugInset * 0.5);
    }

    // Cuticle micro-adjustment at proximal root (v < 0)
    if (v < 0 && cuticleExpansion !== 0) {
      u *= (1 + cuticleExpansion);
      v *= (1 + cuticleExpansion);
    }

    // Free edge length and shape sculpting: strictly on distal tip (v > 0)
    if (v > 0) {
      const vRatio = Math.max(0, Math.min(1, v / Math.max(0.1, maxV)));
      
      // Extension bonus:
      if (lengthBonus > 0) {
        v += vRatio * nailHeight * lengthBonus * 0.45;
      }

      // Salon shapes adjustment on the free edge tip
      if (targetShape !== 'natural') {
        const uRatio = Math.abs(u) / Math.max(0.1, halfWidth);
        
        switch (targetShape) {
          case 'square':
            // Flatten the tip perpendicular to finger axis
            if (vRatio > 0.6) {
              v = Math.min(v, maxV * 0.95 + (lengthBonus > 0 ? nailHeight * lengthBonus * 0.45 : 0));
            }
            break;

          case 'squoval':
            // Square with softly softened outer corners
            if (vRatio > 0.65 && uRatio > 0.7) {
              u *= 0.92;
            }
            break;

          case 'almond':
            // Elegant taper towards free edge tip
            if (vRatio > 0.25) {
              const taper = 1.0 - Math.pow(vRatio, 1.3) * 0.38;
              u *= taper;
            }
            break;

          case 'coffin':
            // Tapered sidewalls with clean flat tip
            if (vRatio > 0.25) {
              const taper = 1.0 - vRatio * 0.35;
              u *= taper;
            }
            break;

          case 'stiletto':
            // Sharp dramatic taper towards tip
            if (vRatio > 0.2) {
              const taper = 1.0 - Math.pow(vRatio, 1.1) * 0.65;
              u *= taper;
            }
            break;

          case 'oval':
            // Smooth elliptical curvature
            if (vRatio > 0.35) {
              const ellipseU = Math.sqrt(Math.max(0, 1 - Math.pow(vRatio, 2)));
              u = (u >= 0 ? 1 : -1) * halfWidth * (0.4 + 0.6 * ellipseU);
            }
            break;

          case 'round':
            // Gentle rounded contour
            if (vRatio > 0.4) {
              u *= (1.0 - Math.pow(vRatio, 2) * 0.25);
            }
            break;
        }
      }
    }

    // Convert back to image percentage coordinates
    const newX = cx + u * sideX + v * tipX;
    const newY = cy + u * sideY + v * tipY;

    return {
      x: Math.round(Math.max(0, Math.min(100, newX)) * 100) / 100,
      y: Math.round(Math.max(0, Math.min(100, newY)) * 100) / 100,
    };
  });
}

/**
 * Creates smooth polygon path through nail points using midpoint quadratic Bezier.
 * Guarantees zero outward bulging or ballooning, hugging the nail plate tightly.
 */
export function createSmoothNailPath(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[], width: number, height: number) {
  if (!points || points.length < 3) return;

  const pts = points.map(p => {
    const np = normalizeNailPoint(p);
    return { x: (np.x / 100) * width, y: (np.y / 100) * height };
  });

  const n = pts.length;
  ctx.beginPath();

  // Midpoint quadratic interpolation connects edge midpoints using the vertices as control points.
  // By mathematical definition, the curve is strictly contained within the convex hull of the points,
  // preventing ANY overshooting, ballooning, or spilling over onto skin!
  const startMidX = (pts[n - 1].x + pts[0].x) / 2;
  const startMidY = (pts[n - 1].y + pts[0].y) / 2;
  ctx.moveTo(startMidX, startMidY);

  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
  }

  ctx.closePath();
}

/**
 * Converts hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Renders high-end photorealistic nail simulation with realistic shine, 3D shading, and complete cover-up
 */
export function renderNailSimulation({
  canvas,
  image,
  nails,
  settings,
  activeNailId,
  showContours = false,
  splitPosition = 100,
}: RenderOptions) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // 1. Clear & Draw base hand image
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(image, 0, 0, w, h);

  // If Before/After split is active, we clip the nail rendering to the left of the split line
  const splitPx = (splitPosition / 100) * w;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, splitPx, h);
  ctx.clip();

  // 2. Render each nail
  nails.forEach(nail => {
    renderSingleNail(ctx, nail, settings, w, h);
  });

  ctx.restore();

  // 3. Draw Before/After Split Line if active (< 100)
  if (splitPosition < 99.5 && splitPosition > 0.5) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(splitPx, 0);
    ctx.lineTo(splitPx, h);
    ctx.stroke();

    // Split Handle Knob
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(splitPx, h / 2, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    // left arrow
    ctx.moveTo(splitPx - 6, h / 2);
    ctx.lineTo(splitPx - 2, h / 2 - 4);
    ctx.lineTo(splitPx - 2, h / 2 + 4);
    ctx.fill();
    // right arrow
    ctx.beginPath();
    ctx.moveTo(splitPx + 6, h / 2);
    ctx.lineTo(splitPx + 2, h / 2 - 4);
    ctx.lineTo(splitPx + 2, h / 2 + 4);
    ctx.fill();

    ctx.restore();
  }

  // 4. Draw interactive contours / points if requested or active nail
  if (showContours || activeNailId) {
    nails.forEach(nail => {
      const isActive = nail.id === activeNailId;
      if (!showContours && !isActive) return;

      const sculpted = getSculptedNailPoints(nail, settings);

      ctx.save();
      createSmoothNailPath(ctx, sculpted, w, h);
      ctx.strokeStyle = isActive ? '#f43f5e' : 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.setLineDash(isActive ? [4, 4] : [2, 2]);
      ctx.stroke();

      // Draw interactive vertices
      if (isActive) {
        nail.polygon.forEach((pt, idx) => {
          const px = (pt.x / 100) * w;
          const py = (pt.y / 100) * h;

          ctx.fillStyle = idx === 0 ? '#10b981' : '#ffffff';
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }
      ctx.restore();
    });
  }
}

function renderSingleNail(
  ctx: CanvasRenderingContext2D,
  nail: NailData,
  settings: NailGlobalSettings,
  w: number,
  h: number
) {
  if (!nail.polygon || nail.polygon.length < 3) return;

  // Determine nail color, finish and design (with accent finger support)
  const isAccent = settings.accentFinger === nail.id;
  const color = isAccent ? settings.accentColor : (nail.customColor || settings.color);
  const secondaryColor = nail.customSecondaryColor || settings.secondaryColor;
  const finish: NailFinish = isAccent ? (nail.customFinish || settings.finish) : (nail.customFinish || settings.finish);
  const design: NailDesign = isAccent ? settings.accentDesign : (nail.customDesign || settings.design);

  const rgb = hexToRgb(color);
  const secRgb = hexToRgb(secondaryColor);

  // Compute precision sculpted nail contour points
  const sculptedPoints = getSculptedNailPoints(nail, settings);

  // Compute nail bounds and center in canvas pixels based on sculpted mask
  const pts = sculptedPoints.map(p => {
    const np = normalizeNailPoint(p);
    return { x: (np.x / 100) * w, y: (np.y / 100) * h };
  });
  let minX = pts[0].x, maxX = pts[0].x, minY = pts[0].y, maxY = pts[0].y;
  let sumX = 0, sumY = 0;
  pts.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    sumX += p.x;
    sumY += p.y;
  });
  const centerX = sumX / pts.length;
  const centerY = sumY / pts.length;
  const nailWidth = Math.max(10, maxX - minX);
  const nailHeight = Math.max(10, maxY - minY);

  ctx.save();

  // Create clipping region along smooth nail contour
  createSmoothNailPath(ctx, sculptedPoints, w, h);
  ctx.clip();

  // -------------------------------------------------------------
  // LAYER 1: BASE COAT COVER-UP (پوشش کامل طرح قبلی)
  // Completely covers any previous chipped or dark polish
  // -------------------------------------------------------------
  const coverOpacity = (settings.coverOldOpacity || 98) / 100;
  ctx.save();
  // Neutral primer undercoat to neutralize any old bright red or dark polish
  ctx.fillStyle = `rgba(235, 220, 215, ${coverOpacity * 0.95})`;
  ctx.fill();

  // -------------------------------------------------------------
  // LAYER 2: POLISH BASE COLOR & DESIGN
  // -------------------------------------------------------------
  ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  ctx.fill();

  // Render specific nail design patterns
  renderDesignLayer(ctx, design, rgb, secRgb, centerX, centerY, nailWidth, nailHeight, nail.tiltAngle, settings);

  ctx.restore(); // end Layer 1 & 2

  // -------------------------------------------------------------
  // LAYER 3: 3D CURVATURE SHADING (سایه سه‌بعدی انحنای ناخن)
  // Transverse arch: nails curve around cylinder, darker at edges
  // -------------------------------------------------------------
  const curvatureDepth = (settings.curvatureDepth || 65) / 100;
  if (curvatureDepth > 0.05) {
    ctx.save();
    // Rotate gradient to match nail tilt angle
    const angleRad = (nail.tiltAngle * Math.PI) / 180;
    const perpAngle = angleRad + Math.PI / 2;
    const halfW = nailWidth * 0.55;
    const x0 = centerX - Math.cos(perpAngle) * halfW;
    const y0 = centerY - Math.sin(perpAngle) * halfW;
    const x1 = centerX + Math.cos(perpAngle) * halfW;
    const y1 = centerY + Math.sin(perpAngle) * halfW;

    const curveGrad = ctx.createLinearGradient(x0, y0, x1, y1);
    // Dark edges, bright apex in center
    const shadowAlpha = curvatureDepth * 0.55;
    curveGrad.addColorStop(0.0, `rgba(15, 10, 10, ${shadowAlpha * 1.1})`);
    curveGrad.addColorStop(0.2, `rgba(25, 15, 15, ${shadowAlpha * 0.3})`);
    curveGrad.addColorStop(0.48, `rgba(255, 255, 255, 0.0)`);
    curveGrad.addColorStop(0.52, `rgba(255, 255, 255, 0.0)`);
    curveGrad.addColorStop(0.8, `rgba(25, 15, 15, ${shadowAlpha * 0.3})`);
    curveGrad.addColorStop(1.0, `rgba(15, 10, 10, ${shadowAlpha * 1.1})`);

    ctx.fillStyle = curveGrad;
    ctx.fill();
    ctx.restore();
  }

  // -------------------------------------------------------------
  // LAYER 4: CUTICLE SHADOW (سایه خط رویش ناخن و کوتیکول)
  // Soft ambient occlusion at the root of the nail
  // -------------------------------------------------------------
  const cuticleShadow = (settings.cuticleShadow || 70) / 100;
  if (cuticleShadow > 0.05) {
    ctx.save();
    const angleRad = (nail.tiltAngle * Math.PI) / 180;
    // Cuticle is typically at bottom or root depending on orientation
    // We create a root shadow gradient from root into the nail plate
    const rootX = centerX + Math.sin(angleRad) * (nailHeight * 0.5);
    const rootY = centerY + Math.cos(angleRad) * (nailHeight * 0.5);
    const midX = centerX;
    const midY = centerY;

    const rootGrad = ctx.createLinearGradient(rootX, rootY, midX, midY);
    rootGrad.addColorStop(0.0, `rgba(30, 15, 12, ${cuticleShadow * 0.6})`);
    rootGrad.addColorStop(0.4, `rgba(40, 20, 15, ${cuticleShadow * 0.2})`);
    rootGrad.addColorStop(1.0, `rgba(0, 0, 0, 0.0)`);

    ctx.fillStyle = rootGrad;
    ctx.fill();
    ctx.restore();
  }

  // -------------------------------------------------------------
  // LAYER 5: FINISH OPTICAL REFLECTION & SHINE (برق سالنی و انعکاس نور)
  // -------------------------------------------------------------
  renderFinishHighlights(ctx, finish, rgb, centerX, centerY, nailWidth, nailHeight, nail.tiltAngle, settings);

  ctx.restore(); // Restore main nail clipping
}

/**
 * Renders nail art patterns inside the nail
 */
function renderDesignLayer(
  ctx: CanvasRenderingContext2D,
  design: NailDesign,
  baseRgb: { r: number; g: number; b: number },
  secRgb: { r: number; g: number; b: number },
  cx: number,
  cy: number,
  w: number,
  h: number,
  tiltAngle: number,
  settings: NailGlobalSettings
) {
  if (design === 'solid') return;

  const angleRad = (tiltAngle * Math.PI) / 180;

  if (design === 'french' || design === 'micro_french') {
    // Elegant French Manicure tip
    const isMicro = design === 'micro_french';
    const tipRatio = isMicro ? 0.09 : (settings.frenchTipWidth || 24) / 100;

    // Distal tip point
    const tipX = cx - Math.sin(angleRad) * (h * (0.5 - tipRatio));
    const tipY = cy - Math.cos(angleRad) * (h * (0.5 - tipRatio));

    ctx.save();
    ctx.fillStyle = `rgb(${secRgb.r}, ${secRgb.g}, ${secRgb.b})`;

    // Draw curved smile line
    const perpX = Math.cos(angleRad);
    const perpY = -Math.sin(angleRad);
    const halfTipW = w * 0.75;

    ctx.beginPath();
    ctx.moveTo(tipX - perpX * halfTipW, tipY - perpY * halfTipW);
    // Control point dips down in center for natural French smile curve
    const smileDip = isMicro ? h * 0.04 : h * 0.09;
    const ctrlX = tipX + Math.sin(angleRad) * smileDip;
    const ctrlY = tipY + Math.cos(angleRad) * smileDip;
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX + perpX * halfTipW, tipY + perpY * halfTipW);

    // Close shape over the free edge
    const freeEdgeX = cx - Math.sin(angleRad) * (h * 0.7);
    const freeEdgeY = cy - Math.cos(angleRad) * (h * 0.7);
    ctx.lineTo(freeEdgeX + perpX * halfTipW, freeEdgeY + perpY * halfTipW);
    ctx.lineTo(freeEdgeX - perpX * halfTipW, freeEdgeY - perpY * halfTipW);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (design === 'ombre') {
    // Smooth baby boomer / ombre gradient along nail length
    ctx.save();
    const startX = cx + Math.sin(angleRad) * (h * 0.45);
    const startY = cy + Math.cos(angleRad) * (h * 0.45);
    const endX = cx - Math.sin(angleRad) * (h * 0.5);
    const endY = cy - Math.cos(angleRad) * (h * 0.5);

    const grad = ctx.createLinearGradient(startX, startY, endX, endY);
    grad.addColorStop(0.0, `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, 0.0)`);
    grad.addColorStop(0.35, `rgba(${secRgb.r}, ${secRgb.g}, ${secRgb.b}, 0.25)`);
    grad.addColorStop(0.7, `rgba(${secRgb.r}, ${secRgb.g}, ${secRgb.b}, 0.85)`);
    grad.addColorStop(1.0, `rgba(${secRgb.r}, ${secRgb.g}, ${secRgb.b}, 1.0)`);

    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  } else if (design === 'glazed_donut') {
    // Hailey Bieber glazed donut pearl sheen
    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy, w * 0.1, cx, cy, Math.max(w, h));
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(0.4, 'rgba(255, 235, 245, 0.25)');
    grad.addColorStop(0.8, 'rgba(230, 245, 255, 0.15)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  } else if (design === 'marble') {
    // Delicate natural quartz marble veins
    ctx.save();
    ctx.strokeStyle = `rgba(${secRgb.r}, ${secRgb.g}, ${secRgb.b}, 0.55)`;
    ctx.lineWidth = Math.max(1.5, w * 0.035);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Vein 1
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.35, cy + h * 0.3);
    ctx.bezierCurveTo(cx - w * 0.1, cy + h * 0.1, cx + w * 0.05, cy - h * 0.1, cx + w * 0.25, cy - h * 0.35);
    ctx.stroke();

    // Secondary delicate fork
    ctx.lineWidth = Math.max(1, w * 0.02);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.05, cy + h * 0.05);
    ctx.quadraticCurveTo(cx + w * 0.2, cy + h * 0.1, cx + w * 0.35, cy - h * 0.05);
    ctx.stroke();

    // Subtle gold shimmer speckle in veins
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
    ctx.lineWidth = Math.max(1, w * 0.015);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.3, cy + h * 0.28);
    ctx.lineTo(cx - w * 0.1, cy + h * 0.12);
    ctx.lineTo(cx + w * 0.1, cy - h * 0.08);
    ctx.stroke();
    ctx.restore();
  } else if (design === 'minimal_gold') {
    // Minimalist luxury gold leaf / foil geometric line
    ctx.save();
    ctx.strokeStyle = '#e6b800';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    ctx.shadowBlur = 4;
    ctx.lineWidth = Math.max(1.8, w * 0.04);
    ctx.beginPath();
    // Vertical off-center gold pinstripe
    const offX = cx + w * 0.12;
    ctx.moveTo(offX, cy - h * 0.45);
    ctx.lineTo(offX, cy + h * 0.45);
    ctx.stroke();

    // Small metallic dot accent
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(offX, cy + h * 0.25, Math.max(2.5, w * 0.05), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (design === 'cat_eye') {
    // Velvet magnetic cat-eye slash
    ctx.save();
    const catGrad = ctx.createLinearGradient(
      cx - w * 0.45,
      cy - h * 0.35,
      cx + w * 0.45,
      cy + h * 0.35
    );
    catGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
    catGrad.addColorStop(0.38, 'rgba(255, 255, 255, 0.1)');
    catGrad.addColorStop(0.5, `rgba(${secRgb.r}, ${secRgb.g}, ${secRgb.b}, 0.85)`);
    catGrad.addColorStop(0.62, 'rgba(255, 255, 255, 0.1)');
    catGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = catGrad;
    ctx.fill();
    ctx.restore();
  } else if (design === 'polka_dot') {
    // Polka dot pattern
    ctx.save();
    ctx.fillStyle = `rgb(${secRgb.r}, ${secRgb.g}, ${secRgb.b})`;
    const dotR = Math.max(1.5, w * 0.04);
    const spacingX = w * 0.28;
    const spacingY = h * 0.22;
    for (let dx = -w * 0.35; dx <= w * 0.35; dx += spacingX) {
      for (let dy = -h * 0.35; dy <= h * 0.35; dy += spacingY) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

/**
 * Renders realistic specular highlights, salon gel shine, and finish textures
 */
function renderFinishHighlights(
  ctx: CanvasRenderingContext2D,
  finish: NailFinish,
  rgb: { r: number; g: number; b: number },
  cx: number,
  cy: number,
  w: number,
  h: number,
  tiltAngle: number,
  settings: NailGlobalSettings
) {
  const glossIntensity = (settings.glossIntensity || 85) / 100;
  const sharpness = (settings.highlightSharpness || 75) / 100;
  const angleRad = (tiltAngle * Math.PI) / 180;

  if (finish === 'matte') {
    // Matte finish has very low diffuse sheen, no sharp glint
    ctx.save();
    const matteGrad = ctx.createRadialGradient(cx, cy, w * 0.1, cx, cy, Math.max(w, h) * 0.6);
    matteGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.08)');
    matteGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = matteGrad;
    ctx.fill();
    ctx.restore();
    return;
  }

  // Curved salon gel light reflection (longitudinal reflection strip)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angleRad);

  // Offset highlight based on light direction
  let lightOffsetX = -w * 0.14;
  let lightOffsetY = -h * 0.05;
  if (settings.lightDirection === 'top-right') {
    lightOffsetX = w * 0.14;
  } else if (settings.lightDirection === 'front') {
    lightOffsetX = 0;
  }

  if (finish === 'glossy' || finish === 'jelly') {
    // Primary glossy strip
    const highlightW = Math.max(3, w * (0.12 + (1 - sharpness) * 0.1));
    const highlightH = h * 0.68;
    const highlightX = lightOffsetX;
    const highlightY = lightOffsetY;

    // Curved specular highlight
    ctx.save();
    const glintGrad = ctx.createLinearGradient(
      highlightX - highlightW,
      highlightY - highlightH * 0.5,
      highlightX + highlightW,
      highlightY + highlightH * 0.5
    );

    const alphaCore = glossIntensity * 0.85;
    glintGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
    glintGrad.addColorStop(0.2, `rgba(255, 255, 255, ${alphaCore * 0.6})`);
    glintGrad.addColorStop(0.5, `rgba(255, 255, 255, ${alphaCore})`);
    glintGrad.addColorStop(0.8, `rgba(255, 255, 255, ${alphaCore * 0.6})`);
    glintGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = glintGrad;

    // Elliptical curved reflection
    ctx.beginPath();
    ctx.ellipse(
      highlightX,
      highlightY,
      highlightW,
      highlightH * 0.42,
      -0.08,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Pin-point glint near cuticle apex
    const pinpointAlpha = glossIntensity * 0.9;
    const glintPoint = ctx.createRadialGradient(
      highlightX,
      highlightY - highlightH * 0.28,
      1,
      highlightX,
      highlightY - highlightH * 0.28,
      w * 0.18
    );
    glintPoint.addColorStop(0.0, `rgba(255, 255, 255, ${pinpointAlpha})`);
    glintPoint.addColorStop(0.4, `rgba(255, 255, 255, ${pinpointAlpha * 0.4})`);
    glintPoint.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = glintPoint;
    ctx.beginPath();
    ctx.arc(highlightX, highlightY - highlightH * 0.28, w * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  } else if (finish === 'metallic') {
    // Liquid mirror Chrome reflection with high contrast metallic sheen
    ctx.save();
    const chromeGrad = ctx.createLinearGradient(-w * 0.4, -h * 0.4, w * 0.4, h * 0.4);
    chromeGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.15)');
    chromeGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.65)');
    chromeGrad.addColorStop(0.45, 'rgba(20, 15, 15, 0.25)');
    chromeGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.85)');
    chromeGrad.addColorStop(0.85, 'rgba(255, 240, 220, 0.4)');
    chromeGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.1)');
    ctx.fillStyle = chromeGrad;
    ctx.fill();
    ctx.restore();
  } else if (finish === 'pearl') {
    // Pearlescent silk sheen with rainbow tint
    ctx.save();
    const pearlGrad = ctx.createLinearGradient(-w * 0.35, 0, w * 0.35, 0);
    pearlGrad.addColorStop(0.0, 'rgba(255, 220, 240, 0.1)');
    pearlGrad.addColorStop(0.3, 'rgba(230, 255, 250, 0.4)');
    pearlGrad.addColorStop(0.6, 'rgba(255, 250, 220, 0.5)');
    pearlGrad.addColorStop(1.0, 'rgba(240, 230, 255, 0.1)');
    ctx.fillStyle = pearlGrad;
    ctx.fill();
    ctx.restore();
  } else if (finish === 'shimmer') {
    // Shimmer / Glitter sparkles
    ctx.save();
    const density = (settings.shimmerDensity || 70) / 100;
    const count = Math.floor(density * 45);

    // Subtle base glint
    const baseGlint = ctx.createLinearGradient(lightOffsetX, -h * 0.3, lightOffsetX, h * 0.3);
    baseGlint.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
    baseGlint.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
    baseGlint.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = baseGlint;
    ctx.fillRect(lightOffsetX - w * 0.1, -h * 0.4, w * 0.2, h * 0.8);

    // Micro sparkles
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random based on index
      const seed = Math.sin(i * 997.1) * 10000;
      const rx = ((seed - Math.floor(seed)) - 0.5) * (w * 0.7);
      const seedY = Math.cos(i * 643.7) * 10000;
      const ry = ((seedY - Math.floor(seedY)) - 0.5) * (h * 0.8);
      const r = Math.max(0.7, (Math.sin(i * 3.3) * 0.5 + 0.5) * (w * 0.04));
      const sparkleAlpha = (Math.sin(i * 7.7) * 0.4 + 0.6) * glossIntensity;

      ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();

      // Top star cross for larger sparkles
      if (i % 7 === 0) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${sparkleAlpha * 0.85})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(rx - r * 2.5, ry);
        ctx.lineTo(rx + r * 2.5, ry);
        ctx.moveTo(rx, ry - r * 2.5);
        ctx.lineTo(rx, ry + r * 2.5);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  ctx.restore();
}
