import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SAMPLE_HANDS } from '../data/samples';
import { SampleHand } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (base64OrUrl: string, sampleData?: SampleHand) => void;
  onOpenCamera: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  onOpenCamera,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('لطفاً یک فایل تصویری معتبر (JPG، PNG، WEBP) انتخاب کنید.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('حجم تصویر نباید بیشتر از ۲۰ مگابایت باشد.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      if (result) {
        onSelectImage(result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-xl w-full p-5 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-stone-100 font-display">
              انتخاب عکس دست
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

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Drag & Drop Zone */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
            dragOver
              ? 'border-rose-500 bg-rose-500/10'
              : 'border-stone-700 bg-stone-950/50 hover:border-stone-500 hover:bg-stone-950'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />
          <div className="w-12 h-12 rounded-full bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-200">
              عکس دست خود را بکشید و رها کنید، یا کلیک کنید
            </p>
            <p className="text-xs text-stone-400 mt-1">
              نکته: عکسی با نور ملایم و انگشتان باز بیشترین دقت را در شبیه‌سازی خواهد داشت
            </p>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onOpenCamera();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>گرفتن عکس زنده با دوربین</span>
            </button>
          </div>
        </div>

        {/* Preset Sample Hands */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-stone-300">
            یا از عکس‌های آماده زیر برای تست سریع استفاده کنید:
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SAMPLE_HANDS.map(sample => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  onSelectImage(sample.imageUrl, sample);
                  onClose();
                }}
                className="group p-2 rounded-xl border border-stone-800 bg-stone-950/60 hover:border-rose-500 hover:bg-rose-500/5 transition text-right flex flex-col gap-2"
              >
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-stone-900 border border-stone-800">
                  <img
                    src={sample.imageUrl}
                    alt={sample.nameFa}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {sample.hasOldPolish && (
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-rose-600/90 text-white text-[9px] font-bold">
                      دارای لاک قبلی
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200 group-hover:text-rose-400 transition truncate">
                    {sample.nameFa}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate mt-0.5">
                    {sample.descriptionFa}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
