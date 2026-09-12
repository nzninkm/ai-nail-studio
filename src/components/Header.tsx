import React from 'react';
import { Sparkles, Upload, Camera, Images, Download, SplitSquareVertical } from 'lucide-react';

interface HeaderProps {
  onUploadClick: () => void;
  onCameraClick: () => void;
  onSamplesClick: () => void;
  onDownload: () => void;
  isDetecting: boolean;
  splitActive: boolean;
  onToggleSplit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onUploadClick,
  onCameraClick,
  onSamplesClick,
  onDownload,
  isDetecting,
  splitActive,
  onToggleSplit,
}) => {
  return (
    <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 p-0.5 shadow-lg shadow-rose-950/40 flex items-center justify-center">
            <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-stone-100 font-display tracking-tight">
                NailArt AI Studio
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-medium">
                شبیه‌ساز هوشمند لاک و طرح ناخن
              </span>
            </div>
            <p className="text-xs text-stone-400 hidden sm:block">
              تشخیص ناخن، شبیه‌سازی برق و سایه واقعی و پوشش کامل طرح قبلی
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Compare Split Button */}
          <button
            type="button"
            onClick={onToggleSplit}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
              splitActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
            }`}
            title="مقایسه قبل و بعد"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>مقایسه قبل و بعد</span>
          </button>

          {/* Sample Hands Button */}
          <button
            type="button"
            onClick={onSamplesClick}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 text-stone-200 border border-stone-700 hover:bg-stone-700 transition flex items-center gap-1.5"
          >
            <Images className="w-3.5 h-3.5 text-amber-400" />
            <span>مدل‌های آماده دست</span>
          </button>

          {/* Camera Button */}
          <button
            type="button"
            onClick={onCameraClick}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 text-stone-200 border border-stone-700 hover:bg-stone-700 transition flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>دوربین</span>
          </button>

          {/* Upload Button */}
          <button
            type="button"
            onClick={onUploadClick}
            disabled={isDetecting}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>آپلود عکس دست</span>
          </button>

          {/* Export / Download */}
          <button
            type="button"
            onClick={onDownload}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition"
            title="دانلود تصویر مانیکور شده"
          >
            <Download className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
