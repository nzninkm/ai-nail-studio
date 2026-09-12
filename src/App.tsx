import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { HandCanvasViewer } from './components/HandCanvasViewer';
import { ControlPanel } from './components/ControlPanel';
import { UploadModal } from './components/UploadModal';
import { CameraModal } from './components/CameraModal';
import { AIRetouchModal } from './components/AIRetouchModal';
import { SAMPLE_HANDS } from './data/samples';
import { 
  NailData, 
  NailGlobalSettings, 
  HandDetectionResult, 
  SampleHand 
} from './types';
import { 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Wand2
} from 'lucide-react';

export default function App() {
  // Initial default hand is the demo with old red polish to showcase cover-up
  const initialSample = SAMPLE_HANDS[0];
  const [currentImage, setCurrentImage] = useState<string>(initialSample.imageUrl);
  const [nails, setNails] = useState<NailData[]>(initialSample.defaultNails);
  const [detectionResult, setDetectionResult] = useState<HandDetectionResult | null>({
    handType: 'right',
    skinTone: 'Warm Medium',
    skinToneFa: 'گندمی و گرم',
    skinUndertone: initialSample.skinUndertone,
    skinUndertoneFa: initialSample.skinUndertoneFa,
    recommendedShades: [
      { hex: '#D7A99C', name: 'Dusty Rose Nude', nameFa: 'کرم صورتی نود', descriptionFa: 'مکمل پوست گندمی' },
      { hex: '#B31312', name: 'Hollywood Red', nameFa: 'قرمز یاقوتی', descriptionFa: 'کنتراست درخشان' },
      { hex: '#F9F5F0', name: 'Glazed Donut', nameFa: 'کروم مرواریدی', descriptionFa: 'ترند روز' },
      { hex: '#58111A', name: 'Burgundy Wine', nameFa: 'شرابی کلاسیک', descriptionFa: 'جلوه لوکس' },
    ],
    nails: initialSample.defaultNails,
    lightSourceDirection: 'top',
    existingPolishDetected: true,
    existingPolishDescription: 'طرح و لاک قبلی شناسایی شد و آماده پوشش کامل است',
    confidence: 0.98,
  });

  // Global settings
  const [settings, setSettings] = useState<NailGlobalSettings>({
    color: '#D7A99C', // Elegant dusty rose / nude
    secondaryColor: '#FFFFFF',
    finish: 'glossy',
    design: 'solid',
    shape: 'natural',
    nailLength: 0,
    cuticleFit: 0,
    snugFit: 2, // 2% snug fit so polish stays neatly within the nail bed boundaries
    accentFinger: 'none',
    accentColor: '#D4AF37',
    accentDesign: 'minimal_gold',
    glossIntensity: 88,
    curvatureDepth: 70,
    cuticleShadow: 75,
    coverOldOpacity: 98,
    shimmerDensity: 70,
    frenchTipWidth: 22,
    lightDirection: 'top',
    highlightSharpness: 75,
  });

  // UI state
  const [activeNailId, setActiveNailId] = useState<string | null>(null);
  const [splitActive, setSplitActive] = useState<boolean>(true);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [aiRetouchResult, setAiRetouchResult] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const canvasRefInstance = useRef<HTMLCanvasElement | null>(null);

  // Helper for toast notifications
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Trigger Gemini AI Nail Detection on uploaded hand image
  const detectNailsWithGemini = async (base64Image: string) => {
    setIsDetecting(true);
    try {
      const res = await fetch('/api/detect-nails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType: base64Image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.nails && json.data.nails.length > 0) {
        setDetectionResult(json.data);
        setNails(json.data.nails);
        showToast(
          `هوش مصنوعی با موفقیت ${json.data.nails.length} ناخن را تشخیص داد و زاویه نور را تنظیم کرد.`,
          'success'
        );
      } else {
        showToast('هوش مصنوعی تحلیل اولیه را انجام داد؛ می‌توانید لبه‌ها را با ابزار تنظیم دقیق‌تر کنید.', 'info');
      }
    } catch (err: any) {
      console.warn('AI Detection failed or skipped, using fallback:', err);
      showToast('تصویر بارگذاری شد. از ابزار تنظیم دقیق برای ویرایش نقاط استفاده کنید.', 'info');
    } finally {
      setIsDetecting(false);
    }
  };

  // Handle selecting a sample hand or uploading new image
  const handleSelectImage = (base64OrUrl: string, sampleData?: SampleHand) => {
    setCurrentImage(base64OrUrl);
    if (sampleData) {
      setNails(sampleData.defaultNails);
      setDetectionResult({
        handType: 'right',
        skinTone: 'Natural',
        skinToneFa: sampleData.nameFa,
        skinUndertone: sampleData.skinUndertone,
        skinUndertoneFa: sampleData.skinUndertoneFa,
        recommendedShades: [
          { hex: '#E8C5B8', name: 'Ballet Slippers', nameFa: 'کرم صورتی نود', descriptionFa: 'نرم و شیک' },
          { hex: '#B31312', name: 'Classic Red', nameFa: 'قرمز کلاسیک', descriptionFa: 'چشمگیر' },
          { hex: '#F9F5F0', name: 'Glazed Donut', nameFa: 'کروم صدفی', descriptionFa: 'مدرن' },
          { hex: '#D4AF37', name: 'Gold Foil', nameFa: 'طلایی متالیک', descriptionFa: 'لوکس' },
        ],
        nails: sampleData.defaultNails,
        lightSourceDirection: 'top',
        existingPolishDetected: sampleData.hasOldPolish,
        confidence: 0.95,
      });
      showToast(`مدل آماده «${sampleData.nameFa}» با موفقیت لود شد.`, 'success');
    } else {
      // User uploaded custom image
      detectNailsWithGemini(base64OrUrl);
    }
  };

  // Download high-resolution rendered result
  const handleDownload = () => {
    if (!canvasRefInstance.current) return;
    const canvas = canvasRefInstance.current;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `nailart-studio-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    showToast('تصویر با کیفیت عالی ذخیره و دانلود شد.', 'success');
  };

  // AI Retouch endpoint (Gemini Image Model)
  const handleTriggerAIRetouch = async () => {
    setIsGeneratingAI(true);
    showToast('در حال ارسال به هوش مصنوعی برای بازتولید فوق‌طبیعی...', 'info');

    try {
      const res = await fetch('/api/generate-nail-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentImage,
          polishColor: settings.color,
          finish: settings.finish,
          design: settings.design,
          description: `Realistic gloss and reflections, completely covering old polish with ${settings.color}`,
        }),
      });

      const json = await res.json();
      if (json.success && json.imageUrl) {
        setAiRetouchResult(json.imageUrl);
        showToast('رندر هوش مصنوعی با موفقیت ایجاد شد!', 'success');
      } else {
        // Fallback: the canvas simulation is already photorealistic!
        showToast('شبیه‌ساز فیزیک نوری کَنوِس فعال است و بالاترین کیفیت را ارائه می‌دهد.', 'info');
      }
    } catch (err: any) {
      console.warn('AI Inpainting endpoint error:', err);
      showToast('شبیه‌ساز کَنوِس با بازتاب نوری فعال است.', 'info');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Header */}
      <Header
        onUploadClick={() => setIsUploadOpen(true)}
        onCameraClick={() => setIsCameraOpen(true)}
        onSamplesClick={() => setIsUploadOpen(true)}
        onDownload={handleDownload}
        isDetecting={isDetecting}
        splitActive={splitActive}
        onToggleSplit={() => setSplitActive(v => !v)}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 flex flex-col lg:flex-row gap-4">
        {/* Hand Canvas Viewer (Left / Center) */}
        <HandCanvasViewer
          imageSrc={currentImage}
          nails={nails}
          settings={settings}
          detectionResult={detectionResult}
          isDetecting={isDetecting}
          activeNailId={activeNailId}
          onSelectNail={setActiveNailId}
          onUpdateNails={setNails}
          splitActive={splitActive}
          onCanvasReady={canvas => {
            canvasRefInstance.current = canvas;
          }}
        />

        {/* Control Panel (Right) */}
        <ControlPanel
          settings={settings}
          onChangeSettings={setSettings}
          nails={nails}
          onUpdateNails={setNails}
          activeNailId={activeNailId}
          onSelectNail={setActiveNailId}
          detectionResult={detectionResult}
          onTriggerAIRetouch={handleTriggerAIRetouch}
          isGeneratingAI={isGeneratingAI}
        />
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-stone-900/90 border-stone-700 text-stone-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Upload & Sample Hands Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSelectImage={handleSelectImage}
        onOpenCamera={() => setIsCameraOpen(true)}
      />

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={dataUrl => {
          handleSelectImage(dataUrl);
        }}
      />

      {/* AI Retouch Output Modal */}
      <AIRetouchModal
        isOpen={!!aiRetouchResult}
        onClose={() => setAiRetouchResult(null)}
        generatedImageUrl={aiRetouchResult}
        originalImageUrl={currentImage}
        polishColor={settings.color}
        finish={settings.finish}
        design={settings.design}
        onApplyAsBase={() => {
          if (aiRetouchResult) {
            setCurrentImage(aiRetouchResult);
            setAiRetouchResult(null);
            showToast('تصویر تولید شده هوش مصنوعی به عنوان تصویر زمینه فعال شد.', 'success');
          }
        }}
      />
    </div>
  );
}
