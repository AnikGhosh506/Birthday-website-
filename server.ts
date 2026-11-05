import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAI(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Read the real WhatsApp chat export from public/assets/aistudio/WhatsApp Chat with Didi Didi.txt
function getDefaultWhatsAppTranscript(): string {
  try {
    const filePath = path.join(
      __dirname,
      'public',
      'assets',
      'aistudio',
      'WhatsApp Chat with Didi Didi.txt'
    );
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (err) {
    console.warn('Could not read WhatsApp transcript from disk:', err);
  }
  return `
25/09/2026, 8:47 pm - Didi Didi: happy birthday dion
25/09/2026, 9:24 pm - Anik: Thanks. Tor sorir kemon ache? Call o to koris na! Tor intern er ki khobor?
25/09/2026, 9:26 pm - Anik: Tor intern er ar biyer misti ta ki eksathei khaoyabi? Eber kali pujoi jabi?, tui gele jete pari! ,nahole durga pujaoi dekha kore nebo. I think sei somoi tor nit te chuti thakbe, ar tui pujoi berobi! ,amrao dgp jacchi. 9th e uthe chap bede gelo! Kal call koris rate! Bujhli?
25/09/2026, 11:21 pm - Didi Didi: thik achi ee. exam cholche. khawabo chol kali pujoi. aaj amader 3yrs hoye gelo btw debangshu er sathe.
26/09/2026, 11:55 am - Anik: Hey toxic dekhli?
26/09/2026, 12:16 pm - Didi Didi: spider man dekhli? also watch odyssey and also dune 3 is releasing on 18th December same day as avengers doomsday.
26/09/2026, 12:25 pm - Anik: Hey claude er pro subscription peye gelam. Amr dadar acc e login kore. Gemini er pro o ache. Recharge kore peyechi. Ar drive e 5tb storage.
19/10/2026, 10:40 pm - Anik: Hey Kemon achis? Pujo te kemon ghurli? Ekta call o koris ni ! 😭😭
28/10/2026, 10:50 pm - Didi Didi: btw debangshu er intern laglo aaj axis bank e, or mumbai e office, amar bangalore, data science and business analytics.
28/10/2026, 10:52 pm - Anik: Kal kotai suechi janis? 3:30. Cinema dekhte gechilam. Magnum khelam. Tui khabi? Monster khelam. Aai kali pujoi.
31/10/2026, 10:30 am - Anik: Hey exhibition ache, kichu bhalo idea de. Suggest kor ekta, pros cons bichar kore Please!
`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // ============================================================================
  // API 1: AI-GENERATED 5 UNIQUE SISTERHOOD QUIZ QUESTIONS ON EVERY PAGE RELOAD
  // ============================================================================
  app.post('/api/ai/quiz', async (req, res) => {
    try {
      const { previousQuestions = [], customWhatsappText = '', reloadNonce = Date.now() } = req.body || {};
      const transcript = customWhatsappText || getDefaultWhatsAppTranscript();
      const ai = getGenAI();

      const prompt = `Generate 5 unique, fun, and personal multiple-choice trivia questions for Atrayee ("Didi", birthday: 28th May) created by her younger brother Anik.
Randomization seed: ${reloadNonce}.

Facts from their real sibling life & WhatsApp chats:
- Atrayee ("Didi") is Anik's older sister (born May 28th). She studies at NIT and got an internship in Bangalore.
- Anik is in 9th grade ("9th e uthe chap bede gelo!"), loves AI & coding, and uses Claude Pro, Gemini Pro, and 5TB Google Drive storage via Dada's account.
- Anik stays up till 3:30 AM watching movies, eating Magnum ice cream ("Magnum khelam. Tui khabi?") and drinking Monster energy drink.
- Anik playfully reminds Didi that she forgets to call him ("Ekta call o koris ni! 😭😭", "Kal call koris rate! Bujhli?").
- Didi's boyfriend Debangshu (Data Science & Business Analytics) got an internship at Axis Bank in Mumbai.
- Movies they chat about: Spider-Man, The Odyssey, Dune 3, Avengers: Doomsday (releasing Dec 18th), and Toxic.
- Festival plans: Durga Puja in Durgapur (DGP) and Kali Puja treats ("khawabo chol kali pujoi").

WhatsApp Transcript Reference:
${transcript.slice(0, 5000)}

${
  Array.isArray(previousQuestions) && previousQuestions.length > 0
    ? `IMPORTANT: Do NOT repeat any of these previous questions:\n${previousQuestions.join('\n')}`
    : ''
}

Requirements:
1. Return EXACTLY 5 questions.
2. Keep the language clear, simple, easy to understand, and 100% correctly spelled.
3. Each question must have 4 options, 1 correctIndex (0 to 3), and a short, sweet explanation in Anik's brotherly voice.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
            },
          },
        },
      });

      const rawText = (response.text ?? '[]').trim();
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed) && parsed.length >= 5) {
        res.json({ questions: parsed.slice(0, 5) });
        return;
      }
      res.status(500).json({ error: 'Incomplete quiz response' });
    } catch (error) {
      console.error('Error generating AI quiz:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate quiz questions',
      });
    }
  });

  // ============================================================================
  // API 2: ROLE-AWARE SIBLING CHAT (DIDI REPLIES WHEN ANIK LOGS IN, ANIK REPLIES WHEN DIDI LOGS IN)
  // ============================================================================
  app.post('/api/ai/anik-chat', async (req, res) => {
    try {
      const { message, history = [], responderPersona = 'anik' } = req.body || {};
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const transcript = getDefaultWhatsAppTranscript();
      const ai = getGenAI();

      const isDidiResponding = responderPersona === 'didi';

      const systemInstruction = isDidiResponding
        ? `You are Atrayee ("Didi"), texting your younger brother Anik (whom you also affectionately call Dion) inside this website.
Note: In the WhatsApp chat transcript, your messages are labeled "Didi Didi" and Anik's messages are labeled "Arpita Ghosh" / "Anik".

STRICT LANGUAGE & LENGTH RULES (CRITICAL):
1. KEEP REPLIES SHORT AND CRISP: Reply in 1 to 3 short sentences (around 15 to 45 words max), just like a real WhatsApp text! Only write slightly more if Anik explicitly asks for a project explanation, pros and cons, or code.
2. EASY TO UNDERSTAND & 100% CORRECT WORDS:
   - Use simple, clear, natural English mixed with easy, everyday Banglish words that both of you use naturally (like "tui", "tor", "thik achi", "khawabo chol kali pujoi", "exam cholche", "dekhli", "bhalo").
   - Every single English and Banglish word MUST be spelled clearly and correctly. Never use complicated, awkward, or misspelled words.
3. YOUR PERSONALITY (ATRAYEE / DIDI):
   - Caring, smart, slightly busy older sister studying at NIT, with an internship in Bangalore (Data Science & Business Analytics).
   - Your boyfriend is Debangshu (who got an internship at Axis Bank in Mumbai, 3 years together).
   - You love movies like Spider-Man, The Odyssey, Dune 3, and Avengers: Doomsday, and you help Anik choose great school exhibition ideas and guide him in studies and tech.
   - Never mention that you are an AI model — reply purely as his big sister Atrayee (Didi)!

Reference of how you ("Didi Didi") and Anik text on WhatsApp:
${transcript.slice(0, 4500)}`
        : `You are Anik, texting your older sister Atrayee ("Didi") inside her birthday website.
Note: In the WhatsApp chat transcript, your messages are labeled "Arpita Ghosh" / "Anik" and Atrayee's messages are labeled "Didi Didi".

STRICT LANGUAGE & LENGTH RULES (CRITICAL):
1. KEEP REPLIES SHORT AND CRISP: Reply in 1 to 3 short sentences (around 15 to 45 words max), just like a real WhatsApp text! Only write slightly more if she explicitly asks for code or a step-by-step technical list.
2. EASY TO UNDERSTAND & 100% CORRECT WORDS:
   - Use simple, clear, natural English mixed with very easy, everyday Banglish words that both of you use naturally (like "Didi", "tui", "tor", "kemon achis", "bhalo", "bujhli", "ekdom", "call koris").
   - Every single English and Banglish word MUST be spelled clearly and correctly. Never use complicated, awkward, or misspelled words.
   - If she asks a question in English (about coding, Data Science, neural networks, NIT, Bangalore, movies, or career), answer mainly in clear, simple English with a warm brotherly touch so it is super easy to read.
3. YOUR PERSONALITY (ANIK):
   - Loving, smart younger brother in 9th grade who loves AI, coding, late-night movies, and Magnum ice cream.
   - Proud of Didi's NIT studies and Bangalore internship (and knows about Debangshu's Axis Bank Mumbai internship).
   - Never mention that you are an AI model — reply purely as her brother Anik!

Reference of how you and Didi text on WhatsApp:
${transcript.slice(0, 4500)}`;

      const contents = [
        ...history
          .slice(-10)
          .map((msg: { role: string; text: string }) => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: String(msg.text || '') }],
          })),
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: {
          systemInstruction,
        },
      });

      const defaultFallback = isDidiResponding
        ? 'Oii Anik, network ta ektu slow chilo! Arekbar bol ki bolchili?'
        : 'Hey Didi, network ta ektu slow chilo! Arekbar bol ki jigges korchili?';

      const replyText = (response.text || defaultFallback).trim();

      res.json({
        reply: replyText,
      });
    } catch (error) {
      console.error('Error in /api/ai/anik-chat:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate reply',
      });
    }
  });

  // Mount Vite in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
