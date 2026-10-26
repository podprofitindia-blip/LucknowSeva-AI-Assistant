import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

import fs from "fs";
import { promises as fsPromises } from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "lucknowseva-store.json");

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
    if (!fs.existsSync(DATA_DIR)) {
      await fsPromises.mkdir(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initial: ServerStore = {
        providers: [],
        bookings: [],
        customLocalities: [],
        auditLogs: [],
        websiteConfig: null,
        automationRules: null,
        lastSavedAt: new Date().toISOString(),
      };
      await fsPromises.writeFile(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const content = await fsPromises.readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return {
      providers: Array.isArray(parsed.providers) ? parsed.providers : [],
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      customLocalities: Array.isArray(parsed.customLocalities) ? parsed.customLocalities : [],
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
      websiteConfig: parsed.websiteConfig || null,
      automationRules: parsed.automationRules || null,
      lastSavedAt: parsed.lastSavedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.error("Error reading store:", err);
    return { providers: [], bookings: [], customLocalities: [], auditLogs: [] };
  }
}

async function writeStore(store: ServerStore): Promise<void> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fsPromises.mkdir(DATA_DIR, { recursive: true });
    }
    const toSave: ServerStore = {
      ...store,
      lastSavedAt: new Date().toISOString(),
    };
    await fsPromises.writeFile(STORE_FILE, JSON.stringify(toSave, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing store:", err);
  }
}

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "2mb" }));

  // Persistent Data Store Routes
  app.get("/api/data", async (_req, res) => {
    try {
      const store = await readStore();
      res.json(store);
    } catch (err: any) {
      res.status(500).json({ error: "डेटा लोड करने में त्रुटि", details: err?.message });
    }
  });

  // Direct Mistri (Provider) Add/Update endpoint
  app.post("/api/providers", async (req, res) => {
    try {
      const providerData = req.body;
      if (!providerData || !providerData.name || !providerData.phone) {
        res.status(400).json({ error: "मिस्त्री का नाम और फोन नंबर आवश्यक है" });
        return;
      }

      const store = await readStore();
      const existingIndex = store.providers.findIndex((p: any) => p.id === providerData.id);

      let savedProvider: any;
      if (existingIndex >= 0) {
        savedProvider = {
          ...store.providers[existingIndex],
          ...providerData,
          updatedAt: new Date().toISOString(),
        };
        store.providers[existingIndex] = savedProvider;
      } else {
        savedProvider = {
          ...providerData,
          id: providerData.id || `prov-${Date.now()}`,
          createdAt: providerData.createdAt || new Date().toISOString(),
        };
        store.providers.unshift(savedProvider);
      }

      await writeStore(store);
      res.json({ success: true, provider: savedProvider, providers: store.providers });
    } catch (err: any) {
      res.status(500).json({ error: "मिस्त्री डेटा सहेजने में त्रुटि", details: err?.message });
    }
  });

  // Direct Mistri (Provider) Delete endpoint
  app.delete("/api/providers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const store = await readStore();
      store.providers = store.providers.filter((p: any) => p.id !== id);
      await writeStore(store);
      res.json({ success: true, providers: store.providers });
    } catch (err: any) {
      res.status(500).json({ error: "मिस्त्री हटाने में त्रुटि", details: err?.message });
    }
  });

  // Direct Booking Add/Update endpoint
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = req.body;
      if (!bookingData || !bookingData.customerName || !bookingData.customerPhone) {
        res.status(400).json({ error: "ग्राहक का नाम और फोन नंबर आवश्यक है" });
        return;
      }

      const store = await readStore();
      const existingIndex = store.bookings.findIndex((b: any) => b.id === bookingData.id);

      let savedBooking: any;
      if (existingIndex >= 0) {
        savedBooking = {
          ...store.bookings[existingIndex],
          ...bookingData,
          updatedAt: new Date().toISOString(),
        };
        store.bookings[existingIndex] = savedBooking;
      } else {
        savedBooking = {
          ...bookingData,
          id: bookingData.id || `bk-${Date.now()}`,
          source: bookingData.source || 'manual',
          createdAt: bookingData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.bookings.unshift(savedBooking);
      }

      await writeStore(store);
      res.json({ success: true, booking: savedBooking, bookings: store.bookings });
    } catch (err: any) {
      res.status(500).json({ error: "बुकिंग सहेजने में त्रुटि", details: err?.message });
    }
  });

  // Dedicated Customer Website Booking Endpoint (Public Inquiry)
  app.post("/api/customer/book", async (req, res) => {
    try {
      const {
        customerName,
        customerPhone,
        locality,
        fullAddress,
        serviceType,
        issueDescription,
        preferredTimeSlot,
        preferredDate,
      } = req.body;

      // Strict validation for real customer bookings (no dummy/empty entries)
      const cleanPhone = String(customerPhone || "").replace(/\D/g, "");
      if (!customerName || String(customerName).trim().length < 2) {
        res.status(400).json({ error: "कृपया ग्राहक का मान्य नाम दर्ज करें।" });
        return;
      }
      if (cleanPhone.length < 10) {
        res.status(400).json({ error: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।" });
        return;
      }
      if (!issueDescription || String(issueDescription).trim().length < 3) {
        res.status(400).json({ error: "कृपया समस्या या कार्य का संक्षिप्त विवरण दर्ज करें।" });
        return;
      }

      const store = await readStore();
      const newBooking = {
        id: `bk-web-${Date.now()}`,
        customerName: String(customerName).trim(),
        customerPhone: cleanPhone.slice(-10),
        locality: String(locality || "लखनऊ (Lucknow)").trim(),
        fullAddress: String(fullAddress || locality || "लखनऊ").trim(),
        serviceType: serviceType === "plumber" ? "plumber" : "electrician",
        issueDescription: String(issueDescription).trim(),
        urgency: "normal",
        preferredDate: preferredDate || new Date().toISOString().slice(0, 10),
        preferredTimeSlot: preferredTimeSlot || "सुबह 10:00 - दोपहर 1:00",
        estimatedAmount: serviceType === "plumber" ? 199 : 149,
        status: "pending",
        source: "website",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.bookings.unshift(newBooking);

      // Add audit log entry for transparency
      const auditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("hi-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        actionTitleHi: "वेबसाइट से नई वास्तविक ग्राहक बुकिंग प्राप्त हुई",
        detailHi: `ग्राहक ${newBooking.customerName} (${newBooking.locality}) ने वेबसाइट से ${
          newBooking.serviceType === "electrician" ? "इलेक्ट्रीशियन" : "प्लंबर"
        } सेवा बुक की।`,
        confirmedByOwner: true,
        category: "booking",
      };
      store.auditLogs.unshift(auditLog);

      await writeStore(store);

      res.json({
        success: true,
        booking: newBooking,
        bookingsCount: store.bookings.length,
        message: "धन्यवाद! आपका बुकिंग अनुरोध लखनऊ सेवा में सफलतापूर्वक दर्ज हो गया है।",
      });
    } catch (err: any) {
      res.status(500).json({ error: "वेबसाइट बुकिंग दर्ज करने में त्रुटि", details: err?.message });
    }
  });

  // Comprehensive Data Sync Endpoint
  app.post("/api/data/sync", async (req, res) => {
    try {
      const { providers, bookings, customLocalities, auditLogs, websiteConfig, automationRules } = req.body;
      const current = await readStore();
      const updated: ServerStore = {
        providers: Array.isArray(providers) ? providers : current.providers,
        bookings: Array.isArray(bookings) ? bookings : current.bookings,
        customLocalities: Array.isArray(customLocalities) ? customLocalities : current.customLocalities,
        auditLogs: Array.isArray(auditLogs) ? auditLogs : current.auditLogs,
        websiteConfig: websiteConfig !== undefined ? websiteConfig : current.websiteConfig,
        automationRules: automationRules !== undefined ? automationRules : current.automationRules,
      };
      await writeStore(updated);
      res.json({ success: true, count: updated.providers.length, lastSavedAt: updated.lastSavedAt });
    } catch (err: any) {
      res.status(500).json({ error: "डेटा सिंक करने में त्रुटि", details: err?.message });
    }
  });

  // AI Business Chat Assistant Route
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history = [], businessSnapshot } = req.body;
      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "संदेश आवश्यक है (Message is required)" });
        return;
      }

      const ai = getGenAIClient();
      const systemInstruction = `आप 'लखनऊ सेवा (LucknowSeva)' के आधिकारिक AI बिज़नेस सहायक (AI Business Assistant) हैं।
लखनऊ सेवा लखनऊ (उत्तर प्रदेश) में इलेक्ट्रीशियन और प्लंबर की घरेलू सेवाएं प्रदान करने वाला व्यवसाय है।
हमेशा सरल, स्पष्ट और सम्मानजनक हिंदी (देवनागरी) में उत्तर दें जो Android मोबाइल स्क्रीन पर आसानी से पढ़ा जा सके।

महत्वपूर्ण नियम (Strict Honesty & Safety Rules):
1. कभी भी नकली (Fake) मिस्त्री या नकली ग्राहक बुकिंग डेटा को वास्तविक बताकर प्रस्तुत न करें। नीचे दिए गए वास्तविक व्यवसाय डेटा (Real Business Snapshot) का ही उपयोग करें।
2. यदि डेटा शून्य (0 मिस्त्री या 0 बुकिंग) है, तो ईमानदारी से बताएं कि अभी कोई बुकिंग दर्ज नहीं है।
3. ग्राहक वेबसाइट से प्राप्त वास्तविक बुकिंग को पहचानें और उसके आधार पर उपयुक्त पंजीकृत मिस्त्री का सुझाव दें।
4. यदि आप ग्राहक या मिस्त्री को भेजने के लिए कोई व्हाट्सएप/SMS संदेश या वेबसाइट बदलाव सुझाते हैं, तो स्पष्ट रूप से लिखें कि इसे भेजने या लागू करने से पहले मालिक की पुष्टि (Confirmation) आवश्यक है।
5. मालिक की स्पष्ट पुष्टि के बिना वेबसाइट के ड्राफ्ट को कभी भी प्रकाशित (Publish) न करें।

वर्तमान वास्तविक व्यवसाय स्थिति (Current Real Business Snapshot):
${JSON.stringify(businessSnapshot || {}, null, 2)}

अपने उत्तर को संक्षिप्त बुलेट पॉइंट्स में रखें और यदि उपयोगकर्ता कोई ग्राहक संदेश या कार्य योजना मांगता है, तो तुरंत उपयोग करने योग्य हिंदी टेम्पलेट भी दें।`;

      if (!ai) {
        console.error("Gemini API unavailable: GEMINI_API_KEY is missing or empty.");
        res.status(503).json({
          reply: "Gemini AI अभी चालू नहीं है: Render में GEMINI_API_KEY मौजूद नहीं है या खाली है। Environment Variable जाँचें और फिर सर्वर को redeploy करें।",
          source: "gemini-error",
        });
        return;
      }

      try {
        const safeHistory = Array.isArray(history)
          ? history
              .filter(
                (msg: any) =>
                  msg &&
                  (msg.role === "user" || msg.role === "assistant") &&
                  typeof msg.text === "string"
              )
              .slice(-6)
          : [];

        const formattedContents = [
          ...safeHistory.map((msg: { role: string; text: string }) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.text }],
          })),
          {
            role: "user",
            parts: [{ text: message }],
          },
        ];

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: formattedContents,
          config: { systemInstruction },
        });

        const replyText = response.text?.trim();
        if (!replyText) {
          console.error("Gemini API returned an empty response.");
          res.status(502).json({
            reply: "Gemini API से खाली जवाब मिला। कृपया कुछ देर बाद दोबारा कोशिश करें।",
            source: "gemini-error",
          });
          return;
        }

        res.json({ reply: replyText, source: "gemini" });
        return;
      } catch (apiError: any) {
        const status = apiError?.status || apiError?.statusCode || "unknown";
        const errorMessage = String(apiError?.message || "Unknown Gemini API error");
        // Never log or return the API key.
        console.error("Gemini API request failed:", { status, message: errorMessage });

        let userMessage = "Gemini API से जवाब नहीं मिला। Render के Logs में ‘Gemini API request failed’ वाली पंक्ति देखें।";
        if (status === 401 || status === 403 || /api.?key|unauthorized|permission/i.test(errorMessage)) {
          userMessage = "Gemini API ने API Key या अनुमति से जुड़ी त्रुटि दी। Render में GEMINI_API_KEY की वैल्यू जाँचें; पूरी Key किसी के साथ साझा न करें।";
        } else if (status === 429 || /quota|rate.?limit|resource exhausted/i.test(errorMessage)) {
          userMessage = "Gemini API की उपयोग सीमा (quota/rate limit) पूरी हो गई है। Google AI Studio में API usage और quota जाँचें।";
        } else if (status === 404 || /not found|model/i.test(errorMessage)) {
          userMessage = "Gemini मॉडल या API endpoint उपलब्ध नहीं है। Render Logs में पूरी त्रुटि देखें।";
        }

        res.status(502).json({ reply: userMessage, source: "gemini-error" });
        return;
      }
    } catch (err: any) {
      console.error("AI chat route failed:", err?.message || err);
      res.status(500).json({
        reply: "AI चैट सर्वर में त्रुटि हुई। Render Logs में नवीनतम त्रुटि देखें।",
        source: "server-error",
      });
    }
  });

  // AI Website Improvement Assistant Route
  app.post("/api/ai/website-improve", async (req, res) => {
    try {
      const { currentConfig, customGoal } = req.body;
      const ai = getGenAIClient();

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: `लखनऊ सेवा (LucknowSeva) की वर्तमान वेबसाइट सेटिंग्स:
${JSON.stringify(currentConfig, null, 2)}
मालिक का विशेष लक्ष्य: ${customGoal || "अधिक स्थानीय ग्राहक बुकिंग और भरोसा बढ़ाना"}

कृपया वेबसाइट को बेहतर बनाने के लिए हिंदी में ठोस सुधार सुझाएं।`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  suggestedHeadline: {
                    type: Type.STRING,
                    description: "Improved Hindi headline for LucknowSeva website",
                  },
                  suggestedSubheadline: {
                    type: Type.STRING,
                    description: "Improved Hindi subheadline highlighting trust and fast service in Lucknow",
                  },
                  suggestedAnnouncement: {
                    type: Type.STRING,
                    description: "Short urgent banner text in Hindi",
                  },
                  seoKeywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "4-6 local SEO keywords in Hindi/Hinglish for Lucknow",
                  },
                  improvementsList: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3-4 actionable website improvement recommendations in Hindi",
                  },
                },
                required: [
                  "suggestedHeadline",
                  "suggestedSubheadline",
                  "suggestedAnnouncement",
                  "seoKeywords",
                  "improvementsList",
                ],
              },
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            res.json(parsed);
            return;
          }
        } catch (apiErr: any) {
          console.error("Gemini website improve request failed:", apiErr?.message || apiErr);
          if (apiErr?.status) console.error("Gemini website improve HTTP status:", apiErr.status);
        }
      }

      res.json({
        suggestedHeadline: "लखनऊ में घर बैठे भरोसेमंद इलेक्ट्रीशियन और प्लंबर बुलाएं — 45 मिनट में तेज़ सेवा",
        suggestedSubheadline:
          "गोमती नगर, इंदिरा नगर, अलीगंज, हज़रतगंज और पूरे लखनऊ में सत्यापित मिस्त्री • काम शुरू होने से पहले स्पष्ट शुल्क जानकारी",
        suggestedAnnouncement: "आपातकालीन बिजली और प्लंबिंग रिपेयर के लिए सुबह 7 बजे से रात 10 बजे तक सेवा उपलब्ध",
        seoKeywords: [
          "लखनऊ इलेक्ट्रीशियन होम सर्विस",
          "Plumber in Gomti Nagar Lucknow",
          "इंदिरा नगर बिजली मिस्त्री नंबर",
          "LucknowSeva Electrician & Plumber",
          "अलीगंज हज़रतगंज प्लंबर रिपेयर",
        ],
        improvementsList: [
          "ग्राहकों का भरोसा बढ़ाने के लिए वेबसाइट के सबसे ऊपर 'काम से पहले पक्का रेट कार्ड' और 'सत्यापित पहचान पत्र वाले मिस्त्री' लिखें।",
          "व्हाट्सएप बुकिंग बटन के साथ '1 क्लिक में फोटो भेजकर समस्या बताएं' विकल्प जोड़ें जिससे ग्राहक तुरंत संपर्क करें।",
          "गोमती नगर, इंदिरा नगर, आलमबाग और अलीगंज जैसे प्रमुख इलाकों के नाम स्पष्ट दिखाएं ताकि स्थानीय ग्राहक तुरंत जुड़ाव महसूस करें।",
        ],
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || "वेबसाइट सुझाव तैयार करने में त्रुटि हुई।",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LucknowSeva Server running on http://localhost:${PORT}`);
  });
}

startServer();
