import React, { useState, useEffect } from 'react';
import {
  Heart,
  Printer,
  ArrowUp,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Download,
  FileText,
  Sparkles,
  X,
  CheckCircle2,
  MapPin,
  Calendar,
  Ticket,
  MailOpen,
  Award,
  BookOpen,
  QrCode,
  Smartphone,
  Copy,
  Share2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { PersonalizationData } from '../types';
import { romanticAudio } from '../utils/audioSynth';
import { triggerConfettiExplosion } from '../utils/confettiExplosion';

interface FooterProps {
  girlfriendName: string;
  boyfriendName: string;
  data: PersonalizationData;
  userEmail?: string;
  onSignOut?: () => void;
  onSwitchAccount?: () => void;
  onOpenPersonalize: () => void;
  onReplayBirthdayBurst?: () => void;
}

const CUSTOM_PROMISE_STORAGE_KEY = 'atrayee_birthday_promise_custom_v1';

const DEFAULT_PRINT_PROMISE_TEXT = `On your birthday and every single day after, I promise that no matter how busy life gets between Bangalore, NIT, or home, you will always have your little brother cheering the loudest in your corner.\n\nWhenever a day feels heavy, I promise to bring you your favorite Magnum ice cream, listen to every word without judgment, and remind you how deeply proud I am to call you my sister.`;

const DEFAULT_PRINT_PLEDGES = [
  'Unlimited 3:30 AM cinema talks & Magnum ice cream treats on my tab',
  'Always answering your call — whether for a big life update or a random rant',
  'Protecting your peace and celebrating every single win of yours like a festival',
];

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const Footer: React.FC<FooterProps> = ({
  girlfriendName,
  boyfriendName,
  data,
  onSignOut,
  onSwitchAccount,
  onOpenPersonalize,
  onReplayBirthdayBurst,
}) => {
  const [isKeepsakeOpen, setIsKeepsakeOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrMode, setQrMode] = useState<'quick' | 'session'>('session');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [shareableSessionUrl, setShareableSessionUrl] = useState<string>('');
  const [copiedSessionLink, setCopiedSessionLink] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showFloatingBackToTop, setShowFloatingBackToTop] = useState(false);
  const [savedPromiseText, setSavedPromiseText] = useState<string>(
    DEFAULT_PRINT_PROMISE_TEXT
  );

  // Build shareable Amore session URL and generate crisp QR code DataURL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const baseUrl = `${window.location.origin}${window.location.pathname}`;

    let targetUrl = baseUrl;
    if (qrMode === 'session') {
      try {
        // Create a compact session payload that fits cleanly inside a QR code
        const compactSessionPayload = {
          girlfriendName: data.girlfriendName,
          boyfriendName: data.boyfriendName,
          nickname: data.nickname,
          birthdayDate: data.birthdayDate,
          heroKicker: data.heroKicker,
          heroHeadline: data.heroHeadline,
          coupons: data.coupons.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            category: c.category,
            icon: c.icon,
            isRedeemed: c.isRedeemed,
          })),
        };
        const encoded = encodeURIComponent(JSON.stringify(compactSessionPayload));
        // If payload is under 1600 chars, include it in QR; otherwise use clean base URL with session marker
        if (encoded.length <= 1600) {
          targetUrl = `${baseUrl}#gift=${encoded}`;
        } else {
          const minimalSessionPayload = {
            girlfriendName: data.girlfriendName,
            boyfriendName: data.boyfriendName,
            nickname: data.nickname,
            birthdayDate: data.birthdayDate,
          };
          targetUrl = `${baseUrl}#gift=${encodeURIComponent(
            JSON.stringify(minimalSessionPayload)
          )}`;
        }
      } catch {
        targetUrl = baseUrl;
      }
    }

    setShareableSessionUrl(targetUrl);

    void QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1c1917',
        light: '#fffdf8',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.warn('Failed to generate QR code:', err);
      });
  }, [data, qrMode]);

  const handleCopySessionUrl = async () => {
    romanticAudio.playSoftClick();
    try {
      await navigator.clipboard.writeText(shareableSessionUrl);
      setCopiedSessionLink(true);
      window.setTimeout(() => setCopiedSessionLink(false), 2400);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    romanticAudio.playCelebrationChime();
    const sisName = (girlfriendName || data.girlfriendName || 'atrayee')
      .toLowerCase()
      .replace(/\s+/g, '-');
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${sisName}-amore-mobile-qr-code.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Show the floating metallic 3D 'Back to Top' button only after scrolling past the Hero section
  useEffect(() => {
    const handleScroll = () => {
      const heroEl = document.getElementById('celebration');
      const threshold = heroEl
        ? Math.max(420, heroEl.offsetTop + heroEl.offsetHeight - 120)
        : 560;
      setShowFloatingBackToTop(window.scrollY > threshold);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync any custom sibling promise text from localStorage for the printed keepsake
  useEffect(() => {
    try {
      const custom = localStorage.getItem(CUSTOM_PROMISE_STORAGE_KEY);
      if (custom && custom.trim().length > 0) {
        setSavedPromiseText(custom);
      } else {
        setSavedPromiseText(DEFAULT_PRINT_PROMISE_TEXT);
      }
    } catch {
      setSavedPromiseText(DEFAULT_PRINT_PROMISE_TEXT);
    }
  }, [isKeepsakeOpen]);

  const handleOpenKeepsakeStudio = (e: React.MouseEvent<HTMLButtonElement>) => {
    romanticAudio.playCelebrationChime();
    triggerConfettiExplosion({ clientX: e.clientX, clientY: e.clientY });
    setIsKeepsakeOpen(true);
    setStatusMessage(null);
  };

  const handleDirectPrintBooklet = () => {
    romanticAudio.playSoftClick();
    try {
      const custom = localStorage.getItem(CUSTOM_PROMISE_STORAGE_KEY);
      if (custom && custom.trim().length > 0) {
        setSavedPromiseText(custom);
      }
    } catch {
      // ignore storage errors
    }

    document.body.classList.add('printing-keepsake-booklet');
    setStatusMessage('Formatting Birthday Keepsake for PDF / Printer...');

    window.setTimeout(() => {
      try {
        window.print();
      } catch {
        // Fallback if sandboxed iframe restricts window.print()
      }
      window.setTimeout(() => {
        document.body.classList.remove('printing-keepsake-booklet');
        setStatusMessage(
          'Print dialog opened! Choose "Save as PDF" in your print destination to save the physical keepsake PDF.'
        );
      }, 450);
    }, 120);
  };

  const handleDownloadHtmlKeepsake = () => {
    romanticAudio.playCelebrationChime();
    const sisName = girlfriendName || data.girlfriendName || 'Atrayee';
    const broName = boyfriendName || data.boyfriendName || 'Anik';

    const memoriesHtml = data.memories
      .map(
        (m, idx) => `
        <div class="card">
          <div class="meta">#${idx + 1} · ${escapeHtml(m.date)} · ${escapeHtml(m.location)}</div>
          <h3>${escapeHtml(m.title)}</h3>
          ${
            m.imageUrl
              ? `<img src="${m.imageUrl}" alt="${escapeHtml(m.title)}" class="polaroid-img" />`
              : ''
          }
          <p>${escapeHtml(m.caption)}</p>
        </div>`
      )
      .join('\n');

    const lettersHtml = data.letters
      .map(
        (l) => `
        <div class="letter-card">
          <div class="meta">Wax-Sealed Sister Note · ${escapeHtml(l.openWhen)}</div>
          <h3>${escapeHtml(l.title)}</h3>
          <p class="salutation">${escapeHtml(l.subtitle)}</p>
          <p class="letter-body">${escapeHtml(l.content).replace(/\n/g, '<br/>')}</p>
          <div class="signoff">${escapeHtml(l.signOff)} — <strong>${escapeHtml(broName)}</strong></div>
        </div>`
      )
      .join('\n');

    const pledgesHtml = DEFAULT_PRINT_PLEDGES.map(
      (p) => `<li>♥ ${escapeHtml(p)}</li>`
    ).join('\n');

    const couponsHtml = data.coupons
      .map(
        (c) => `
        <div class="voucher-card">
          <div class="meta">${c.isRedeemed ? '✓ REDEEMED' : '★ READY TO CLAIM'} · ${escapeHtml(
            c.category.toUpperCase()
          )}</div>
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.description)}</p>
        </div>`
      )
      .join('\n');

    const reasonsHtml = data.adoreReasons
      .map((r, i) => `<li><strong>#${i + 1}:</strong> ${escapeHtml(r.text)}</li>`)
      .join('\n');

    const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Happy Birthday ${escapeHtml(sisName)} — Heirloom Keepsake Booklet</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Playfair+Display:ital,wght@0,700;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: #fffcf5;
      color: #292524;
      margin: 0;
      padding: 32px 20px;
      line-height: 1.65;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #e7d8c1;
      border-radius: 24px;
      padding: 44px;
      box-shadow: 0 18px 40px rgba(41, 37, 36, 0.08);
    }
    .print-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      padding: 12px 20px;
      border-radius: 14px;
      margin-bottom: 32px;
    }
    .print-btn {
      background: #1c1917;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
    }
    h1, h2, h3 {
      font-family: 'Playfair Display', Georgia, serif;
      color: #1c1917;
      margin-top: 0;
    }
    h1 { font-size: 2.5rem; margin-bottom: 8px; }
    h2 { font-size: 1.6rem; border-bottom: 2px solid #f3e8d2; padding-bottom: 8px; margin-top: 38px; }
    .kicker {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #be123c;
      font-weight: 700;
    }
    .hero-box {
      background: #fff9eb;
      border: 1px solid #ead6b3;
      border-radius: 18px;
      padding: 28px;
      margin-top: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 18px;
    }
    .card, .voucher-card {
      border: 1px solid #e7e5e4;
      border-radius: 16px;
      padding: 18px;
      background: #fafaf9;
      break-inside: avoid;
    }
    .letter-card, .promise-card {
      border: 1px solid #eadbc8;
      border-radius: 18px;
      padding: 24px;
      background: #fffdf8;
      margin-bottom: 18px;
      break-inside: avoid;
    }
    .handwritten {
      font-family: 'Caveat', 'Cormorant Garamond', cursive;
      color: #1e3a8a;
      font-size: 1.45rem;
      line-height: 1.5;
    }
    .polaroid-img {
      width: 100%;
      max-height: 220px;
      object-fit: cover;
      border-radius: 10px;
      margin: 10px 0;
      border: 1px solid #e7e5e4;
    }
    .meta {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9f1239;
      margin-bottom: 6px;
    }
    .salutation { font-weight: 600; font-style: italic; }
    .letter-body { font-family: 'Caveat', 'Cormorant Garamond', Georgia, serif; font-size: 1.35rem; color: #1e3a8a; }
    .signoff { margin-top: 12px; font-style: italic; color: #57534e; }
    @media print {
      body { background: #fff; padding: 0; }
      .container { border: none; box-shadow: none; padding: 0; }
      .print-toolbar { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="print-toolbar">
      <span><strong>Heirloom Birthday Keepsake Booklet</strong> · Prepared for ${escapeHtml(sisName)}</span>
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <div class="kicker">${escapeHtml(data.heroKicker)} · May 28 Celebration</div>
    <h1>Happy Birthday, ${escapeHtml(sisName)} (${escapeHtml(data.nickname)})</h1>
    <p>${escapeHtml(data.heroMessage)}</p>

    <div class="hero-box">
      <div class="meta">Secret Birthday Cake Wish from ${escapeHtml(broName)}</div>
      <p style="margin:0; font-style:italic; font-size:1.08rem;">"${escapeHtml(data.secretWishMessage)}"</p>
    </div>

    <h2>Chapter 01 · Memory Lane Scrapbook</h2>
    <div class="grid">${memoriesHtml}</div>

    <h2>Chapter 02 · "Open When..." Handwritten Sister Letters</h2>
    ${lettersHtml}

    <h2>Chapter 03 · Handwritten Birthday Promise Card from ${escapeHtml(broName)}</h2>
    <div class="promise-card">
      <div class="meta">Lifelong Sibling Promise · Sealed with Love</div>
      <h3>My Forever Little Brother Promise to You</h3>
      <p class="handwritten">Dearest ${escapeHtml(sisName)} Didi,<br/><br/>${escapeHtml(
        savedPromiseText
      ).replace(/\n/g, '<br/>')}</p>
      <ul class="handwritten" style="list-style:none; padding-left:0;">${pledgesHtml}</ul>
      <div class="signoff">Forever your proudest little brother, <strong>${escapeHtml(broName)} ♥</strong></div>
    </div>

    <h2>Chapter 04 · Sister Birthday Vouchers</h2>
    <div class="grid">${couponsHtml}</div>

    <h2>Chapter 05 · Reasons Why You're the Best Older Sister</h2>
    <ul>${reasonsHtml}</ul>

    <p style="margin-top:40px; text-align:center; font-size:0.85rem; color:#78716c;">
      Crafted with endless sibling pride by ${escapeHtml(broName)} for ${escapeHtml(sisName)} ♥
    </p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sisName.toLowerCase().replace(/\s+/g, '-')}-birthday-keepsake-booklet.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusMessage(
      'Downloaded Printable Keepsake Booklet (.html)! Open it in any browser tab to view or save as PDF.'
    );
  };

  const handleDownloadTextKeepsake = () => {
    romanticAudio.playSoftClick();
    const sisName = girlfriendName || data.girlfriendName || 'Atrayee';
    const broName = boyfriendName || data.boyfriendName || 'Anik';

    const lines: string[] = [
      `============================================================`,
      `  HAPPY BIRTHDAY, ${sisName.toUpperCase()} (${data.nickname})`,
      `  Heirloom Sisterhood Keepsake from ${broName}`,
      `============================================================`,
      ``,
      `HERO DEDICATION:`,
      data.heroMessage,
      ``,
      `SECRET BIRTHDAY CAKE WISH:`,
      `"${data.secretWishMessage}"`,
      ``,
      `------------------------------------------------------------`,
      `  1. MEMORY LANE SCRAPBOOK (${data.memories.length} Memories)`,
      `------------------------------------------------------------`,
      ...data.memories.map(
        (m, idx) =>
          `\n[${idx + 1}] ${m.title} (${m.date} · ${m.location})\n    ${m.caption}`
      ),
      ``,
      `------------------------------------------------------------`,
      `  2. "OPEN WHEN..." SISTER LETTERS (${data.letters.length} Letters)`,
      `------------------------------------------------------------`,
      ...data.letters.map(
        (l, idx) =>
          `\n(${idx + 1}) ${l.title.toUpperCase()} [${l.openWhen}]\n${l.subtitle}\n${l.content}\n${l.signOff} — ${broName}\n`
      ),
      `------------------------------------------------------------`,
      `  3. HANDWRITTEN BIRTHDAY PROMISE CARD FROM ${broName.toUpperCase()}`,
      `------------------------------------------------------------`,
      `Dearest ${sisName} Didi,`,
      savedPromiseText,
      ...DEFAULT_PRINT_PLEDGES.map((p) => `  ♥ ${p}`),
      `Forever your proudest little brother, ${broName}`,
      ``,
      `------------------------------------------------------------`,
      `  4. SISTER BIRTHDAY VOUCHERS (${data.coupons.length} Vouchers)`,
      `------------------------------------------------------------`,
      ...data.coupons.map(
        (c) =>
          `• [${c.isRedeemed ? 'REDEEMED' : 'AVAILABLE'}] ${c.title}: ${c.description}`
      ),
      ``,
      `------------------------------------------------------------`,
      `  5. REASONS WHY YOU'RE THE BEST BIG SISTER`,
      `------------------------------------------------------------`,
      ...data.adoreReasons.map((r, i) => `${i + 1}. ${r.text}`),
      ``,
      `Crafted with sibling pride by ${broName} for ${sisName} ♥`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sisName.toLowerCase().replace(/\s+/g, '-')}-birthday-keepsake.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusMessage('Downloaded complete Birthday Keepsake Summary (.txt)!');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    romanticAudio.playSoftClick();
  };

  return (
    <footer
      id="account"
      className="py-16 bg-stone-100 border-t border-stone-200/90 text-stone-600"
    >
      {/* Floating Metallic 3D 'Back to Top' Button (Appears after scrolling past Hero section) */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top of page"
        className={`no-print-control fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl btn-metallic-3d cursor-pointer transition-all duration-300 ease-out ${
          showFloatingBackToTop
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-6 scale-90 pointer-events-none'
        }`}
      >
        <span className="w-7 h-7 rounded-xl bg-amber-950/15 border border-amber-900/20 flex items-center justify-center shadow-inner">
          <ArrowUp className="w-4 h-4 text-amber-950 dark:text-amber-200 stroke-[2.6]" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider font-metallic-3d pr-1">
          Back to Top
        </span>
      </button>

      <div className="max-w-6xl mx-auto px-6">
        {/* Dedicated 3D Logout & Switch Account Section */}
        {(onSignOut || onSwitchAccount) && (
          <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 card-3d-tilt">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-stone-900 text-rose-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-rose-800 mb-1">
                  <span>Account & Session Control</span>
                  <span aria-hidden="true">·</span>
                  <span>Private Access Active</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900 heading-3d">
                  Switch Account or Log Out
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
                  You are currently viewing {girlfriendName || 'Atrayee'}'s private
                  birthday keepsake. You can switch to another Google email account or
                  log out of this session anytime.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
              {onSwitchAccount && (
                <button
                  onClick={onSwitchAccount}
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap tile-3d-extruded"
                >
                  <RefreshCw className="w-4 h-4 text-stone-700" />
                  <span>Switch Account</span>
                </button>
              )}

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap btn-3d-dark"
                >
                  <LogOut className="w-4 h-4 text-rose-300" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Shareable Mobile Keepsake QR Code Banner in the Footer */}
        <div className="mb-10 p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-white via-[#fffdf8] to-rose-50/50 border border-stone-200/90 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-6 card-3d-tilt no-print">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Interactive QR Code Thumbnail */}
            <button
              type="button"
              onClick={() => {
                romanticAudio.playSoftClick();
                setIsQrModalOpen(true);
              }}
              title="Click to enlarge QR Code"
              className="group relative w-28 h-28 rounded-2xl bg-[#fffdf8] border-2 border-amber-300/80 p-2 shadow-md shrink-0 cursor-pointer hover:scale-105 transition-transform"
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code to open ${girlfriendName}'s Amore Birthday Keepsake on mobile`}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400">
                  <QrCode className="w-8 h-8" />
                </div>
              )}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-stone-900 text-amber-300 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shadow-xs">
                Tap to Enlarge
              </span>
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-rose-800 mb-1">
                <Smartphone className="w-3.5 h-3.5 text-rose-600" />
                <span>Instant Mobile Keepsake Access</span>
                <span aria-hidden="true">·</span>
                <span>Live Session QR Pass</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900 heading-3d">
                Open {girlfriendName || 'Atrayee'}’s ‘Amore’ Keepsake on Any Phone
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
                Scan this shareable QR code with any mobile camera to open this exact
                personalized birthday session on her phone, or download the QR pass to
                share on WhatsApp.
              </p>

              {/* Mode Switcher Pills */}
              <div className="mt-3 inline-flex items-center gap-1.5 p-1 rounded-xl bg-stone-200/75 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    romanticAudio.playSoftClick();
                    setQrMode('session');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    qrMode === 'session'
                      ? 'bg-white text-rose-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Full Session State (#gift)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    romanticAudio.playSoftClick();
                    setQrMode('quick');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    qrMode === 'quick'
                      ? 'bg-white text-rose-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Quick App URL
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopySessionUrl}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors tile-3d-extruded"
            >
              {copiedSessionLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Session Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-600" />
                  <span>Copy Session Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadQrPng}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors tile-3d-extruded"
            >
              <Download className="w-3.5 h-3.5 text-rose-700" />
              <span>Save QR PNG</span>
            </button>

            <button
              type="button"
              onClick={() => {
                romanticAudio.playCelebrationChime();
                setIsQrModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors btn-3d-dark"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-300" />
              <span>Full-Screen QR Pass</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-stone-200">
          <div>
            <span className="font-serif text-lg font-bold text-stone-900 block heading-3d">
              Amore · Made for {girlfriendName || 'Atrayee'}
            </span>
            <p className="text-xs text-stone-500 font-sans mt-1">
              An eternal keepsake celebrating the kindest, brightest older sister in
              the world.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                romanticAudio.playSoftClick();
                setIsQrModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-stone-800 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer tile-3d-extruded"
              title="Show shareable QR code for the current Amore session"
            >
              <QrCode className="w-3.5 h-3.5 text-rose-700" />
              <span>Share QR Code</span>
            </button>

            {onReplayBirthdayBurst && (
              <button
                type="button"
                onClick={() => {
                  romanticAudio.playCelebrationChime();
                  onReplayBirthdayBurst();
                }}
                className="px-3.5 py-2 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer tile-3d-extruded"
                title="Replay the 3D Floating Hearts & Glitter Birthday Burst"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>3D Birthday Burst</span>
              </button>
            )}

            {/* Direct Native window.print() Button for Physical/PDF Keepsake */}
            <button
              type="button"
              onClick={handleDirectPrintBooklet}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-800 border border-rose-700 rounded-lg hover:bg-rose-700 transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer btn-3d-rose"
              title="Directly print or save a cleanly formatted PDF of the Birthday Keepsake"
            >
              <Printer className="w-3.5 h-3.5 text-amber-200" />
              <span>Print Keepsake PDF</span>
            </button>

            {/* Open Interactive Keepsake Preview & Download Studio */}
            <button
              type="button"
              onClick={handleOpenKeepsakeStudio}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 border border-stone-800 rounded-lg hover:bg-stone-800 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer btn-3d-dark"
              title="Preview Printable Keepsake Booklet & Download Options"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Keepsake Booklet</span>
            </button>

            <button
              type="button"
              onClick={scrollToTop}
              className="p-2 text-stone-500 hover:text-stone-900 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors shadow-xs cursor-pointer tile-3d-extruded"
              title="Return to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400 font-sans">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>Crafted with sibling love by</span>
            <span className="font-semibold text-stone-700">
              {boyfriendName || 'Anik'}
            </span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for big sister</span>
            <span className="font-semibold text-stone-700">
              {girlfriendName || 'Atrayee'}
            </span>
          </div>

          <button
            onClick={onOpenPersonalize}
            className="text-stone-500 hover:text-stone-900 transition-colors underline cursor-pointer"
          >
            Edit Names & Photos
          </button>
        </div>
      </div>

      {/* Shareable Mobile Keepsake QR Code Modal */}
      {isQrModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4 no-print"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-[#fffdf8] border-2 border-amber-300/80 shadow-2xl p-6 sm:p-8 text-center text-stone-900 paper-texture"
          >
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              aria-label="Close QR Code Modal"
              className="absolute top-4 right-4 p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold uppercase tracking-widest mb-2">
              <Share2 className="w-3 h-3" />
              <span>Amore Mobile Session Pass</span>
            </div>

            <h3 className="font-serif text-2xl font-bold text-stone-900">
              Scan to Open {girlfriendName || 'Atrayee'}’s Keepsake
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Point any iPhone or Android camera at this QR code to launch her birthday
              celebration directly on mobile.
            </p>

            {/* Framed High-Contrast QR Code */}
            <div className="my-5 mx-auto w-60 h-60 rounded-2xl bg-white border-2 border-stone-900 p-3 shadow-lg flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Shareable Amore Session QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <QrCode className="w-16 h-16 text-stone-400" />
              )}
            </div>

            {/* Session Mode Switcher */}
            <div className="mb-4 inline-flex items-center gap-1.5 p-1 rounded-xl bg-stone-200/80 text-xs">
              <button
                type="button"
                onClick={() => setQrMode('session')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  qrMode === 'session'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                Personalized Session (#gift)
              </button>
              <button
                type="button"
                onClick={() => setQrMode('quick')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  qrMode === 'quick'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                Direct App Link
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleCopySessionUrl}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-xs font-semibold text-stone-800 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSessionLink ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQrPng}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold cursor-pointer btn-3d-rose"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download QR PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Heirloom Print Keepsake Sheet (Always mounted in DOM for native window.print() PDF output, and visible as modal when previewing) */}
      <div
        id="printable-keepsake-sheet"
        className={
          isKeepsakeOpen
            ? 'fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto'
            : 'hidden print:block'
        }
        onClick={() => setIsKeepsakeOpen(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="keepsake-print-card relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#fffdf8] border border-amber-200/90 shadow-2xl text-stone-900 p-6 sm:p-10 paper-texture"
        >
          {/* Top Action Toolbar (Hidden during physical paper / PDF print via .no-print-control) */}
          <div className="no-print-control sticky top-0 z-20 -mx-2 -mt-2 mb-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-serif font-bold text-stone-900">
                  Heirloom Birthday Keepsake Booklet
                </h4>
                <p className="text-[11px] text-stone-500">
                  Formatted for native PDF printing — Memories, Letters & Sibling Promise Card
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDirectPrintBooklet}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors cursor-pointer btn-3d-dark"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadHtmlKeepsake}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-900 bg-rose-100 hover:bg-rose-200 border border-rose-300 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-rose-700" />
                <span>Download Booklet (.html)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTextKeepsake}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-stone-600" />
                <span>Save .txt</span>
              </button>

              <button
                type="button"
                onClick={() => setIsKeepsakeOpen(false)}
                aria-label="Close Keepsake Studio"
                className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="no-print-control mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Printable Cover & Hero Dedication */}
          <div className="print-avoid-break text-center pb-8 border-b border-stone-300/80">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-rose-800 mb-2">
              <span>{data.heroKicker || 'A Special Sisterhood Keepsake'}</span>
              <span aria-hidden="true">·</span>
              <span>May 28th Celebration</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
              Happy Birthday, {girlfriendName || 'Atrayee'}
            </h2>
            <p className="mt-1 text-sm font-serif italic text-rose-700">
              Forever {data.nickname || 'Best Big Sis'} · Crafted with pride by{' '}
              {boyfriendName || 'Anik'}
            </p>
            <p className="mt-4 text-sm sm:text-base text-stone-700 max-w-2xl mx-auto leading-relaxed">
              {data.heroMessage}
            </p>

            {/* Secret Birthday Cake Wish Box */}
            <div className="mt-6 p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 max-w-2xl mx-auto text-left">
              <div className="text-[11px] font-bold uppercase tracking-widest text-amber-900 mb-1">
                ★ Secret Birthday Cake Wish from {boyfriendName || 'Anik'}
              </div>
              <p className="text-xs sm:text-sm text-stone-800 italic leading-relaxed">
                "{data.secretWishMessage}"
              </p>
            </div>
          </div>

          {/* Chapter 1: Memory Lane Scrapbook */}
          <div className="mt-8 pb-8 border-b border-stone-300/80">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-rose-700" />
              <h3 className="text-xl font-serif font-bold text-stone-900">
                Chapter 01 · Memory Lane Scrapbook ({data.memories.length} Moments)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.memories.map((mem, index) => (
                <div
                  key={mem.id}
                  className="print-avoid-break p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 mb-1">
                      <span>
                        Memory #{index + 1} · {mem.date}
                      </span>
                      <span className="inline-flex items-center gap-1 text-rose-700">
                        <MapPin className="w-3 h-3" />
                        {mem.location}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-base text-stone-900 mb-2">
                      {mem.title}
                    </h4>
                    {mem.imageUrl && (
                      <div className="mb-2.5 rounded-xl overflow-hidden border border-stone-200 max-h-44 bg-stone-100">
                        <img
                          src={mem.imageUrl}
                          alt={mem.title}
                          className="w-full h-40 object-cover"
                        />
                      </div>
                    )}
                    <p className="text-lg text-[#1e3a8a] font-anik-handwriting leading-snug">
                      {mem.caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter 2: Handwritten "Open When..." Sister Letters */}
          <div className="mt-8 pb-8 border-b border-stone-300/80">
            <div className="flex items-center gap-2 mb-4">
              <MailOpen className="w-4 h-4 text-rose-700" />
              <h3 className="text-xl font-serif font-bold text-stone-900">
                Chapter 02 · Handwritten Sister Letters ({data.letters.length} Notes)
              </h3>
            </div>

            <div className="space-y-4">
              {data.letters.map((letter) => (
                <div
                  key={letter.id}
                  className="print-avoid-break p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-rose-800 mb-1">
                    <span>{letter.title}</span>
                    <span className="text-stone-400">{letter.openWhen}</span>
                  </div>
                  <p className="text-sm font-serif italic font-semibold text-stone-800 mt-2">
                    {letter.subtitle}
                  </p>
                  <p className="mt-2 text-xl text-[#1e3a8a] leading-relaxed font-anik-handwriting whitespace-pre-line">
                    {letter.content}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2">
                    <span className="text-xs italic text-stone-600">
                      {letter.signOff} — <strong>{boyfriendName || 'Anik'}</strong>
                    </span>
                    <img
                      src="/assets/aistudio/anik_signature.png"
                      alt="Anik signature"
                      className="h-8 object-contain opacity-85"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter 3: Handwritten Birthday Promise Card (Aligned for Physical Keepsake) */}
          <div className="mt-8 pb-8 border-b border-stone-300/80 print-avoid-break">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-rose-700" />
              <h3 className="text-xl font-serif font-bold text-stone-900">
                Chapter 03 · Handwritten Birthday Promise Card from{' '}
                {boyfriendName || 'Anik'}
              </h3>
            </div>

            <div className="p-6 rounded-2xl bg-white border-2 border-rose-200/90 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-rose-800">
                    Unwrapped 3D Gift Box Keepsake · Lifelong Sibling Vow
                  </div>
                  <h4 className="font-serif text-xl font-bold text-stone-900 mt-0.5">
                    My Forever Little Brother Promise to You
                  </h4>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-800">
                  Sealed Promise ♥
                </span>
              </div>

              <div className="text-2xl text-[#1e3a8a] font-anik-handwriting font-semibold mb-2">
                Dearest {girlfriendName || 'Atrayee'} Didi,
              </div>

              <p className="text-2xl text-[#1e3a8a] font-anik-handwriting leading-relaxed whitespace-pre-line">
                {savedPromiseText}
              </p>

              <div className="mt-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
                <div className="text-[11px] font-bold uppercase tracking-widest text-rose-800 mb-2">
                  Official Birthday Pledges:
                </div>
                <ul className="space-y-1.5">
                  {DEFAULT_PRINT_PLEDGES.map((pledge, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xl text-[#1e3a8a] font-anik-handwriting"
                    >
                      <span className="text-rose-600">♥</span>
                      <span>{pledge}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
                <div className="text-xl text-[#1e3a8a] font-anik-handwriting">
                  Forever your proudest little brother, {boyfriendName || 'Anik'} ♥
                </div>
                <img
                  src="/assets/aistudio/anik_signature.png"
                  alt="Anik signature"
                  className="h-9 object-contain opacity-90"
                />
              </div>
            </div>
          </div>

          {/* Chapter 4: Sister Birthday Vouchers */}
          <div className="mt-8 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="w-4 h-4 text-rose-700" />
              <h3 className="text-xl font-serif font-bold text-stone-900">
                Chapter 04 · Sister Birthday Vouchers ({data.coupons.length} Passes)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="print-avoid-break p-4 rounded-xl bg-white border border-stone-200/90 flex items-start justify-between gap-3"
                >
                  <div>
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md mb-1 ${
                        coupon.isRedeemed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {coupon.isRedeemed ? '✓ Redeemed' : '★ Ready to Claim'}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-stone-900">
                      {coupon.title}
                    </h4>
                    <p className="text-xs text-stone-600 mt-1">
                      {coupon.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Sign-Off inside Keepsake Sheet */}
          <div className="mt-6 pt-6 border-t border-stone-300/80 text-center text-xs text-stone-500">
            Printed from {girlfriendName || 'Atrayee'}'s Forever Birthday Keepsake ·
            With love & sibling pride from {boyfriendName || 'Anik'} ♥
          </div>
        </div>
      </div>
    </footer>
  );
};

