import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import { promises as fsp } from "fs";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "lucknowseva-store.json");
const MODELS = [...new Set([
  process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
])];

interface ServerStore {
  providers: any[];
  bookings: any[];
  customLocalities: string[];
  auditLogs: any[];
  websiteConfig?: any;
  automationRules?: any;
  lastSavedAt?: string;
}

async function readStore(): Promise<ServerStore> {
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    if (!fs.existsSync(STORE_FILE)) {
      const initial: ServerStore = {
        providers: [], bookings: [], customLocalities: [], auditLogs: [],
        websiteConfig: null, automationRules: null, lastSavedAt: new Date().toISOString(),
      };
      await fsp.writeFile(STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const p = JSON.parse(await fsp.readFile(STORE_FILE, "utf8"));
    return {
      providers: Array.isArray(p.providers) ? p.providers : [],
      bookings: Array.isArray(p.bookings) ? p.bookings : [],
      customLocalities: Array.isArray(p.customLocalities) ? p.customLocalities : [],
      auditLogs: Array.isArray(p.auditLogs) ? p.auditLogs : [],
      websiteConfig: p.websiteConfig || null,
      automationRules: p.automationRules || null,
      lastSavedAt: p.lastSavedAt || new Date().toISOString(),
    };
  } catch (e) {
    console.error("Error reading store:", e);
    return { providers: [], bookings: [], customLocalities: [], auditLogs: [] };
  }
}

async function writeStore(store: ServerStore): Promise<void> {
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    await fsp.writeFile(STORE_FILE, JSON.stringify({ ...store, lastSavedAt: new Date().toISOString() }, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing store:", e);
  }
}

function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
}

function statusOf(e: any): number | undefined {
  const n = Number(e?.status ?? e?.statusCode);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
function temporary(e: any): boolean {
  const s = statusOf(e);
  return [429, 500, 502, 503, 504].includes(s || 0) ||
    /overload|high demand|temporarily unavailable|resource exhausted|rate.?limit|try again/i.test(String(e?.message || ""));
}
async function generate(ai: GoogleGenAI, contents: any, config?: any): Promise<{response: any; model: string}> {
  let last: any;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({ model, contents, config });
        return { response, model };
      } catch (e: any) {
        last = e;
        console.error("Gemini model attempt failed:", {
          model, attempt: attempt + 1, status: statusOf(e) || "unknown",
          message: String(e?.message || "Unknown error").slice(0, 350),
        });
        if (!temporary(e)) throw e;
        if (attempt === 0) await new Promise(r => setTimeout(r, 1200));
      }
    }
  }
  throw last || new Error("All Gemini models failed");
}
function friendlyError(e: any): { status: number; reply: string } {
  const s = statusOf(e), m = String(e?.message || "");
  if (s === 401 || s === 403 || /api.?key|unauthorized|permission/i.test(m))
    return { status: 502, reply: "Gemini API ने API Key या अनुमति से जुड़ी त्रुटि दी। Render में GEMINI_API_KEY जाँचें; Key साझा न करें।" };
  if (s === 429 || /quota|rate.?limit|resource exhausted/i.test(m))
    return { status: 503, reply: "Gemini API की उपयोग सीमा अभी पूरी है। Google AI Studio में quota जाँचें और कुछ देर बाद प्रयास करें।" };
  if (s === 503 || /overload|high demand|temporarily unavailable/i.test(m))
    return { status: 503, reply: "Gemini के सभी आज़माए गए मॉडल अभी व्यस्त हैं। 1–2 मिनट बाद फिर कोशिश करें।" };
  if (s === 404 || /not found|model/i.test(m))
    return { status: 502, reply: "Gemini मॉडल उपलब्ध नहीं है। Render Environment में GEMINI_MODEL हो तो उसे हटाकर Deploy करें।" };
  return { status: 502, reply: "Gemini API से जवाब नहीं मिला। Render Logs में ‘Gemini model attempt failed’ देखें।" };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/data", async (_req, res) => {
    try { res.json(await readStore()); }
    catch (e: any) { res.status(500).json({ error: "डेटा लोड करने में त्रुटि", details: e?.message }); }
  });

  app.post("/api/providers", async (req, res) => {
    try {
      const d = req.body;
      if (!d?.name || !d?.phone) { res.status(400).json({ error: "मिस्त्री का नाम और फोन नंबर आवश्यक है" }); return; }
      const s = await readStore(), i = s.providers.findIndex((p: any) => p.id === d.id);
      let saved: any;
      if (i >= 0) { saved = { ...s.providers[i], ...d, updatedAt: new Date().toISOString() }; s.providers[i] = saved; }
      else { saved = { ...d, id: d.id || `prov-${Date.now()}`, createdAt: d.createdAt || new Date().toISOString() }; s.providers.unshift(saved); }
      await writeStore(s); res.json({ success: true, provider: saved, providers: s.providers });
    } catch (e: any) { res.status(500).json({ error: "मिस्त्री डेटा सहेजने में त्रुटि", details: e?.message }); }
  });

  app.delete("/api/providers/:id", async (req, res) => {
    try {
      const s = await readStore(); s.providers = s.providers.filter((p: any) => p.id !== req.params.id);
      await writeStore(s); res.json({ success: true, providers: s.providers });
    } catch (e: any) { res.status(500).json({ error: "मिस्त्री हटाने में त्रुटि", details: e?.message }); }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const d = req.body;
      if (!d?.customerName || !d?.customerPhone) { res.status(400).json({ error: "ग्राहक का नाम और फोन नंबर आवश्यक है" }); return; }
      const s = await readStore(), i = s.bookings.findIndex((b: any) => b.id === d.id);
      let saved: any;
      if (i >= 0) { saved = { ...s.bookings[i], ...d, updatedAt: new Date().toISOString() }; s.bookings[i] = saved; }
      else { saved = { ...d, id: d.id || `bk-${Date.now()}`, source: d.source || "manual", createdAt: d.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }; s.bookings.unshift(saved); }
      await writeStore(s); res.json({ success: true, booking: saved, bookings: s.bookings });
    } catch (e: any) { res.status(500).json({ error: "बुकिंग सहेजने में त्रुटि", details: e?.message }); }
  });

  app.post("/api/customer/book", async (req, res) => {
    try {
      const d = req.body, phone = String(d.customerPhone || "").replace(/\D/g, "");
      if (!d.customerName || String(d.customerName).trim().length < 2) { res.status(400).json({ error: "कृपया ग्राहक का मान्य नाम दर्ज करें।" }); return; }
      if (phone.length < 10) { res.status(400).json({ error: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।" }); return; }
      if (!d.issueDescription || String(d.issueDescription).trim().length < 3) { res.status(400).json({ error: "कृपया समस्या या कार्य का संक्षिप्त विवरण दर्ज करें।" }); return; }
      const s = await readStore();
      const b = {
        id: `bk-web-${Date.now()}`, customerName: String(d.customerName).trim(), customerPhone: phone.slice(-10),
        locality: String(d.locality || "लखनऊ (Lucknow)").trim(),
        fullAddress: String(d.fullAddress || d.locality || "लखनऊ").trim(),
        serviceType: d.serviceType === "plumber" ? "plumber" : "electrician",
        issueDescription: String(d.issueDescription).trim(), urgency: "normal",
        preferredDate: d.preferredDate || new Date().toISOString().slice(0, 10),
        preferredTimeSlot: d.preferredTimeSlot || "सुबह 10:00 - दोपहर 1:00",
        estimatedAmount: d.serviceType === "plumber" ? 199 : 149,
        status: "pending", source: "website", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      s.bookings.unshift(b);
      s.auditLogs.unshift({
        id: `log-${Date.now()}`, timestamp: new Date().toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" }),
        actionTitleHi: "वेबसाइट से नई वास्तविक ग्राहक बुकिंग प्राप्त हुई",
        detailHi: `ग्राहक ${b.customerName} (${b.locality}) ने वेबसाइट से ${b.serviceType === "electrician" ? "इलेक्ट्रीशियन" : "प्लंबर"} सेवा बुक की।`,
        confirmedByOwner: true, category: "booking",
      });
      await writeStore(s);
      res.json({ success: true, booking: b, bookingsCount: s.bookings.length, message: "धन्यवाद! आपका बुकिंग अनुरोध लखनऊ सेवा में सफलतापूर्वक दर्ज हो गया है।" });
    } catch (e: any) { res.status(500).json({ error: "वेबसाइट बुकिंग दर्ज करने में त्रुटि", details: e?.message }); }
  });

  app.post("/api/data/sync", async (req, res) => {
    try {
      const d = req.body, cur = await readStore();
      const s: ServerStore = {
        providers: Array.isArray(d.providers) ? d.providers : cur.providers,
        bookings: Array.isArray(d.bookings) ? d.bookings : cur.bookings,
        customLocalities: Array.isArray(d.customLocalities) ? d.customLocalities : cur.customLocalities,
        auditLogs: Array.isArray(d.auditLogs) ? d.auditLogs : cur.auditLogs,
        websiteConfig: d.websiteConfig !== undefined ? d.websiteConfig : cur.websiteConfig,
        automationRules: d.automationRules !== undefined ? d.automationRules : cur.automationRules,
      };
      await writeStore(s); res.json({ success: true, count: s.providers.length, lastSavedAt: s.lastSavedAt });
    } catch (e: any) { res.status(500).json({ error: "डेटा सिंक करने में त्रुटि", details: e?.message }); }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history = [], businessSnapshot } = req.body;
      if (!message || typeof message !== "string") { res.status(400).json({ error: "संदेश आवश्यक है (Message is required)" }); return; }
      const ai = getAI();
      if (!ai) {
        console.error("Gemini API unavailable: GEMINI_API_KEY is missing or empty.");
        res.status(503).json({ reply: "Gemini AI चालू नहीं है। Render में GEMINI_API_KEY की वैल्यू जाँचें। API Key साझा न करें।", source: "gemini-error" });
        return;
      }
      const systemInstruction = `आप 'लखनऊ सेवा (LucknowSeva)' के आधिकारिक AI बिज़नेस सहायक हैं।
हम लखनऊ में इलेक्ट्रीशियन और प्लंबर की घरेलू सेवाएँ प्रदान करते हैं। सरल, स्पष्ट और सम्मानजनक हिंदी में उत्तर दें।
नियम:
1. नकली मिस्त्री या नकली बुकिंग को वास्तविक न बताएं।
2. डेटा शून्य हो तो ईमानदारी से बताएं।
3. वेबसाइट से आई वास्तविक बुकिंग के आधार पर सुझाव दें।
4. WhatsApp/SMS भेजने या वेबसाइट बदलाव लागू करने से पहले मालिक की पुष्टि आवश्यक बताएं।
5. मालिक की स्पष्ट पुष्टि के बिना वेबसाइट बदलाव प्रकाशित न करें।
वर्तमान वास्तविक व्यवसाय स्थिति:
${JSON.stringify(businessSnapshot || {}, null, 2)}
उत्तर संक्षिप्त रखें और ज़रूरत पर उपयोग के लिए तैयार हिंदी टेम्पलेट दें।`;
      const safeHistory = Array.isArray(history) ? history.filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string").slice(-6) : [];
      const contents = [
        ...safeHistory.map((m: any) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })),
        { role: "user", parts: [{ text: message }] },
      ];
      try {
        const { response, model } = await generate(ai, contents, { systemInstruction });
        const reply = response.text?.trim();
        if (!reply) { res.status(502).json({ reply: "Gemini API से खाली जवाब मिला। कृपया बाद में कोशिश करें।", source: "gemini-error" }); return; }
        console.log("Gemini response succeeded using model:", model);
        res.json({ reply, source: "gemini", model });
      } catch (e: any) {
        const f = friendlyError(e);
        console.error("Gemini API request failed:", { status: statusOf(e) || "unknown", message: String(e?.message || "").slice(0, 350) });
        res.status(f.status).json({ reply: f.reply, source: "gemini-error" });
      }
    } catch (e: any) {
      console.error("AI chat route failed:", e?.message || e);
      res.status(500).json({ reply: "AI चैट सर्वर में त्रुटि हुई। Render Logs में नवीनतम त्रुटि देखें।", source: "server-error" });
    }
  });

  app.post("/api/ai/website-improve", async (req, res) => {
    try {
      const { currentConfig, customGoal } = req.body, ai = getAI();
      if (ai) {
        try {
          const { response } = await generate(ai, `लखनऊ सेवा की वेबसाइट सेटिंग्स:\n${JSON.stringify(currentConfig, null, 2)}\nलक्ष्य: ${customGoal || "स्थानीय ग्राहक बुकिंग और भरोसा बढ़ाना"}\nहिंदी में ठोस सुधार सुझाएं।`, {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                suggestedHeadline: { type: Type.STRING },
                suggestedSubheadline: { type: Type.STRING },
                suggestedAnnouncement: { type: Type.STRING },
                seoKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvementsList: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["suggestedHeadline", "suggestedSubheadline", "suggestedAnnouncement", "seoKeywords", "improvementsList"],
            },
          });
          if (response.text) { res.json(JSON.parse(response.text.trim())); return; }
        } catch (e: any) {
          console.error("Gemini website improve failed:", { status: statusOf(e) || "unknown", message: String(e?.message || "").slice(0, 350) });
        }
      }
      res.json({
        suggestedHeadline: "लखनऊ में घर बैठे इलेक्ट्रीशियन और प्लंबर बुलाएं",
        suggestedSubheadline: "गोमती नगर, इंदिरा नगर, अलीगंज और पूरे लखनऊ में घरेलू सेवा। काम शुरू होने से पहले शुल्क की पुष्टि करें।",
        suggestedAnnouncement: "बिजली और प्लंबिंग रिपेयर के लिए आज ही संपर्क करें।",
        seoKeywords: ["लखनऊ इलेक्ट्रीशियन होम सर्विस", "Plumber in Gomti Nagar Lucknow", "इंदिरा नगर बिजली मिस्त्री", "LucknowSeva Electrician & Plumber"],
        improvementsList: ["वेबसाइट पर स्पष्ट रेट कार्ड दिखाएँ।", "पहचान सत्यापित होने पर ही मिस्त्री को सत्यापित बताएं।", "सेवा वाले इलाके स्पष्ट दिखाएँ।"],
      });
    } catch (e: any) { res.status(500).json({ error: e?.message || "वेबसाइट सुझाव तैयार करने में त्रुटि हुई।" }); }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LucknowSeva Server running on http://localhost:${PORT}`);
    console.log("Gemini API key configured:", Boolean(process.env.GEMINI_API_KEY?.trim()));
    console.log("Gemini model order:", MODELS.join(", "));
  });
}

startServer();
