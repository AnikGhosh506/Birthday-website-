// Permanent browser storage utility combining IndexedDB (large capacity, never hits 5MB quota)
// with synchronous localStorage fallback and high-DPI client-side image compression.

const DB_NAME = 'AmoreSisterKeepsakeDB';
const DB_VERSION = 1;
const STORE_NAME = 'keepsake_store';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('IndexedDB write fallback:', err);
  }
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openDatabase();
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        db.close();
        resolve(req.result as T | undefined);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return undefined;
  }
}

/**
 * Compresses an uploaded image File into a crisp, storage-friendly Data URL
 * so multiple high-res photos fit effortlessly in both localStorage and IndexedDB forever.
 */
export function compressImageFile(
  file: File,
  maxDimension = 1400,
  quality = 0.84
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export interface PersistedArcadeScores {
  totalArcadePoints: number;
  catcherHighScore: number;
  memoryBestMoves: number | null;
  cipherSolvedCount: number;
  cipherPuzzleIndex: number;
}

const ARCADE_SCORES_KEY = 'amore_arcade_scores_permanent_v1';

export function loadArcadeScoresSync(): PersistedArcadeScores {
  try {
    const raw = localStorage.getItem(ARCADE_SCORES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        totalArcadePoints: Number(parsed.totalArcadePoints ?? 0),
        catcherHighScore: Number(parsed.catcherHighScore ?? 0),
        memoryBestMoves:
          parsed.memoryBestMoves !== null && parsed.memoryBestMoves !== undefined
            ? Number(parsed.memoryBestMoves)
            : null,
        cipherSolvedCount: Number(parsed.cipherSolvedCount ?? 0),
        cipherPuzzleIndex: Number(parsed.cipherPuzzleIndex ?? 0),
      };
    }
    // Migrate existing individual keys if present
    const legacyPoints = Number(localStorage.getItem('amore_arcade_points') || '0');
    const legacyHigh = Number(localStorage.getItem('amore_catcher_highscore') || '0');
    const legacyMem = localStorage.getItem('amore_memory_best');
    return {
      totalArcadePoints: legacyPoints,
      catcherHighScore: legacyHigh,
      memoryBestMoves: legacyMem ? Number(legacyMem) : null,
      cipherSolvedCount: 0,
      cipherPuzzleIndex: 0,
    };
  } catch {
    return {
      totalArcadePoints: 0,
      catcherHighScore: 0,
      memoryBestMoves: null,
      cipherSolvedCount: 0,
      cipherPuzzleIndex: 0,
    };
  }
}

export function saveArcadeScoresPermanent(scores: PersistedArcadeScores): void {
  try {
    localStorage.setItem(ARCADE_SCORES_KEY, JSON.stringify(scores));
    localStorage.setItem('amore_arcade_points', String(scores.totalArcadePoints));
    localStorage.setItem('amore_catcher_highscore', String(scores.catcherHighScore));
    if (scores.memoryBestMoves !== null) {
      localStorage.setItem('amore_memory_best', String(scores.memoryBestMoves));
    }
  } catch (e) {
    console.warn('localStorage arcade score write warning:', e);
  }
  void idbSet(ARCADE_SCORES_KEY, scores);
}

export async function loadArcadeScoresFromIdb(): Promise<PersistedArcadeScores | undefined> {
  return await idbGet<PersistedArcadeScores>(ARCADE_SCORES_KEY);
}
