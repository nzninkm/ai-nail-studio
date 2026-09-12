import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  Layers, 
  Sun, 
  Wand2, 
  Check, 
  ChevronRight, 
  Sliders, 
  ShieldCheck,
  RotateCcw,
  Hand,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Crosshair,
  Shapes,
  Maximize2
} from 'lucide-react';
import { 
  NailGlobalSettings, 
  NailData, 
  HandDetectionResult, 
  NailFinish, 
  NailDesign 
} from '../types';
import { 
  POLISH_PALETTES, 
  FINISH_OPTIONS, 
  DESIGN_OPTIONS,
  SHAPE_OPTIONS
} from '../data/palettes';
import { shiftPolygon, scalePolygon } from '../utils/nailRenderer';

interface ControlPanelProps {
  settings: NailGlobalSettings;
  onChangeSettings: (settings: NailGlobalSettings) => void;
  nails: NailData[];
  onUpdateNails: (nails: NailData[]) => void;
  activeNailId: string | null;
  onSelectNail: (id: string | null) => void;
  detectionResult: HandDetectionResult | null;
  onTriggerAIRetouch: () => void;
  isGeneratingAI: boolean;
}

type TabType = 'colors' | 'shapes' | 'designs' | 'finishes' | 'physics' | 'fingers';

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onChangeSettings,
  nails,
  onUpdateNails,
  activeNailId,
  onSelectNail,
  detectionResult,
  onTriggerAIRetouch,
  isGeneratingAI,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('colors');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const updateSetting = <K extends keyof NailGlobalSettings>(
    key: K,
    value: NailGlobalSettings[K]
  ) => {
    onChangeSettings({
      ...settings,
      [key]: value,
    });
  };

  // Color categories
  const categories = [
    { id: 'all', label: 'همه رنگ‌ها' },
    { id: 'nude', label: 'نود و طبیعی' },
    { id: 'red', label: 'قرمز و زرشکی' },
    { id: 'trend', label: 'ترند روز' },
    { id: 'dark', label: 'تیره و لوکس' },
    { id: 'metallic', label: 'متالیک و شاین' },
  ];

  const filteredPalettes = selectedCategory === 'all'
    ? POLISH_PALETTES
    : POLISH_PALETTES.filter(p => p.category === selectedCategory);

  return (
    <div className="w-full lg:w-96 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col h-[580px] overflow-hidden shadow-xl">
      {/* Tabs Header */}
      <div className="flex border-b border-stone-800 bg-stone-950/60 p-1.5 gap-1 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl font-medium transition flex flex-col items-center gap-1 ${
            activeTab === 'colors'
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>رنگ لاک</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shapes')}
          className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl font-medium transition flex flex-col items-center gap-1 ${
            activeTab === 'shapes'
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Shapes className="w-4 h-4" />
          <span>فرم و ماسک</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('designs')}
          className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl font-medium transition flex flex-col items-center gap-1 ${
            activeTab === 'designs'
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>طرح و فرنچ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('finishes')}
          className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl font-medium transition flex flex-col items-center gap-1 ${
            activeTab === 'finishes'
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>فینیش و برق</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('physics')}
          className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl font-medium transition flex flex-col items-center gap-1 ${
            activeTab === 'physics'
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>نور و سایه</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fingers')}
          className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl font-medium transition flex flex-col items-center gap-1 ${
            activeTab === 'fingers'
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Hand className="w-4 h-4" />
          <span>انگشتان</span>
        </button>
      </div>

      {/* Tab Contents (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ======================================================= */}
        {/* TAB 1: COLORS */}
        {/* ======================================================= */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            {/* Skin Tone Recommendations from AI */}
            {detectionResult?.recommendedShades && detectionResult.recommendedShades.length > 0 && (
              <div className="bg-stone-950/60 border border-amber-500/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>پیشنهاد هوش مصنوعی برای پوست {detectionResult.skinToneFa || 'شما'}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {detectionResult.recommendedShades.map((rec, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => updateSetting('color', rec.hex)}
                      className={`group relative flex flex-col items-center p-1.5 rounded-lg border transition ${
                        settings.color.toLowerCase() === rec.hex.toLowerCase()
                          ? 'border-rose-500 bg-rose-500/10 shadow'
                          : 'border-stone-800 bg-stone-900 hover:border-stone-700'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full border border-white/20 shadow-inner"
                        style={{ backgroundColor: rec.hex }}
                      />
                      <span className="text-[10px] text-stone-300 font-medium mt-1 truncate max-w-full">
                        {rec.nameFa || rec.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition text-xs ${
                    selectedCategory === cat.id
                      ? 'bg-stone-100 text-stone-900 font-semibold'
                      : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Color Grid */}
            <div className="grid grid-cols-3 gap-2">
              {filteredPalettes.map(item => {
                const isSelected = settings.color.toLowerCase() === item.hex.toLowerCase();
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      updateSetting('color', item.hex);
                      if (item.recommendedFinish) {
                        updateSetting('finish', item.recommendedFinish);
                      }
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-right transition ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/15 shadow-md shadow-rose-950/50'
                        : 'border-stone-800 bg-stone-950/40 hover:bg-stone-800/60'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-white/25 shrink-0 shadow-sm relative flex items-center justify-center"
                      style={{ backgroundColor: item.hex }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white drop-shadow" />}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-stone-200 truncate">{item.nameFa}</div>
                      <div className="text-[10px] text-stone-400 truncate font-mono">{item.hex}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Picker */}
            <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-3 space-y-2">
              <label className="text-xs font-semibold text-stone-300 block">
                انتخاب رنگ دلخواه (کد رنگ یا پالت سفارشی):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.color}
                  onChange={e => updateSetting('color', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={settings.color}
                  onChange={e => updateSetting('color', e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-mono focus:border-rose-500 outline-none"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* Secondary Color (for French, Ombre, Marble) */}
            <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-3 space-y-2">
              <label className="text-xs font-semibold text-stone-300 block">
                رنگ ثانویه (نوک فرنچ، رگه‌های ماربل، آمبره):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={e => updateSetting('secondaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={e => updateSetting('secondaryColor', e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-mono focus:border-rose-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB: SHAPES & MASK (فرم و ماسک دقیق ناخن) */}
        {/* ======================================================= */}
        {activeTab === 'shapes' && (
          <div className="space-y-4">
            {/* Shapes selection grid */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                  <Shapes className="w-3.5 h-3.5 text-rose-400" />
                  <span>انتخاب فرم صدف و لبه آزاد ناخن</span>
                </span>
                <span className="text-[11px] text-rose-300 bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 rounded-full font-medium">
                  {SHAPE_OPTIONS.find(s => s.id === (settings.shape || 'natural'))?.nameFa || 'فرم طبیعی'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed mb-3">
                ماسک لاک با هوش مصنوعی دقیقاً روی خط کوتیکول و شیارهای ناخن قفل می‌شود. می‌توانید فرم سالنی دلخواه را با لبه‌های نرم و کانتور دقیق انتخاب نمایید.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {SHAPE_OPTIONS.map(shape => {
                  const isSelected = (settings.shape || 'natural') === shape.id;
                  return (
                    <button
                      key={shape.id}
                      type="button"
                      onClick={() => updateSetting('shape', shape.id)}
                      className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/15 shadow-sm ring-1 ring-rose-500/30'
                          : 'border-stone-800 bg-stone-900/60 hover:bg-stone-850 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`text-xs font-bold ${isSelected ? 'text-rose-200' : 'text-stone-200'}`}>
                          {shape.nameFa}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                      </div>
                      <span className="text-[10px] text-stone-400 leading-tight">
                        {shape.descriptionFa}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nail Length / Extension Slider */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>قد و اکستنشن ناخن</span>
                </label>
                <span className="text-xs font-mono text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded">
                  {settings.nailLength === 0 ? 'طبیعی (کوتاه)' : `${settings.nailLength}%`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.nailLength || 0}
                onChange={e => updateSetting('nailLength', Number(e.target.value))}
                className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex items-center justify-between text-[10px] text-stone-500">
                <span>کوتاه طبیعی (۰٪)</span>
                <span>متوسط سالنی (۵۰٪)</span>
                <span>اکستنشن بلند (۱۰۰٪)</span>
              </div>
              <div className="flex gap-1.5 pt-1">
                {[
                  { label: 'طبیعی', val: 0 },
                  { label: 'کوتاه', val: 25 },
                  { label: 'متوسط', val: 50 },
                  { label: 'بلند سالنی', val: 80 },
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => updateSetting('nailLength', item.val)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition border ${
                      (settings.nailLength || 0) === item.val
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Snug Fit & Anti-Overflow (کیپ‌سازی صدف و رفع بیرون‌زدگی روی پوست) */}
            <div className="bg-stone-950/60 border border-emerald-950/60 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone-200 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                  <span>کیپ‌سازی صدف و حذف بیرون‌زدگی روی پوست</span>
                </label>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  {settings.snugFit ? `${settings.snugFit}% کیپ` : '۰٪ (لبه به لبه)'}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 leading-normal">
                ماسک لاک را دقیقاً روی خط شیار ناخن قفل می‌کند و مانع هرگونه نشت رنگ یا بیرون‌زدگی روی پوست کناره‌ها و کوتیکول می‌شود.
              </p>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={settings.snugFit ?? 2}
                onChange={e => updateSetting('snugFit', Number(e.target.value))}
                className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex items-center justify-between text-[10px] text-stone-500">
                <span>لبه به لبه (۰٪)</span>
                <span>کیپ استاندارد (۲٪)</span>
                <span>فوق‌العاده کیپ و باریک (۸٪)</span>
              </div>
              <div className="flex gap-1.5 pt-1">
                {[
                  { label: 'لبه کامل (۰٪)', val: 0 },
                  { label: 'کیپ طبیعی (۲٪)', val: 2 },
                  { label: 'بسیار کیپ (۴٪)', val: 4 },
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => updateSetting('snugFit', item.val)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition border ${
                      (settings.snugFit ?? 2) === item.val
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuticle Alignment & Micro-Fit */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  <span>انطباق خط کوتیکول و لبه‌های جانبی</span>
                </label>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded">
                  {settings.cuticleFit > 0 ? `+${settings.cuticleFit}%` : `${settings.cuticleFit || 0}%`}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 leading-normal">
                برای تنظیم میکرومتری مرز لاک با شیارهای جانبی و پوست دور ناخن: مقادیر مثبت ماسک را تا لبه بیرونی گسترش می‌دهد تا هرگونه اثر لاک قبلی محو شود؛ مقادیر منفی آن را کمی به داخل جمع می‌کند.
              </p>
              <input
                type="range"
                min="-10"
                max="10"
                value={settings.cuticleFit || 0}
                onChange={e => updateSetting('cuticleFit', Number(e.target.value))}
                className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex items-center justify-between text-[10px] text-stone-500">
                <span>جمع‌شدن به داخل (-۱۰٪)</span>
                <span>استاندارد دقیق (۰٪)</span>
                <span>پوشش حداکثری حاشیه (+۱۰٪)</span>
              </div>
              <button
                type="button"
                onClick={() => updateSetting('cuticleFit', 0)}
                className="w-full py-1 text-center text-[10px] text-stone-400 hover:text-stone-200 border border-stone-800/80 rounded-lg transition hover:bg-stone-850"
              >
                بازنشانی به انطباق پیش‌فرض استاندارد (۰٪)
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 3: DESIGNS */}
        {/* ======================================================= */}
        {activeTab === 'designs' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {DESIGN_OPTIONS.map(design => {
                const isSelected = settings.design === design.id;
                return (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => updateSetting('design', design.id)}
                    className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/15 shadow-sm'
                        : 'border-stone-800 bg-stone-950/40 hover:bg-stone-800/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-stone-100">{design.nameFa}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">{design.descriptionFa}</div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Design Specific Sliders */}
            {(settings.design === 'french' || settings.design === 'micro_french') && (
              <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-300 font-semibold">ضخامت نوار فرنچ:</span>
                  <span className="font-mono text-rose-400">{settings.frenchTipWidth}%</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="45"
                  value={settings.frenchTipWidth}
                  onChange={e => updateSetting('frenchTipWidth', parseInt(e.target.value, 10))}
                  className="w-full cursor-pointer"
                />
              </div>
            )}

            {/* Accent Finger Option */}
            <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-3 space-y-3">
              <label className="text-xs font-semibold text-stone-300 block">
                طرح یا رنگ متفاوت برای یک انگشت خاص (Accent Nail):
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'none', label: 'یکدست' },
                  { id: 'ring', label: 'انگشت حلقه' },
                  { id: 'index', label: 'انگشت اشاره' },
                  { id: 'thumb', label: 'شست' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSetting('accentFinger', item.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                      settings.accentFinger === item.id
                        ? 'bg-rose-600 text-white'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {settings.accentFinger !== 'none' && (
                <div className="pt-2 border-t border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-400">رنگ انگشت خاص:</span>
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={e => updateSetting('accentColor', e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 3: FINISHES */}
        {/* ======================================================= */}
        {activeTab === 'finishes' && (
          <div className="space-y-3">
            <p className="text-xs text-stone-400">
              نوع انعکاس نور، مات یا براق بودن و بافت لاک را متناسب با سلیقه خود انتخاب کنید:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {FINISH_OPTIONS.map(opt => {
                const isSelected = settings.finish === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateSetting('finish', opt.id)}
                    className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/15 shadow-sm'
                        : 'border-stone-800 bg-stone-950/40 hover:bg-stone-800/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-stone-100">{opt.nameFa}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">{opt.descriptionFa}</div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {settings.finish === 'shimmer' && (
              <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-300 font-semibold">تراکم اکلیل و شاین:</span>
                  <span className="font-mono text-rose-400">{settings.shimmerDensity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={settings.shimmerDensity}
                  onChange={e => updateSetting('shimmerDensity', parseInt(e.target.value, 10))}
                  className="w-full cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 4: PHYSICS & LIGHTING */}
        {/* ======================================================= */}
        {activeTab === 'physics' && (
          <div className="space-y-4">
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>پوشش صددرصدی طرح قبلی ناخن</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                موتور رندر با زیرساز ماتیکی مانع از پس دادن لاک قرمز، تیره یا لب‌پر شده قبلی می‌شود.
              </p>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-400">قدرت پوشانندگی طرح قبلی:</span>
                  <span className="font-mono text-emerald-400">{settings.coverOldOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="85"
                  max="100"
                  value={settings.coverOldOpacity}
                  onChange={e => updateSetting('coverOldOpacity', parseInt(e.target.value, 10))}
                  className="w-full cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            {/* Gloss Intensity Slider */}
            <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-stone-300 font-semibold">میزان برق و انعکاس نور سالنی:</span>
                <span className="font-mono text-rose-400">{settings.glossIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.glossIntensity}
                onChange={e => updateSetting('glossIntensity', parseInt(e.target.value, 10))}
                className="w-full cursor-pointer"
              />
              <p className="text-[10px] text-stone-400">
                شبیه‌سازی نوار بازتاب نوری منحنی شیشه ژلیش سالنی روی قوس ناخن
              </p>
            </div>

            {/* 3D Curvature Depth */}
            <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-stone-300 font-semibold">سایه و بعد انحنای سه‌بعدی ناخن:</span>
                <span className="font-mono text-rose-400">{settings.curvatureDepth}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={settings.curvatureDepth}
                onChange={e => updateSetting('curvatureDepth', parseInt(e.target.value, 10))}
                className="w-full cursor-pointer"
              />
              <p className="text-[10px] text-stone-400">
                گرادیانت انحنای عرضی ناخن در کناره‌ها برای جلوگیری از حس برچسب دوبعدی
              </p>
            </div>

            {/* Cuticle Depth Shadow */}
            <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-stone-300 font-semibold">سایه کوتیکول و ریشه ناخن:</span>
                <span className="font-mono text-rose-400">{settings.cuticleShadow}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={settings.cuticleShadow}
                onChange={e => updateSetting('cuticleShadow', parseInt(e.target.value, 10))}
                className="w-full cursor-pointer"
              />
              <p className="text-[10px] text-stone-400">
                سایه نرم مرز بین پوست کوتیکول و صدف ناخن برای تلفیق طبیعی
              </p>
            </div>

            {/* Light Direction */}
            <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-3 space-y-2">
              <label className="text-xs font-semibold text-stone-300 block">
                زاویه تابش نور محیطی:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'top-left', label: 'بالا-چپ' },
                  { id: 'top', label: 'بالا' },
                  { id: 'top-right', label: 'بالا-راست' },
                  { id: 'front', label: 'مستقیم' },
                ].map(dir => (
                  <button
                    key={dir.id}
                    type="button"
                    onClick={() => updateSetting('lightDirection', dir.id as any)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition ${
                      settings.lightDirection === dir.id
                        ? 'bg-rose-600 text-white'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {dir.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 5: INDIVIDUAL FINGERS */}
        {/* ======================================================= */}
        {activeTab === 'fingers' && (
          <div className="space-y-3">
            {/* Calibration & Nudge Tool */}
            <div className="bg-stone-950/60 border border-rose-500/30 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>کالیبراسیون و تنظیم محل لاک {activeNailId ? `(${nails.find(n => n.id === activeNailId)?.fingerNameFa})` : '(تمام ناخن‌ها)'}</span>
                </span>
                {activeNailId && (
                  <button
                    type="button"
                    onClick={() => onSelectNail(null)}
                    className="text-[10px] text-stone-400 hover:text-white"
                  >
                    لغو انتخاب
                  </button>
                )}
              </div>

              {/* Nudge D-pad */}
              <div className="flex items-center justify-center gap-1 py-1">
                <button
                  type="button"
                  onClick={() => {
                    const updated = nails.map(n => {
                      if (!activeNailId || n.id === activeNailId) {
                        return { ...n, polygon: shiftPolygon(n.polygon, -0.6, 0) };
                      }
                      return n;
                    });
                    onUpdateNails(updated);
                  }}
                  className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
                  title="حرکت به چپ"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = nails.map(n => {
                        if (!activeNailId || n.id === activeNailId) {
                          return { ...n, polygon: shiftPolygon(n.polygon, 0, -0.6) };
                        }
                        return n;
                      });
                      onUpdateNails(updated);
                    }}
                    className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
                    title="حرکت به بالا"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = nails.map(n => {
                        if (!activeNailId || n.id === activeNailId) {
                          return { ...n, polygon: shiftPolygon(n.polygon, 0, 0.6) };
                        }
                        return n;
                      });
                      onUpdateNails(updated);
                    }}
                    className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
                    title="حرکت به پایین"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = nails.map(n => {
                      if (!activeNailId || n.id === activeNailId) {
                        return { ...n, polygon: shiftPolygon(n.polygon, 0.6, 0) };
                      }
                      return n;
                    });
                    onUpdateNails(updated);
                  }}
                  className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
                  title="حرکت به راست"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scale / Coverage buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-850">
                <button
                  type="button"
                  onClick={() => {
                    const updated = nails.map(n => {
                      if (!activeNailId || n.id === activeNailId) {
                        return { ...n, polygon: scalePolygon(n.polygon, 0.97) };
                      }
                      return n;
                    });
                    onUpdateNails(updated);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium flex items-center justify-center gap-1 transition"
                >
                  <Minus className="w-3 h-3 text-rose-400" />
                  <span>جمع‌تر کردن کادر</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = nails.map(n => {
                      if (!activeNailId || n.id === activeNailId) {
                        return { ...n, polygon: scalePolygon(n.polygon, 1.03) };
                      }
                      return n;
                    });
                    onUpdateNails(updated);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span>گسترش لبه ناخن</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-stone-400">
              یک انگشت را انتخاب کنید تا رنگ، طرح، یا کالیبراسیون روی همان ناخن اعمال شود:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {nails.map(nail => {
                const isSelected = activeNailId === nail.id;
                const nailColor = nail.customColor || settings.color;
                return (
                  <div
                    key={nail.id}
                    className={`p-3 rounded-xl border transition ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/10'
                        : 'border-stone-800 bg-stone-950/40 hover:bg-stone-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onSelectNail(isSelected ? null : nail.id)}
                        className="flex items-center gap-2.5 text-right flex-1"
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: nailColor }}
                        />
                        <div>
                          <div className="text-xs font-bold text-stone-200">
                            ناخن {nail.fingerNameFa} ({nail.fingerName})
                          </div>
                          <div className="text-[10px] text-stone-400">
                            فرم: {nail.nailShape || 'بادامی'} | زاویه: {Math.round(nail.tiltAngle || 0)}°
                          </div>
                        </div>
                      </button>

                      {/* Custom color picker for this nail */}
                      <input
                        type="color"
                        value={nailColor}
                        onChange={e => {
                          const updated = nails.map(n =>
                            n.id === nail.id ? { ...n, customColor: e.target.value } : n
                          );
                          onUpdateNails(updated);
                        }}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                        title="تغییر رنگ اختصاصی این ناخن"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                const reset = nails.map(n => ({
                  ...n,
                  customColor: undefined,
                  customDesign: undefined,
                  customFinish: undefined,
                }));
                onUpdateNails(reset);
              }}
              className="w-full py-2 px-3 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>یکدست کردن تمام ناخن‌ها به رنگ اصلی</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Inpainting / Full Retouch Footer Action */}
      <div className="p-3 border-t border-stone-800 bg-stone-950/80">
        <button
          type="button"
          onClick={onTriggerAIRetouch}
          disabled={isGeneratingAI}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-lg shadow-rose-950/60 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Wand2 className="w-4 h-4" />
          <span>
            {isGeneratingAI ? 'در حال تولید عکس با هوش مصنوعی...' : 'رندر مانیکور واقعی با هوش مصنوعی (Gemini)'}
          </span>
        </button>
      </div>
    </div>
  );
};
