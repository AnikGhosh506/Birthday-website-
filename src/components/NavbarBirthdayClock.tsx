import React, { useState, useEffect } from 'react';
import { AmbianceTheme } from '../utils/themeAmbiance';
import { romanticAudio } from '../utils/audioSynth';

interface NavbarBirthdayClockProps {
  birthdayDate?: string;
  activeTheme: AmbianceTheme;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  modeLabel: string;
}

function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

export const NavbarBirthdayClock: React.FC<NavbarBirthdayClockProps> = ({
  birthdayDate = '2002-05-28',
  activeTheme,
}) => {
  // 'day-end' = 24h celebration countdown until midnight (HH:MM:SS)
  // 'bday-end' = full countdown until May 28 23:59:59 finishes (DDd HH:MM:SS)
  const [countdownMode, setCountdownMode] = useState<'day-end' | 'bday-end'>('day-end');
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [nowDate, setNowDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowDate(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const computeRemaining = (): TimeRemaining => {
    const now = nowDate;

    // Parse month & day from birthdayDate (defaults to May 28)
    let bMonth = 4; // 0-indexed May
    let bDay = 28;
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthdayDate)) {
      const parts = birthdayDate.split('-').map(Number);
      if (parts[1] >= 1 && parts[1] <= 12) bMonth = parts[1] - 1;
      if (parts[2] >= 1 && parts[2] <= 31) bDay = parts[2];
    }

    const isActualBirthdayToday =
      now.getMonth() === bMonth && now.getDate() === bDay;

    if (countdownMode === 'day-end' || isActualBirthdayToday) {
      // End of current celebration day (23:59:59.999)
      const endOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
      const diffMs = Math.max(0, endOfToday.getTime() - now.getTime());
      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      return {
        days: 0,
        hours,
        minutes,
        seconds,
        modeLabel: 'B-Day Left',
      };
    }

    // End of her May 28 birthday celebration (23:59:59.999)
    let targetYear = now.getFullYear();
    let endOfBirthday = new Date(targetYear, bMonth, bDay, 23, 59, 59, 999);
    if (now.getTime() > endOfBirthday.getTime()) {
      targetYear += 1;
      endOfBirthday = new Date(targetYear, bMonth, bDay, 23, 59, 59, 999);
    }

    const diffMs = Math.max(0, endOfBirthday.getTime() - now.getTime());
    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    return {
      days,
      hours,
      minutes,
      seconds,
      modeLabel: 'May 28 Ends',
    };
  };

  const remaining = computeRemaining();
  const isMidnight = activeTheme === 'midnight-indigo';

  // Calculate live analog clock hand angles
  const secAngle = nowDate.getSeconds() * 6;
  const minAngle = nowDate.getMinutes() * 6 + nowDate.getSeconds() * 0.1;
  const hourAngle = (nowDate.getHours() % 12) * 30 + nowDate.getMinutes() * 0.5;

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setTilt({
      rx: Number((-ny * 10).toFixed(2)),
      ry: Number((nx * 12).toFixed(2)),
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const handleToggleMode = () => {
    romanticAudio.playSoftClick();
    setCountdownMode((prev) => (prev === 'day-end' ? 'bday-end' : 'day-end'));
  };

  return (
    <button
      type="button"
      onClick={handleToggleMode}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      title="Interactive 3D Birthday Countdown Clock — Click to toggle between Today's 24h Celebration Countdown and May 28th Birthday Countdown"
      style={{
        transform: `perspective(550px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-1px)`,
      }}
      className={`clock-3d-shell inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border cursor-pointer select-none shrink-0 ${
        isMidnight
          ? 'bg-gradient-to-b from-slate-800 via-indigo-950 to-slate-900 border-amber-400/45'
          : activeTheme === 'sunset-rose'
          ? 'bg-gradient-to-b from-white via-rose-50 to-rose-100/90 border-rose-300/85'
          : 'bg-gradient-to-b from-white via-amber-50/90 to-amber-100/85 border-amber-300/90'
      }`}
    >
      {/* Miniature 3D Metallic Analog Clock Dial */}
      <div
        style={{ transform: 'translateZ(6px)' }}
        className={`relative w-6 h-6 rounded-full flex items-center justify-center border shadow-inner shrink-0 ${
          isMidnight
            ? 'bg-slate-950 border-amber-400/70'
            : activeTheme === 'sunset-rose'
            ? 'bg-rose-950 border-rose-300'
            : 'bg-amber-950 border-amber-400'
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 overflow-visible">
          {/* 12, 3, 6, 9 metallic ticks */}
          <circle cx="12" cy="2.5" r="0.9" fill="#fbbf24" />
          <circle cx="21.5" cy="12" r="0.9" fill="#fbbf24" />
          <circle cx="12" cy="21.5" r="0.9" fill="#fbbf24" />
          <circle cx="2.5" cy="12" r="0.9" fill="#fbbf24" />

          {/* Hour hand */}
          <line
            x1="12"
            y1="12"
            x2="12"
            y2="6.8"
            stroke="#fde68a"
            strokeWidth="1.6"
            strokeLinecap="round"
            transform={`rotate(${hourAngle} 12 12)`}
          />
          {/* Minute hand */}
          <line
            x1="12"
            y1="12"
            x2="12"
            y2="4.5"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            transform={`rotate(${minAngle} 12 12)`}
          />
          {/* Second hand */}
          <line
            x1="12"
            y1="13.5"
            x2="12"
            y2="3.5"
            stroke="#fb7185"
            strokeWidth="0.9"
            strokeLinecap="round"
            transform={`rotate(${secAngle} 12 12)`}
          />
          {/* Center jewel */}
          <circle cx="12" cy="12" r="1.4" fill="#f59e0b" />
        </svg>
      </div>

      {/* 3D Metallic Extruded Countdown Readout */}
      <div
        style={{ transform: 'translateZ(8px)' }}
        className="flex flex-col items-start leading-none text-left"
      >
        <span
          className={`text-[9px] font-sans font-bold uppercase tracking-wider ${
            isMidnight
              ? 'text-amber-300/90'
              : activeTheme === 'sunset-rose'
              ? 'text-rose-800'
              : 'text-amber-900'
          }`}
        >
          {remaining.modeLabel}
        </span>
        <span className="text-xs sm:text-sm font-bold font-metallic-3d tracking-tight mt-0.5">
          {remaining.days > 0 ? `${remaining.days}d ` : ''}
          {pad2(remaining.hours)}:{pad2(remaining.minutes)}:{pad2(remaining.seconds)}
        </span>
      </div>
    </button>
  );
};
