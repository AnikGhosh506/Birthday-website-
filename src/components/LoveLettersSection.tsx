import React, { useState, useEffect, useRef } from 'react';
import { LoveLetter } from '../types';
import {
  Mail,
  Heart,
  CheckCircle2,
  X,
  PenTool,
  Upload,
  Camera,
  Eraser,
  Sparkles,
  FileText,
} from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

interface LoveLettersSectionProps {
  letters: LoveLetter[];
  girlfriendName: string;
  boyfriendName: string;
  onAddLetter: () => void;
}

type HandwritingPresetId =
  | 'anik_personal'
  | 'caveat'
  | 'kalam'
  | 'dancing'
  | 'indie'
  | 'homemade'
  | 'custom_font';

interface HandwritingPreset {
  id: HandwritingPresetId;
  label: string;
  fontFamily: string;
  sizeClass: string;
  lineHeight: string;
}

const HANDWRITING_PRESETS: HandwritingPreset[] = [
  {
    id: 'anik_personal',
    label: "★ Anik's Personal Handwriting",
    fontFamily: "'AnikHandwriting', 'Caveat', cursive",
    sizeClass: 'text-2xl sm:text-[26px]',
    lineHeight: '2.2rem',
  },
  {
    id: 'caveat',
    label: 'Natural Pen (Caveat)',
    fontFamily: "'Caveat', cursive",
    sizeClass: 'text-2xl sm:text-[26px]',
    lineHeight: '2.1rem',
  },
  {
    id: 'kalam',
    label: 'Ballpoint Note (Kalam)',
    fontFamily: "'Kalam', cursive",
    sizeClass: 'text-lg sm:text-xl',
    lineHeight: '2.1rem',
  },
  {
    id: 'dancing',
    label: 'Flowing Cursive (Dancing Script)',
    fontFamily: "'Dancing Script', cursive",
    sizeClass: 'text-xl sm:text-2xl',
    lineHeight: '2.1rem',
  },
  {
    id: 'indie',
    label: 'Notebook Sketch (Indie Flower)',
    fontFamily: "'Indie Flower', cursive",
    sizeClass: 'text-lg sm:text-xl',
    lineHeight: '2.1rem',
  },
  {
    id: 'homemade',
    label: 'Fountain Quill (Homemade Apple)',
    fontFamily: "'Homemade Apple', cursive",
    sizeClass: 'text-base sm:text-lg',
    lineHeight: '2.4rem',
  },
];

const INK_COLORS = [
  { id: 'royal_blue', label: 'Royal Blue Pen', color: '#1e3a8a' },
  { id: 'midnight', label: 'Midnight Fountain', color: '#1c1917' },
  { id: 'sepia', label: 'Vintage Sepia', color: '#5c3a21' },
  { id: 'crimson', label: 'Burgundy Rose', color: '#881337' },
];

const DEFAULT_ANIK_SIGNATURE = '/assets/aistudio/anik_signature.png';

export const LoveLettersSection: React.FC<LoveLettersSectionProps> = ({
  letters,
  girlfriendName,
  boyfriendName,
}) => {
  const [openedLetterId, setOpenedLetterId] = useState<string | null>(null);
  const [readLetterIds, setReadLetterIds] = useState<Set<string>>(new Set());
  const [showStudioPanel, setShowStudioPanel] = useState(false);

  // Handwriting Style State (defaults to Anik's Personal Handwriting)
  const [selectedPreset, setSelectedPreset] = useState<HandwritingPresetId>(() => {
    try {
      return (
        (localStorage.getItem('amore_letter_font_preset_v2') as HandwritingPresetId) ||
        'anik_personal'
      );
    } catch {
      return 'anik_personal';
    }
  });

  const [inkColor, setInkColor] = useState<string>(() => {
    try {
      return localStorage.getItem('amore_letter_ink_color') || '#1e3a8a';
    } catch {
      return '#1e3a8a';
    }
  });

  const [linedPaper, setLinedPaper] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('amore_letter_lined');
      return saved ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [customFontLoaded, setCustomFontLoaded] = useState<boolean>(false);
  const [customFontName, setCustomFontName] = useState<string>(() => {
    try {
      return localStorage.getItem('amore_custom_font_name') || '';
    } catch {
      return '';
    }
  });

  // Per-letter uploaded handwritten scan/photo (keyed by letter.id)
  const [handwrittenScans, setHandwrittenScans] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('amore_letter_scans');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Drawn or Extracted Real Signature image URL (defaults to Anik's real extracted signature)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('amore_handwritten_signature_v2') || DEFAULT_ANIK_SIGNATURE;
    } catch {
      return DEFAULT_ANIK_SIGNATURE;
    }
  });
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPenDownRef = useRef(false);

  // Restore saved custom .ttf/.otf font from localStorage on mount
  useEffect(() => {
    try {
      const savedFontDataUrl = localStorage.getItem('amore_custom_font_data');
      if (savedFontDataUrl && 'FontFace' in window) {
        const fontFace = new FontFace('UserCustomHandwriting', `url(${savedFontDataUrl})`);
        fontFace
          .load()
          .then((loaded) => {
            document.fonts.add(loaded);
            setCustomFontLoaded(true);
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  const handleSelectPreset = (id: HandwritingPresetId) => {
    romanticAudio.playSoftClick();
    setSelectedPreset(id);
    try {
      localStorage.setItem('amore_letter_font_preset_v2', id);
    } catch {}
  };

  const handleSelectInk = (color: string) => {
    romanticAudio.playSoftClick();
    setInkColor(color);
    try {
      localStorage.setItem('amore_letter_ink_color', color);
    } catch {}
  };

  const handleToggleLinedPaper = () => {
    romanticAudio.playSoftClick();
    setLinedPaper((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('amore_letter_lined', String(next));
      } catch {}
      return next;
    });
  };

  // Upload user's own .ttf / .otf / .woff handwriting font file (e.g. from Calligraphr.com)
  const handleFontFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          const fontFace = new FontFace('UserCustomHandwriting', `url(${reader.result})`);
          const loaded = await fontFace.load();
          document.fonts.add(loaded);
          setCustomFontLoaded(true);
          setCustomFontName(file.name);
          setSelectedPreset('custom_font');
          romanticAudio.playCelebrationChime();

          localStorage.setItem('amore_custom_font_data', reader.result);
          localStorage.setItem('amore_custom_font_name', file.name);
          localStorage.setItem('amore_letter_font_preset_v2', 'custom_font');
        } catch (err) {
          console.error('Could not load custom font file:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload a photo/scan of a real physical handwritten letter for a specific envelope
  const handleScanUpload = (e: React.ChangeEvent<HTMLInputElement>, letterId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const next = { ...handwrittenScans, [letterId]: reader.result };
        setHandwrittenScans(next);
        try {
          localStorage.setItem('amore_letter_scans', JSON.stringify(next));
        } catch {}
        romanticAudio.playCelebrationChime();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScan = (letterId: string) => {
    romanticAudio.playSoftClick();
    const next = { ...handwrittenScans };
    delete next[letterId];
    setHandwrittenScans(next);
    try {
      localStorage.setItem('amore_letter_scans', JSON.stringify(next));
    } catch {}
  };

  // Live Freehand Signature Drawing Canvas Handlers
  const startDrawingSig = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isPenDownRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
  };

  const moveDrawingSig = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPenDownRef.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const endDrawingSig = () => {
    if (!isPenDownRef.current) return;
    isPenDownRef.current = false;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureDataUrl(dataUrl);
    try {
      localStorage.setItem('amore_handwritten_signature_v2', dataUrl);
    } catch {}
  };

  const clearSignatureCanvas = () => {
    romanticAudio.playSoftClick();
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureDataUrl(DEFAULT_ANIK_SIGNATURE);
    try {
      localStorage.removeItem('amore_handwritten_signature_v2');
    } catch {}
  };

  const handleOpenLetter = (letter: LoveLetter) => {
    romanticAudio.playCelebrationChime();
    setOpenedLetterId(letter.id);
    setReadLetterIds((prev) => new Set([...prev, letter.id]));
  };

  const currentLetter = letters.find((l) => l.id === openedLetterId);

  const activePresetObj =
    selectedPreset === 'custom_font' && customFontLoaded
      ? {
          id: 'custom_font' as const,
          label: customFontName || 'My Custom Font',
          fontFamily: "'UserCustomHandwriting', 'Caveat', cursive",
          sizeClass: 'text-2xl sm:text-[26px]',
          lineHeight: '2.1rem',
        }
      : HANDWRITING_PRESETS.find((p) => p.id === selectedPreset) || HANDWRITING_PRESETS[0];

  return (
    <section id="letters" className="py-20 border-b border-stone-200/80 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
              <span>Chapter 03</span>
              <span aria-hidden="true">·</span>
              <span>Handwritten Wax-Sealed Envelopes</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
              Open When...
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 font-sans max-w-xl">
              Personal handwritten notes for {girlfriendName}—styled in realistic pen ink, your own uploaded handwriting font, or a photo scan of your real handwritten letter.
            </p>
          </div>

          {/* Toggle Handwriting Studio Button */}
          <button
            onClick={() => {
              romanticAudio.playSoftClick();
              setShowStudioPanel((prev) => !prev);
            }}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl inline-flex items-center gap-2 cursor-pointer whitespace-nowrap self-start md:self-auto btn-3d-dark"
          >
            <PenTool className="w-4 h-4 text-rose-300" />
            <span>
              {showStudioPanel ? 'Hide Handwriting Studio' : 'Customize My Handwriting Style'}
            </span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* INTERACTIVE HANDWRITING STYLE & CUSTOM FONT STUDIO PANEL       */}
        {/* ============================================================== */}
        {showStudioPanel && (
          <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-[#faf6f0] border border-stone-300 paper-texture card-3d-tilt">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
              {/* Left Column: Choose Pen Font + Ink Color + Lined Paper */}
              <div className="flex-1 space-y-5">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-rose-800">
                    Option 1 · Built-In Pen & Cursive Styles
                  </span>
                  <h3 className="text-lg font-serif font-bold text-stone-900 mt-0.5 heading-3d">
                    Choose a Pen Style & Ink Color
                  </h3>
                </div>

                {/* Font Presets */}
                <div className="flex flex-wrap gap-2.5">
                  {HANDWRITING_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      style={{ fontFamily: preset.fontFamily }}
                      className={`px-4 py-2 rounded-xl border text-base transition-all cursor-pointer ${
                        selectedPreset === preset.id
                          ? 'bg-stone-900 text-white border-stone-900 shadow-sm -translate-y-0.5'
                          : 'bg-white text-stone-800 border-stone-300 hover:border-rose-300 tile-3d-extruded'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  {customFontLoaded && (
                    <button
                      onClick={() => handleSelectPreset('custom_font')}
                      className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        selectedPreset === 'custom_font'
                          ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                          : 'bg-white text-rose-800 border-rose-300 tile-3d-extruded'
                      }`}
                    >
                      ★ My Uploaded Font ({customFontName})
                    </button>
                  )}
                </div>

                {/* Ink Colors & Ruled Lines Toggle */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-stone-600">Pen Ink:</span>
                    {INK_COLORS.map((ink) => (
                      <button
                        key={ink.id}
                        onClick={() => handleSelectInk(ink.color)}
                        title={ink.label}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
                          inkColor === ink.color
                            ? 'bg-white border-stone-900 text-stone-900 shadow-xs font-semibold'
                            : 'bg-white/70 border-stone-300 text-stone-600 hover:bg-white'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: ink.color }}
                        />
                        <span>{ink.label}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleToggleLinedPaper}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                      linedPaper
                        ? 'bg-amber-100/80 border-amber-400 text-amber-950'
                        : 'bg-white border-stone-300 text-stone-600'
                    }`}
                  >
                    {linedPaper ? '✓ Ruled Notebook Lines On' : 'Ruled Notebook Lines Off'}
                  </button>
                </div>
              </div>

              {/* Right Column: Upload Exact Personal Handwriting Font (.ttf/.otf) */}
              <div className="lg:w-88 p-5 rounded-xl bg-white border border-stone-200/90 space-y-3 shrink-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Option 2 · Exact Personal Handwriting</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Want the letters in your <strong>100% real handwriting</strong>?
                  <br />
                  1. Create a free font sheet at <strong>Calligraphr.com</strong> (takes 5 mins) and download your <code className="px-1 py-0.5 bg-stone-100 rounded">.ttf</code> or <code className="px-1 py-0.5 bg-stone-100 rounded">.otf</code> file.
                  <br />
                  2. Upload it below, or open any letter to <strong>sign by hand</strong> or <strong>attach a photo of your handwritten paper note</strong>!
                </p>

                <label className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer transition-colors btn-3d-rose">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {customFontLoaded
                      ? `Replace Font (${customFontName})`
                      : 'Upload My Handwriting Font (.ttf / .otf)'}
                  </span>
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    className="hidden"
                    onChange={handleFontFileUpload}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 3D Envelopes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 perspective-1200">
          {letters.map((letter) => {
            const isRead = readLetterIds.has(letter.id);
            const hasScan = Boolean(handwrittenScans[letter.id]);
            return (
              <div
                key={letter.id}
                onClick={() => handleOpenLetter(letter)}
                className="group relative bg-[#fcfaf7] border border-stone-200/90 rounded-2xl p-6 shadow-xs card-3d-tilt cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Envelope Flap visual decoration */}
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-stone-200 via-rose-200 to-stone-200 opacity-60" />

                {/* 3D Embossed Wax Seal Stamp */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: letter.sealColor || '#b91c1c',
                      boxShadow:
                        '0 4px 0 0 rgba(69, 10, 10, 0.75), inset 0 2px 3px rgba(255,255,255,0.35)',
                    }}
                  >
                    <Heart className="w-4 h-4 fill-white" />
                  </div>

                  <div className="flex items-center gap-2">
                    {hasScan && (
                      <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Handwritten Scan
                      </span>
                    )}
                    {isRead ? (
                      <span className="flex items-center gap-1 text-xs text-rose-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Opened
                      </span>
                    ) : (
                      <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">
                        Sealed
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Open Condition */}
                <div>
                  <span className="text-xs text-rose-800 font-semibold uppercase tracking-wider">
                    {letter.subtitle}
                  </span>
                  <h3 className="mt-1 font-serif text-xl font-bold text-stone-900 group-hover:text-rose-900 transition-colors heading-3d">
                    {letter.title}
                  </h3>
                  <div className="mt-3 p-2.5 rounded-lg bg-stone-100/70 border border-stone-200/50">
                    <p
                      style={{
                        fontFamily: activePresetObj.fontFamily,
                        color: inkColor,
                      }}
                      className="text-base leading-snug"
                    >
                      "{letter.openWhen}"
                    </p>
                  </div>
                </div>

                {/* Open Affordance */}
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-stone-700 group-hover:text-stone-950">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    Break Wax Seal
                  </span>
                  <span className="text-rose-700 transition-transform group-hover:translate-x-1">
                    Read handwritten note →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unfolded Handwritten Letter Modal */}
        {currentLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-[#faf6f0] rounded-2xl border border-stone-300 shadow-2xl p-6 sm:p-10 paper-texture max-h-[92vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => {
                  setOpenedLetterId(null);
                  setIsDrawingSignature(false);
                }}
                aria-label="Close letter"
                className="absolute top-4 right-4 p-2 rounded-full bg-stone-200/70 hover:bg-stone-300 text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Wax Seal Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300/80 pb-4 mb-6 pr-8">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md shrink-0"
                    style={{ backgroundColor: currentLetter.sealColor || '#b91c1c' }}
                  >
                    <Heart className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-stone-500 font-sans">
                      Handwritten For {girlfriendName}
                    </span>
                    <h4 className="font-serif text-lg font-bold text-stone-900 heading-3d">
                      {currentLetter.title}
                    </h4>
                  </div>
                </div>

                {/* Quick in-modal controls: Upload real handwritten photo OR switch pen style */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg inline-flex items-center gap-1.5 cursor-pointer tile-3d-extruded">
                    <Camera className="w-3.5 h-3.5 text-rose-700" />
                    <span>
                      {handwrittenScans[currentLetter.id]
                        ? 'Change Handwritten Photo'
                        : 'Upload Real Handwritten Photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleScanUpload(e, currentLetter.id)}
                    />
                  </label>
                </div>
              </div>

              {/* Quick Pen Selector Bar inside the Letter Modal */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 bg-white/80 p-2.5 rounded-xl border border-stone-200/80 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-stone-500 font-medium mr-1">Pen Style:</span>
                  {HANDWRITING_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p.id)}
                      style={{ fontFamily: p.fontFamily }}
                      className={`px-2.5 py-1 rounded-md text-sm cursor-pointer transition-colors ${
                        selectedPreset === p.id
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {p.label.split(' (')[0]}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  {INK_COLORS.map((ink) => (
                    <button
                      key={ink.id}
                      onClick={() => handleSelectInk(ink.color)}
                      title={ink.label}
                      className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-transform ${
                        inkColor === ink.color ? 'scale-115 border-stone-900' : 'border-white'
                      }`}
                      style={{ backgroundColor: ink.color }}
                    />
                  ))}
                </div>
              </div>

              {/* Uploaded Real Handwritten Paper Scan (if attached for this letter) */}
              {handwrittenScans[currentLetter.id] && (
                <div className="mb-6 p-3 bg-white rounded-xl border border-stone-300 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-rose-700" />
                      Original Handwritten Letter Scan
                    </span>
                    <button
                      onClick={() => handleRemoveScan(currentLetter.id)}
                      className="text-xs text-rose-700 hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  </div>
                  <img
                    src={handwrittenScans[currentLetter.id]}
                    alt="Handwritten letter scan"
                    className="w-full max-h-[420px] object-contain rounded-lg border border-stone-200"
                  />
                </div>
              )}

              {/* Handwritten Letter Body on Ruled / Parchment Paper */}
              <div
                style={{
                  fontFamily: activePresetObj.fontFamily,
                  color: inkColor,
                  lineHeight: activePresetObj.lineHeight,
                  backgroundImage: linedPaper
                    ? 'repeating-linear-gradient(transparent, transparent 32px, rgba(180, 160, 140, 0.32) 32px, rgba(180, 160, 140, 0.32) 33.5px)'
                    : 'none',
                  backgroundPositionY: '6px',
                }}
                className={`${activePresetObj.sizeClass} whitespace-pre-line py-3 px-4 rounded-xl transition-all`}
              >
                {currentLetter.content}
              </div>

              {/* Sign-off & Real Drawn Handwritten Signature Area */}
              <div className="mt-8 pt-6 border-t border-stone-300/80 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                <div>
                  <span
                    style={{
                      fontFamily: activePresetObj.fontFamily,
                      color: inkColor,
                    }}
                    className="text-2xl block"
                  >
                    {currentLetter.signOff || 'With all my love,'}
                  </span>

                  {/* Show Drawn Real Signature if present, else styled handwriting name */}
                  {signatureDataUrl ? (
                    <div className="mt-2">
                      <img
                        src={signatureDataUrl}
                        alt="Handwritten signature"
                        className="h-16 object-contain -ml-2"
                      />
                      <span className="text-[11px] text-stone-500 block">
                        Signed by {boyfriendName || 'Anik'}
                      </span>
                    </div>
                  ) : (
                    <span
                      style={{
                        fontFamily: activePresetObj.fontFamily,
                        color: inkColor,
                      }}
                      className="text-3xl font-bold block mt-1 -rotate-2"
                    >
                      {boyfriendName || 'Anik'}
                    </span>
                  )}

                  <button
                    onClick={() => {
                      romanticAudio.playSoftClick();
                      setIsDrawingSignature((prev) => !prev);
                    }}
                    className="mt-2 text-xs font-medium text-rose-800 hover:text-rose-950 underline underline-offset-2 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <PenTool className="w-3 h-3" />
                    <span>
                      {isDrawingSignature
                        ? 'Done Signing'
                        : signatureDataUrl
                        ? 'Redraw My Real Handwritten Signature'
                        : 'Draw My Real Signature by Hand'}
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setOpenedLetterId(null);
                    setIsDrawingSignature(false);
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-xl hover:bg-stone-800 transition-colors cursor-pointer btn-3d-dark"
                >
                  Keep in My Heart
                </button>
              </div>

              {/* Interactive Freehand Signature Pad */}
              {isDrawingSignature && (
                <div className="mt-5 p-4 bg-white rounded-xl border border-stone-300 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-stone-700">
                      Sign with your mouse, finger, or stylus below:
                    </span>
                    <button
                      onClick={clearSignatureCanvas}
                      className="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 rounded-md inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eraser className="w-3 h-3" />
                      <span>Clear Signature</span>
                    </button>
                  </div>
                  <canvas
                    ref={sigCanvasRef}
                    width={460}
                    height={130}
                    onPointerDown={startDrawingSig}
                    onPointerMove={moveDrawingSig}
                    onPointerUp={endDrawingSig}
                    onPointerLeave={endDrawingSig}
                    className="w-full h-[120px] bg-[#fcfaf7] border border-dashed border-stone-300 rounded-lg cursor-crosshair touch-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
