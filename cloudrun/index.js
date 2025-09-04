import express from 'express';
import fetch from 'node-fetch';

// --- lazy-load sharp for local health tests ---
let _sharp;
async function getSharp() {
  if (!_sharp) {
    const mod = await import('sharp');
    _sharp = mod.default || mod;
  }
  return _sharp;
}

const app = express();
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Cloud Run env (KODA YAZMA)
const RUN_TOKEN = process.env.RUN_TOKEN;           // Cloud Run env (KODA YAZMA)

// ---- Auth: yalnızca gizli X-Run-Token header'ı olan istekler kabul edilir ----
function requireAuth(req, res, next) {
  const token = req.get('x-run-token') || '';
  if (!RUN_TOKEN || token !== RUN_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

// ---- Prompt (flood-fill dostu sade SVG) ----
function normalizeLevel(level) {
  return level === 'simple' ? 'simple' : 'detail';
}
function buildPrompt(topic = 'cute dinosaur', level = 'simple') {
  const complexity =
    normalizeLevel(level) === 'simple'
      ? 'very simple, large forms'
      : 'moderate detail';
  return `You are a professional children coloring-book illustrator. Create a single SVG line art for kids.
Rules (must follow strictly):
- one centered subject related to: ${topic}
- ${complexity}
- thick, clean, black outlines only; stroke-linecap=round; stroke-linejoin=round; stroke-width=6
- white background rectangle covering full canvas
- no colors, no gray, no shading, no textures, no text, no watermarks, no clutter
- closed contours for all shapes
- output a single <svg> only, with viewBox="0 0 2048 2048", width="2048", height="2048"
- use <path> (and minimal <rect> for white background) with fill="none" for strokes
- ensure paths are large and flood-fill friendly
Return only the SVG markup.`;
}

// ---- Gemini yanıtı için minik temizleme ----
function preclean(svg) {
  // ```svg ... ``` bloklarını kaldır
  svg = svg.replace(/```(?:svg|xml)?\s*/gi, '').replace(/```/g, '');
  // HTML entity → gerçek karakter
  svg = svg.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  // XML prolog / doctype kaldır
  svg = svg.replace(/<\?xml[\s\S]*?\?>/gi, '').replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  return svg.trim();
}

function sanitizeSvg(svg) {
  let out = preclean(svg);

  // Güvenlik: <script>/<style>/<foreignObject> ve inline event handler'ları kaldır
  out = out
    .replace(/<(?:script|style|foreignObject)[\s\S]*?<\/(?:script|style|foreignObject)>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '');

  // viewBox/size zorunlu
  if (!/viewBox="0 0 2048 2048"/i.test(out)) {
    out = out.replace(
      /<svg(.*?)>/i,
      '<svg$1 viewBox="0 0 2048 2048" width="2048" height="2048">'
    );
  }

  // stroke / width / fill zorlaması
  out = out
    .replace(/stroke="[^"]*"/gi, 'stroke="black"')
    .replace(/stroke-width="[^"]*"/gi, 'stroke-width="6"')
    .replace(/fill="(?!white)[^"]*"/gi, 'fill="none"');

  // beyaz arka plan rect ekle
  if (!/<rect[^>]*fill="white"/i.test(out)) {
    out = out.replace(
      /<svg[^>]*>/i,
      (m) => `${m}\n<rect x="0" y="0" width="2048" height="2048" fill="white"/>`
    );
  }

  if (!out.includes('<svg')) throw new Error('Sanitization failed: no <svg> tag');
  return out;
}

// ---- Gemini çağrısı (SVG metin döner) ----
async function callGemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  // responseMimeType kaldırıldı — metin dönecek (API bu formatı istiyor)
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 8192
    }
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!r.ok) throw new Error(`Gemini error: ${r.status} ${await r.text()}`);

  const data = await r.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const svgPart = parts.find((p) => typeof p.text === 'string' && p.text.includes('<svg'));
  const raw = svgPart?.text || '';
  if (!raw || !raw.includes('<svg')) throw new Error('No SVG returned');
  return raw;
}

// ---- Rotalar ----
app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/generate', requireAuth, async (req, res) => {
  try {
    let { topic = 'cute dinosaur', level = 'simple' } = req.body || {};
    topic = String(topic).slice(0, 80);
    level = normalizeLevel(level);

    const prompt = buildPrompt(topic, level);
    const rawSvg = await callGemini(prompt);
    const svg = sanitizeSvg(rawSvg);

    // Render to PNG (lazy-loaded sharp)
    const sharp = await getSharp();
    const pngBuffer = await sharp(Buffer.from(svg, 'utf8'))
      .png({ compressionLevel: 9 })
      .toBuffer();

    res.json({
      pngBase64: pngBuffer.toString('base64'),
      width: 2048,
      height: 2048
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`ai-svg-gen listening on ${PORT}`);
});
