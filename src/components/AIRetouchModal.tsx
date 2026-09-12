import React from 'react';
import { Sparkles, Download, X, Check, RefreshCw } from 'lucide-react';

interface AIRetouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedImageUrl: string | null;
  originalImageUrl: string;
  polishColor: string;
  finish: string;
  design: string;
  onApplyAsBase: () => void;
}

export const AIRetouchModal: React.FC<AIRetouchModalProps> = ({
  isOpen,
  onClose,
  generatedImageUrl,
  originalImageUrl,
  polishColor,
  finish,
  design,
  onApplyAsBase,
}) => {
  if (!isOpen || !generatedImageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `nailart-ai-studio-${Date.now()}.png`;
    link.href = generatedImageUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-3xl w-full p-5 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-stone-100 font-display">
              نتیجه رندر فوق‌طبیعی هوش مصنوعی (Gemini)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Side by side or main image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-stone-400">عکس اولیه:</span>
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black border border-stone-800">
              <img
                src={originalImageUrl}
                alt="قبل"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نتیجه هوش مصنوعی (پوشش کامل + برق و سایه واقعی):</span>
            </span>
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black border border-rose-500/40 shadow-xl shadow-rose-950/40">
              <img
                src={generatedImageUrl}
                alt="بعد"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {/* Specifications summary */}
        <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between text-xs text-stone-300">
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border border-white/20 shadow"
              style={{ backgroundColor: polishColor }}
            />
            <span>
              رنگ انتخابی: <strong className="font-mono text-white">{polishColor}</strong>
            </span>
            <span className="text-stone-600">|</span>
            <span>فینیش: <strong className="text-white">{finish}</strong></span>
            <span className="text-stone-600">|</span>
            <span>طرح: <strong className="text-white">{design}</strong></span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-300 hover:bg-stone-800 transition"
          >
            بستن
          </button>
          <button
            type="button"
            onClick={onApplyAsBase}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>تنظیم به عنوان عکس فعال</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>دانلود عکس نهایی با کیفیت بالا</span>
          </button>
        </div>
      </div>
    </div>
  );
};
