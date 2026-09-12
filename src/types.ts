export interface NailPoint {
  x: number; // 0 - 100 percentage
  y: number; // 0 - 100 percentage
}

export type NailFinish = 'glossy' | 'matte' | 'metallic' | 'shimmer' | 'jelly' | 'pearl';

export type NailDesign =
  | 'solid'
  | 'french'
  | 'micro_french'
  | 'ombre'
  | 'marble'
  | 'glazed_donut'
  | 'minimal_gold'
  | 'cat_eye'
  | 'polka_dot';

export type NailShape = 'almond' | 'oval' | 'square' | 'squoval' | 'coffin' | 'stiletto' | 'round';

export interface NailData {
  id: string; // 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'
  fingerName: string;
  fingerNameFa: string;
  polygon: NailPoint[];
  boundingBox: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
  nailShape: NailShape;
  tiltAngle: number;
  // Overrides per nail if custom mode is enabled
  customShape?: NailShape | 'natural';
  customColor?: string;
  customDesign?: NailDesign;
  customSecondaryColor?: string;
  customFinish?: NailFinish;
}

export interface NailGlobalSettings {
  color: string;
  secondaryColor: string;
  finish: NailFinish;
  design: NailDesign;
  shape: NailShape | 'natural';
  nailLength: number; // 0 (natural) to 100 (long salon extension)
  cuticleFit: number; // -10 (tighter inside cuticle) to +10 (expanded over edges)
  snugFit: number; // 0 - 10 (micro-inset to ensure polish stays strictly inside nail plate without spilling on skin)
  accentFinger: 'ring' | 'index' | 'thumb' | 'none';
  accentColor: string;
  accentDesign: NailDesign;
  // Optical physics simulation controls
  glossIntensity: number; // 0 - 100
  curvatureDepth: number; // 0 - 100 (3D cylindrical depth)
  cuticleShadow: number; // 0 - 100 (soft ambient occlusion at root)
  coverOldOpacity: number; // 85 - 100% (ensures complete coverage of old polish)
  shimmerDensity: number; // 0 - 100
  frenchTipWidth: number; // 10 - 45%
  lightDirection: 'top' | 'top-left' | 'top-right' | 'front';
  highlightSharpness: number; // 10 - 100 (diffuse vs mirror-like salon gel)
}

export interface HandDetectionResult {
  handType: 'left' | 'right' | 'unknown';
  skinTone: string;
  skinToneFa: string;
  skinUndertone: 'cool' | 'warm' | 'neutral';
  skinUndertoneFa: string;
  recommendedShades: {
    hex: string;
    name: string;
    nameFa: string;
    descriptionFa: string;
  }[];
  nails: NailData[];
  lightSourceDirection: 'top-left' | 'top-right' | 'top' | 'front';
  existingPolishDetected: boolean;
  existingPolishDescription?: string;
  confidence: number;
}

export interface SampleHand {
  id: string;
  name: string;
  nameFa: string;
  descriptionFa: string;
  imageUrl: string;
  defaultNails: NailData[];
  skinUndertone: 'cool' | 'warm' | 'neutral';
  skinUndertoneFa: string;
  hasOldPolish: boolean;
}
