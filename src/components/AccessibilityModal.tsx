import React from 'react';
import { X, Eye, Volume2, Type, Sliders, Check } from 'lucide-react';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
  onPlayAudioBrief: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  highContrast,
  setHighContrast,
  largeText,
  setLargeText,
  reduceMotion,
  setReduceMotion,
  onPlayAudioBrief
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md bg-white border border-[#e5e3dc] rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0eee6] bg-[#faf9f6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f0eee6] text-slate-700 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Preferences
              </div>
              <h3 id="accessibility-title" className="text-base font-bold text-slate-900">
                Accessibility Controls
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close accessibility controls"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#edebe4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Audio Brief */}
          <div className="p-3.5 bg-[#fbfaf8] border border-[#eeebe2] rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#946f38]" />
                <span>Executive Audio Brief</span>
              </div>
              <p className="text-[11px] text-slate-500">Read aloud key balance sheet and strategic actions</p>
            </div>
            <button
              onClick={() => {
                onPlayAudioBrief();
                onClose();
              }}
              className="px-3 py-1.5 bg-[#946f38] hover:bg-[#7d5d2e] text-white rounded-lg font-medium text-xs transition-colors"
            >
              Play
            </button>
          </div>

          {/* Large Text */}
          <div className="p-3.5 bg-white border border-[#eeebe2] rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-slate-600" />
                <span>Large Typography</span>
              </div>
              <p className="text-[11px] text-slate-500">Enlarge body text and financial figure readability</p>
            </div>
            <button
              onClick={() => setLargeText(!largeText)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                largeText ? 'bg-slate-900' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  largeText ? 'transform translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* High Contrast */}
          <div className="p-3.5 bg-white border border-[#eeebe2] rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-600" />
                <span>High Contrast Mode</span>
              </div>
              <p className="text-[11px] text-slate-500">Increase border definition and dark contrast ratios</p>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                highContrast ? 'bg-slate-900' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  highContrast ? 'transform translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Reduce Motion */}
          <div className="p-3.5 bg-white border border-[#eeebe2] rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-slate-600" />
                <span>Reduce Motion</span>
              </div>
              <p className="text-[11px] text-slate-500">Disable UI transitions and gauge animations</p>
            </div>
            <button
              onClick={() => setReduceMotion(!reduceMotion)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                reduceMotion ? 'bg-slate-900' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  reduceMotion ? 'transform translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <div className="text-[11px] text-slate-500 italic pt-1">
            Accessibility settings adjust presentation only without modifying mathematical calculations.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#faf9f6] border-t border-[#f0eee6] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
