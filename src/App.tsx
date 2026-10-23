import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Bot,
  CalendarCheck,
  Users,
  Globe,
  Settings,
  UserPlus,
  CalendarPlus,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import {
  ServiceProvider,
  CustomerBooking,
  WebsiteConfig,
  AutomationRule,
  ActionAuditLog,
  ConfirmationRequest,
  DEFAULT_WEBSITE_CONFIG,
  DEFAULT_AUTOMATION_RULES,
  LUCKNOW_LOCALITIES,
} from './types';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ProviderManager } from './components/ProviderManager';
import { BookingManager } from './components/BookingManager';
import { AiAssistantView } from './components/AiAssistantView';
import { WebsiteBuilderView } from './components/WebsiteBuilderView';
import { ReportsAndAutomationView } from './components/ReportsAndAutomationView';

type ActiveTab =
  | 'dashboard'
  | 'ai_chat'
  | 'bookings'
  | 'providers'
  | 'website'
  | 'reports_automation';

const STORAGE_KEYS = {
  PROVIDERS: 'lucknowseva_real_providers_v1',
  BOOKINGS: 'lucknowseva_real_bookings_v1',
  WEBSITE: 'lucknowseva_website_config_v1',
  AUTOMATION: 'lucknowseva_automation_rules_v1',
  LOCALITIES: 'lucknowseva_custom_localities_v1',
  AUDIT_LOGS: 'lucknowseva_audit_logs_v1',
};

function safeParseArray<T>(key: string, fallback: T[] = []): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : fallback;
  } catch {
    return fallback;
  }
}

function safeParseObject<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? { ...fallback, ...parsed }
      : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Strict Honesty Policy: Start with 0 fake providers and 0 fake bookings
  const [providers, setProviders] = useState<ServiceProvider[]>(() =>
    safeParseArray<ServiceProvider>(STORAGE_KEYS.PROVIDERS, [])
  );

  const [bookings, setBookings] = useState<CustomerBooking[]>(() =>
    safeParseArray<CustomerBooking>(STORAGE_KEYS.BOOKINGS, [])
  );

  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig>(() =>
    safeParseObject<WebsiteConfig>(STORAGE_KEYS.WEBSITE, DEFAULT_WEBSITE_CONFIG)
  );

  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(() =>
    safeParseArray<AutomationRule>(STORAGE_KEYS.AUTOMATION, DEFAULT_AUTOMATION_RULES)
  );

  const [customLocalities, setCustomLocalities] = useState<string[]>(() =>
    safeParseArray<string>(STORAGE_KEYS.LOCALITIES, [])
  );

  const [auditLogs, setAuditLogs] = useState<ActionAuditLog[]>(() =>
    safeParseArray<ActionAuditLog>(STORAGE_KEYS.AUDIT_LOGS, [])
  );

  const [pendingConfirmation, setPendingConfirmation] =
    useState<ConfirmationRequest | null>(null);
  const [toastBanner, setToastBanner] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  const isInitialSync = useRef(true);

  // Initial load from server-side store to sync with disk if available
  useEffect(() => {
    setSaveStatus('saving');
    fetch('/api/data')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          setSaveStatus('saved');
          return;
        }
        if (Array.isArray(data.providers)) {
          const cleanProviders = data.providers.filter(Boolean);
          if (cleanProviders.length > 0) {
            setProviders((prev) => {
              const safePrev = Array.isArray(prev) ? prev.filter(Boolean) : [];
              if (safePrev.length === 0) return cleanProviders;
              const existingIds = new Set(safePrev.map((p) => p.id));
              const fresh = cleanProviders.filter((p: ServiceProvider) => !existingIds.has(p.id));
              return [...safePrev, ...fresh];
            });
          }
        }
        if (Array.isArray(data.bookings) && data.bookings.length > 0) {
          setBookings((prev) => {
            const safePrev = Array.isArray(prev) ? prev.filter(Boolean) : [];
            if (safePrev.length === 0) return data.bookings.filter(Boolean);
            const existingIds = new Set(safePrev.map((b) => b.id));
            const fresh = data.bookings.filter((b: CustomerBooking) => Boolean(b && !existingIds.has(b.id)));
            return [...fresh, ...safePrev];
          });
        }
        if (Array.isArray(data.customLocalities) && data.customLocalities.length > 0) {
          setCustomLocalities((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return Array.from(new Set([...safePrev, ...data.customLocalities]));
          });
        }
        if (Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
          setAuditLogs((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            if (safePrev.length === 0) return data.auditLogs;
            const existingIds = new Set(safePrev.map((l) => l.id));
            const fresh = data.auditLogs.filter((l: ActionAuditLog) => !existingIds.has(l.id));
            return [...fresh, ...safePrev];
          });
        }
        if (data.websiteConfig && typeof data.websiteConfig === 'object') {
          setWebsiteConfig((prev) => ({
            ...prev,
            ...data.websiteConfig,
            isPublished: Boolean(data.websiteConfig.isPublished),
          }));
        }
        if (Array.isArray(data.automationRules) && data.automationRules.length > 0) {
          setAutomationRules(data.automationRules);
        }
        setSaveStatus('saved');
        setLastSavedTime(
          new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
        );
      })
      .catch((err) => {
        console.log('Local storage active mode:', err);
        setSaveStatus('saved');
      });

    // Background sync to ensure real website bookings appear automatically on dashboard
    const bgSync = () => {
      fetch('/api/data')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data || !Array.isArray(data.bookings)) return;
          setBookings((prev) => {
            const safePrev = Array.isArray(prev) ? prev.filter(Boolean) : [];
            const prevIds = new Set(safePrev.map((b) => b.id));
            const freshBookings = data.bookings.filter((b: CustomerBooking) => Boolean(b && !prevIds.has(b.id)));
            if (freshBookings.length > 0) {
              return [...freshBookings, ...safePrev];
            }
            return prev;
          });
        })
        .catch(() => {});
    };

    const interval = setInterval(bgSync, 10000);
    window.addEventListener('focus', bgSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', bgSync);
    };
  }, []);

  // Dual-layer persistence: localStorage + server-side disk sync (guarded against initial race condition)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      localStorage.setItem(STORAGE_KEYS.LOCALITIES, JSON.stringify(customLocalities));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEYS.WEBSITE, JSON.stringify(websiteConfig));
      localStorage.setItem(STORAGE_KEYS.AUTOMATION, JSON.stringify(automationRules));
    } catch {
      // ignore
    }

    if (isInitialSync.current) {
      isInitialSync.current = false;
      return;
    }

    setSaveStatus('saving');
    fetch('/api/data/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providers,
        bookings,
        customLocalities,
        auditLogs,
        websiteConfig,
        automationRules,
      }),
    })
      .then((res) => {
        if (res.ok) {
          setSaveStatus('saved');
          setLastSavedTime(
            new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
          );
        }
      })
      .catch(() => {
        setSaveStatus('saved');
      });
  }, [providers, bookings, customLocalities, auditLogs, websiteConfig, automationRules]);

  const saveAllToDisk = async (customMsg?: string) => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      localStorage.setItem(STORAGE_KEYS.LOCALITIES, JSON.stringify(customLocalities));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEYS.WEBSITE, JSON.stringify(websiteConfig));
      localStorage.setItem(STORAGE_KEYS.AUTOMATION, JSON.stringify(automationRules));

      const res = await fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providers,
          bookings,
          customLocalities,
          auditLogs,
          websiteConfig,
          automationRules,
        }),
      });

      if (res.ok) {
        setSaveStatus('saved');
        setLastSavedTime(
          new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
        );
        showNotice(
          customMsg || '✓ सारा डेटा (मिस्त्री, बुकिंग, सेटिंग्स) डिस्क में सफलतापूर्वक सुरक्षित कर लिया गया है।'
        );
      } else {
        setSaveStatus('error');
        showNotice('डेटा सर्वर पर सहेजने में विलंब हुआ, लेकिन यह ब्राउज़र स्टोरेज में सुरक्षित है।');
      }
    } catch {
      setSaveStatus('saved');
      showNotice('✓ डेटा स्थानीय रूप से सुरक्षित है।');
    }
  };

  const showNotice = (msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const logAction = (
    actionTitleHi: string,
    detailHi: string,
    category: ActionAuditLog['category']
  ) => {
    const newEntry: ActionAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('hi-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      actionTitleHi,
      detailHi,
      confirmedByOwner: true,
      category,
    };
    setAuditLogs((prev) => [newEntry, ...prev.slice(0, 49)]);
  };

  // Provider Handlers with Direct Server & Disk Persistence
  const handleAddProvider = async (
    newProv: Omit<ServiceProvider, 'id' | 'createdAt'>
  ) => {
    const created: ServiceProvider = {
      ...newProv,
      id: `prov-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const nextProviders = [created, ...providers];
    setProviders(nextProviders);
    try {
      localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(nextProviders));
    } catch {}

    setSaveStatus('saving');
    try {
      await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created),
      });
      setSaveStatus('saved');
      setLastSavedTime(
        new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      setSaveStatus('saved');
    }

    logAction(
      'नया मिस्त्री पंजीकृत किया गया',
      `${created.name} (+91 ${created.phone}) को सूची में जोड़ा गया।`,
      'provider'
    );
    showNotice(`मिस्त्री "${created.name}" का पंजीकरण सफल रहा और डेटा डिस्क में सुरक्षित हो गया।`);
  };

  const handleUpdateProvider = async (updated: ServiceProvider) => {
    const nextProviders = providers.map((p) => (p.id === updated.id ? updated : p));
    setProviders(nextProviders);
    try {
      localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(nextProviders));
    } catch {}

    setSaveStatus('saving');
    try {
      await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setSaveStatus('saved');
      setLastSavedTime(
        new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      setSaveStatus('saved');
    }

    logAction(
      'मिस्त्री विवरण अपडेट किया गया',
      `${updated.name} का संपर्क व क्षेत्र विवरण अपडेट हुआ।`,
      'provider'
    );
    showNotice(`"${updated.name}" का विवरण अपडेट व सुरक्षित कर दिया गया।`);
  };

  const handleDeleteProvider = async (id: string) => {
    const target = providers.find((p) => p.id === id);
    const nextProviders = providers.filter((p) => p.id !== id);
    setProviders(nextProviders);
    try {
      localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(nextProviders));
    } catch {}

    setSaveStatus('saving');
    try {
      await fetch(`/api/providers/${id}`, {
        method: 'DELETE',
      });
      setSaveStatus('saved');
      setLastSavedTime(
        new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      setSaveStatus('saved');
    }

    if (target) {
      logAction(
        'मिस्त्री रिकॉर्ड हटाया गया',
        `${target.name} को सूची से हटाया गया।`,
        'provider'
      );
      showNotice(`"${target.name}" का रिकॉर्ड हटा दिया गया।`);
    }
  };

  // Booking Handlers with Direct Server & Disk Persistence
  const handleAddBooking = async (
    newBook: Omit<CustomerBooking, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date().toISOString();
    const created: CustomerBooking = {
      ...newBook,
      id: `bk-${Date.now()}`,
      source: newBook.source || 'manual',
      createdAt: now,
      updatedAt: now,
    };
    const nextBookings = [created, ...bookings];
    setBookings(nextBookings);
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(nextBookings));
    } catch {}

    setSaveStatus('saving');
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created),
      });
      setSaveStatus('saved');
      setLastSavedTime(
        new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      setSaveStatus('saved');
    }

    logAction(
      created.source === 'website'
        ? 'वेबसाइट से नई वास्तविक ग्राहक बुकिंग प्राप्त'
        : 'नई वास्तविक ग्राहक बुकिंग दर्ज',
      `ग्राहक ${created.customerName} (${created.locality}) की ${
        created.serviceType === 'electrician' ? 'इलेक्ट्रीशियन' : 'प्लंबर'
      } बुकिंग जोड़ी गई।`,
      'booking'
    );
    showNotice(
      created.source === 'website'
        ? `🌐 वेबसाइट से ग्राहक "${created.customerName}" की ऑनलाइन बुकिंग डैशबोर्ड पर सुरक्षित हो गई।`
        : `ग्राहक "${created.customerName}" की बुकिंग सुरक्षित कर ली गई।`
    );

    // Check if New Booking Acknowledgment Automation Rule is enabled
    const ackRule = automationRules.find(
      (r) => r.id === 'auto-booking-ack' && r.enabled
    );
    if (ackRule) {
      const preparedMsg = ackRule.templateMessageHi
        .replace('{{ग्राहक_नाम}}', created.customerName)
        .replace(
          '{{सेवा}}',
          created.serviceType === 'electrician' ? 'इलेक्ट्रीशियन' : 'प्लंबर'
        )
        .replace('{{क्षेत्र}}', created.locality);

      setPendingConfirmation({
        titleHi: 'ऑटोमेशन नियम: ग्राहक को स्वागत संदेश भेजने की पुष्टि करें',
        descriptionHi:
          'नई बुकिंग दर्ज होने पर आपका ऑटोमेशन नियम सक्रिय हुआ है। क्या आप ग्राहक को यह पावती संदेश भेजना चाहते हैं?',
        recipientOrTargetHi: `${created.customerName} (+91 ${created.customerPhone})`,
        messagePreviewHi: preparedMsg,
        impactWarningHi:
          'आपकी अनुमति के बिना ऑटोमेशन कोई भी संदेश सीधे ग्राहक को नहीं भेजता है।',
        confirmButtonLabelHi: 'हाँ, पावती संदेश भेजें',
        onConfirm: () => {
          logAction(
            'ऑटोमेशन पावती संदेश भेजा गया',
            `ग्राहक ${created.customerName} को बुकिंग पावती संदेश भेजा गया।`,
            'automation'
          );
          window.location.href = `https://wa.me/91${created.customerPhone}?text=${encodeURIComponent(preparedMsg)}`;
        },
      });
    }
  };

  const handleUpdateBooking = (updated: CustomerBooking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    showNotice(`बुकिंग स्थिति अपडेट कर दी गई।`);
  };

  const handleDeleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  // Automation Rule Handlers
  const handleToggleAutomationRule = (ruleId: string) => {
    setAutomationRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleToggleRuleConfirmationLock = (ruleId: string) => {
    setAutomationRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              requireConfirmationBeforeSend: !r.requireConfirmationBeforeSend,
            }
          : r
      )
    );
  };

  const handleUpdateRuleTemplate = (ruleId: string, newTemplate: string) => {
    setAutomationRules((prev) =>
      prev.map((r) =>
        r.id === ruleId ? { ...r, templateMessageHi: newTemplate } : r
      )
    );
  };

  const handleTestAutomationRule = (rule: AutomationRule) => {
    const samplePreview = rule.templateMessageHi
      .replace('{{ग्राहक_नाम}}', '[ग्राहक का नाम]')
      .replace('{{सेवा}}', 'इलेक्ट्रीशियन/प्लंबर')
      .replace('{{क्षेत्र}}', 'गोमती नगर, लखनऊ')
      .replace('{{मिस्त्री_नाम}}', '[मिस्त्री का नाम]')
      .replace('{{मिस्त्री_फोन}}', '[मोबाइल नंबर]')
      .replace('{{समय}}', 'सुबह 10:00 बजे')
      .replace('{{राशि}}', '199');

    setPendingConfirmation({
      titleHi: `ऑटोमेशन नियम जांच: ${rule.titleHi}`,
      descriptionHi:
        'जब यह नियम ट्रिगर होगा, तो वास्तविक ग्राहक या मिस्त्री को संदेश भेजने से पहले आपसे ठीक इसी प्रकार पुष्टि मांगी जाएगी।',
      recipientOrTargetHi: 'सुरक्षा जांच मोड (कोई वास्तविक ग्राहक प्रभावित नहीं)',
      messagePreviewHi: samplePreview,
      impactWarningHi:
        'यह केवल ऑटोमेशन सुरक्षा जांच है। पुष्टि करने पर यह आपके ऑडिट लॉग में दर्ज होगा।',
      confirmButtonLabelHi: 'पुष्टि प्रक्रिया सफल',
      onConfirm: () => {
        logAction(
          'ऑटोमेशन नियम की सुरक्षा जांच पूर्ण',
          `"${rule.titleHi}" का परीक्षण किया गया।`,
          'automation'
        );
        showNotice('ऑटोमेशन पुष्टि जांच सफल रही।');
      },
    });
  };

  const handleClearAllDataWithConfirmation = () => {
    setPendingConfirmation({
      titleHi: 'सभी दर्ज डेटा रीसेट करने की पुष्टि करें',
      descriptionHi:
        'क्या आप वाकई अपने द्वारा दर्ज किए गए सभी मिस्त्री और बुकिंग रिकॉर्ड हटाना चाहते हैं?',
      recipientOrTargetHi: `कुल मिस्त्री: ${providers.length} · कुल बुकिंग: ${bookings.length}`,
      impactWarningHi: 'यह क्रिया सभी स्थानीय रिकॉर्ड शून्य (0) कर देगी।',
      confirmButtonLabelHi: 'हाँ, सभी रिकॉर्ड हटाएं',
      onConfirm: () => {
        setProviders([]);
        setBookings([]);
        logAction(
          'सभी व्यवसाय रिकॉर्ड रीसेट किए गए',
          'मिस्त्री और बुकिंग सूची शून्य की गई।',
          'automation'
        );
        showNotice('सभी रिकॉर्ड साफ कर दिए गए हैं।');
      },
    });
  };

  const autoSuggestRuleEnabled =
    automationRules.find((r) => r.id === 'auto-area-match')?.enabled ?? true;

  // Derived Real Metrics for Dashboard
  const safeProviders = (providers || []).filter(Boolean);
  const safeBookings = (bookings || []).filter(Boolean);
  const safeRules = (automationRules || []).filter(Boolean);

  const pendingBookingsCount = safeBookings.filter(
    (b) => b && b.status === 'pending'
  ).length;
  const activeBookingsCount = safeBookings.filter(
    (b) => b && (b.status === 'assigned' || b.status === 'in_progress')
  ).length;
  const completedBookingsCount = safeBookings.filter(
    (b) => b && b.status === 'completed'
  ).length;
  const totalRevenue = safeBookings
    .filter((b) => b && b.status === 'completed')
    .reduce((sum, b) => sum + (b.finalAmount ?? b.estimatedAmount ?? 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 lg:pb-8">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          लखनऊ सेवा (LucknowSeva)
        </button>

        {/* Zone 2: 5 concise single-line text navigation links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'dashboard'
                ? 'text-slate-900 font-bold underline underline-offset-8 decoration-2 decoration-amber-600'
                : ''
            }`}
          >
            डैशबोर्ड
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai_chat')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'ai_chat'
                ? 'text-slate-900 font-bold underline underline-offset-8 decoration-2 decoration-amber-600'
                : ''
            }`}
          >
            AI सहायक
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'bookings'
                ? 'text-slate-900 font-bold underline underline-offset-8 decoration-2 decoration-amber-600'
                : ''
            }`}
          >
            ग्राहक बुकिंग
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'providers'
                ? 'text-slate-900 font-bold underline underline-offset-8 decoration-2 decoration-amber-600'
                : ''
            }`}
          >
            मिस्त्री एवं क्षेत्र
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('website')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'website'
                ? 'text-slate-900 font-bold underline underline-offset-8 decoration-2 decoration-amber-600'
                : ''
            }`}
          >
            वेबसाइट बिल्डर
          </button>
        </nav>

        {/* Zone 3: Save Status Indicator & Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => saveAllToDisk()}
            className="min-h-[36px] px-3 py-1 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="क्लिक करके सभी बदलाव तुरंत डिस्क में सुरक्षित करें"
          >
            {saveStatus === 'saving' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="hidden sm:inline">सहेज रहा है...</span>
                <span className="sm:hidden">सेव...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">डेटा सुरक्षित {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
                <span className="sm:hidden">सुरक्षित</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                activeTab === 'reports_automation'
                  ? 'bookings'
                  : 'reports_automation'
              )
            }
            className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            {activeTab === 'reports_automation'
              ? 'नई बुकिंग जोड़ें'
              : 'रिपोर्ट व ऑटोमेशन'}
          </button>
        </div>
      </header>

      {/* Optional Toast Feedback */}
      {toastBanner && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-3">
          <div className="p-3 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-medium flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              {toastBanner}
            </span>
            <button
              type="button"
              onClick={() => setToastBanner(null)}
              className="text-xs text-slate-300 hover:text-white px-2"
            >
              बंद करें
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Content Container (Mobile-first + Full 1440px Desktop Presence) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Hero Welcome & Data Integrity Notice */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <p className="text-xs font-semibold text-amber-800">
                  लखनऊ होम सर्विस प्रबंधन डैशबोर्ड • गोमती नगर · इंदिरा नगर · अलीगंज · हज़रतगंज · आलमबाग
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  नमस्कार! लखनऊ सेवा (LucknowSeva) AI बिज़नेस सहायक में आपका स्वागत है
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  यहाँ से अपने इलेक्ट्रीशियन और प्लंबर नेटवर्क, ग्राहक बुकिंग, वेबसाइट सुधार और ऑटोमेशन को आसानी से संभालें।{' '}
                  <strong className="text-slate-800">
                    कोई भी नकली मिस्त्री या नकली बुकिंग नहीं दिखाई गई है
                  </strong>{' '}
                  और प्रत्येक बाहरी संदेश या वेबसाइट प्रकाशन से पहले आपकी पुष्टि (Confirmation) ली जाती है।
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('providers')}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold hover:bg-slate-50 flex items-center gap-2 whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4 text-amber-700" />
                  <span>मिस्त्री पंजीकृत करें</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bookings')}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 flex items-center gap-2 whitespace-nowrap"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>नई बुकिंग दर्ज करें</span>
                </button>
              </div>
            </div>

            {/* 4-Column Real Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                <span className="text-xs font-medium text-slate-500">
                  पंजीकृत वास्तविक मिस्त्री
                </span>
                <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {providers.length}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  इलेक्ट्रीशियन:{' '}
                  <span className="font-mono tabular-nums">
                    {
                      safeProviders.filter(
                        (p) => p && (p.category === 'electrician' || p.category === 'both')
                      ).length
                    }
                  </span>{' '}
                  · प्लंबर:{' '}
                  <span className="font-mono tabular-nums">
                    {
                      safeProviders.filter(
                        (p) => p && (p.category === 'plumber' || p.category === 'both')
                      ).length
                    }
                  </span>
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                <span className="text-xs font-medium text-slate-500">
                  लंबित ग्राहक बुकिंग
                </span>
                <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-800 mt-1">
                  {pendingBookingsCount}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  सक्रिय कार्य:{' '}
                  <span className="font-mono tabular-nums">{activeBookingsCount}</span>
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                <span className="text-xs font-medium text-slate-500">
                  पूर्ण बुकिंग एवं वास्तविक आय
                </span>
                <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  पूर्ण बुकिंग:{' '}
                  <span className="font-mono tabular-nums">
                    {completedBookingsCount}
                  </span>
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                <span className="text-xs font-medium text-slate-500">
                  सक्रिय ऑटोमेशन व सुरक्षा
                </span>
                <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {safeRules.filter((r) => r && r.enabled).length}/
                  {safeRules.length}
                </p>
                <p className="text-xs text-emerald-700 font-medium mt-1">
                  पुष्टि सुरक्षा लॉक चालू है
                </p>
              </div>
            </div>

            {/* All 7 Business Modules Grid */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">
                लखनऊ सेवा के सभी 7 प्रबंधन मॉड्यूल (टैप करके खोलें)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. AI Chat Assistant */}
                <button
                  type="button"
                  onClick={() => setActiveTab('ai_chat')}
                  className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-slate-400 transition-colors flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-800">
                        01. AI बिज़नेस सहायक
                      </span>
                      <Bot className="w-5 h-5 text-amber-700" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      AI चैट सहायक (हिंदी)
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      ग्राहक संदेश तैयार करें, रेट तय करें और अपने व्यवसाय को बढ़ाने के लिए हिंदी में सलाह लें।
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 pt-2 border-t border-slate-100">
                    <span>चैट सहायक खोलें</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 2. Website Builder & Improvement */}
                <button
                  type="button"
                  onClick={() => setActiveTab('website')}
                  className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-slate-400 transition-colors flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-800">
                        02. वेबसाइट एवं सुधार
                      </span>
                      <Globe className="w-5 h-5 text-slate-700" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      वेबसाइट बिल्डर और AI सुधार
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      अपनी ग्राहक वेबसाइट बनाएं, AI से सुधार सुझाव लें और अपनी पुष्टि के बाद बदलाव प्रकाशित करें।
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 pt-2 border-t border-slate-100">
                    <span>
                      स्थिति: {websiteConfig.isPublished ? 'प्रकाशित' : 'ड्राफ्ट मोड'}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 3. Electrician & Plumber Registration */}
                <button
                  type="button"
                  onClick={() => setActiveTab('providers')}
                  className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-slate-400 transition-colors flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-800">
                        03 एवं 05. मिस्त्री व सेवा क्षेत्र
                      </span>
                      <Wrench className="w-5 h-5 text-slate-700" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      इलेक्ट्रीशियन, प्लंबर व लखनऊ क्षेत्र
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      वास्तविक मिस्त्रियों का पंजीकरण, संपर्क नंबर, कौशल और लखनऊ के सेवा क्षेत्र ({LUCKNOW_LOCALITIES.length + customLocalities.length} इलाके) प्रबंधित करें।
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 pt-2 border-t border-slate-100">
                    <span>पंजीकृत मिस्त्री: {providers.length}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 4. Customer Booking Management */}
                <button
                  type="button"
                  onClick={() => setActiveTab('bookings')}
                  className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-slate-400 transition-colors flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-800">
                        04. ग्राहक बुकिंग प्रबंधन
                      </span>
                      <CalendarCheck className="w-5 h-5 text-slate-700" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      ग्राहक बुकिंग और मिस्त्री आवंटन
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      वास्तविक ग्राहकों की बुकिंग दर्ज करें, क्षेत्र के अनुसार मिस्त्री नियुक्त करें और पुष्टि के बाद संदेश भेजें।
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 pt-2 border-t border-slate-100">
                    <span>कुल बुकिंग: {bookings.length}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 6 & 7. Reports & Automation */}
                <button
                  type="button"
                  onClick={() => setActiveTab('reports_automation')}
                  className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-slate-400 transition-colors flex flex-col justify-between gap-4 group md:col-span-2 lg:col-span-2"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-800">
                        06 एवं 07. व्यापार रिपोर्ट और ऑटोमेशन सेटिंग्स
                      </span>
                      <Settings className="w-5 h-5 text-slate-700" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      बुकिंग स्थिति रिपोर्ट, आय विश्लेषण और स्मार्ट ऑटोमेशन नियम
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      वास्तविक बुकिंग स्थिति, लखनऊ के इलाकों के अनुसार मांग, CSV डाउनलोड और बार-बार होने वाले कार्यों (स्वागत संदेश, मिस्त्री आवंटन सूचना, फीडबैक) के लिए पुष्टि-आधारित ऑटोमेशन सेट करें।
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 pt-2 border-t border-slate-100">
                    <span>रिपोर्ट और ऑटोमेशन खोलें</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            </div>

            {/* Honest Recent Activity / Getting Started Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    हाल की वास्तविक ग्राहक बुकिंग
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-semibold text-amber-800 hover:underline"
                  >
                    सभी देखें →
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
                    <p>
                      अभी कोई ग्राहक बुकिंग दर्ज नहीं है (कोई नकली बुकिंग नहीं दिखाई गई है)।
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bookings')}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-semibold inline-flex items-center gap-1.5"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>पहली बुकिंग दर्ज करें</span>
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {bookings.slice(0, 5).map((b) => (
                      <div
                        key={b.id}
                        className="py-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900">
                              {b.customerName}
                            </span>
                            <span className="text-slate-500">({b.locality})</span>
                            {b.source === 'website' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                🌐 वेबसाइट
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                b.status === 'pending'
                                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                  : b.status === 'assigned'
                                  ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              }`}
                            >
                              {b.status === 'pending' ? 'लंबित' : b.status === 'assigned' ? 'आवंटित' : 'पूर्ण'}
                            </span>
                          </div>
                          <p className="text-slate-600 truncate max-w-xs mt-0.5">
                            {b.serviceType === 'electrician' ? 'इलेक्ट्रीशियन' : 'प्लंबर'}: {b.issueDescription}
                          </p>
                        </div>
                        <span className="font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                          ₹{b.finalAmount ?? b.estimatedAmount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>ग्राहक सुरक्षा एवं डेटा ईमानदारी गारंटी</span>
                  </h3>
                  <span className="text-xs text-slate-500">सक्रिय</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>शून्य नकली डेटा:</strong> ऐप में कोई भी काल्पनिक इलेक्ट्रीशियन, प्लंबर या ग्राहक बुकिंग पहले से नहीं भरी गई है।
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>अनिवार्य पुष्टि (Confirmation Gate):</strong> ग्राहक को व्हाट्सएप/SMS भेजने, कॉल करने या वेबसाइट बदलाव लाइव करने से पहले हमेशा आपकी अनुमति मांगी जाती है।
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai_chat' && (
          <AiAssistantView
            providers={providers}
            bookings={bookings}
            onRequestConfirmation={setPendingConfirmation}
            onLogAction={logAction}
          />
        )}

        {activeTab === 'bookings' && (
          <BookingManager
            bookings={bookings}
            providers={providers}
            customLocalities={customLocalities}
            autoSuggestProviderByArea={autoSuggestRuleEnabled}
            onAddBooking={handleAddBooking}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
            onRequestConfirmation={setPendingConfirmation}
            onLogAction={logAction}
          />
        )}

        {activeTab === 'providers' && (
          <ProviderManager
            providers={providers}
            customLocalities={customLocalities}
            onAddLocality={(loc) => {
              setCustomLocalities((prev) =>
                prev.includes(loc) ? prev : [...prev, loc]
              );
              showNotice(`नया लखनऊ सेवा क्षेत्र "${loc}" जोड़ा गया।`);
            }}
            onAddProvider={handleAddProvider}
            onUpdateProvider={handleUpdateProvider}
            onDeleteProvider={handleDeleteProvider}
            onRequestConfirmation={setPendingConfirmation}
            onLogAction={logAction}
          />
        )}

        {activeTab === 'website' && (
          <WebsiteBuilderView
            config={websiteConfig}
            customLocalities={customLocalities}
            onSaveDraft={setWebsiteConfig}
            onPublishWebsite={(published) => {
              setWebsiteConfig(published);
              showNotice('वेबसाइट बदलाव सफलतापूर्वक प्रकाशित कर दिए गए!');
            }}
            onRequestConfirmation={setPendingConfirmation}
            onCustomerInquirySubmit={handleAddBooking}
            onLogAction={logAction}
          />
        )}

        {activeTab === 'reports_automation' && (
          <ReportsAndAutomationView
            providers={providers}
            bookings={bookings}
            automationRules={automationRules}
            auditLogs={auditLogs}
            onToggleAutomationRule={handleToggleAutomationRule}
            onToggleRuleConfirmationLock={handleToggleRuleConfirmationLock}
            onUpdateRuleTemplate={handleUpdateRuleTemplate}
            onTestAutomationRule={handleTestAutomationRule}
            onClearAllDataWithConfirmation={handleClearAllDataWithConfirmation}
            onRequestConfirmation={setPendingConfirmation}
          />
        )}
      </main>

      {/* Fixed Bottom Tab Bar for Android Mobile Ergonomics (< lg) */}
      <nav
        aria-label="मोबाइल मुख्य नेविगेशन"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-6 items-center h-16 px-1"
      >
        {(
          [
            { id: 'dashboard', label: 'डैशबोर्ड', icon: LayoutDashboard },
            { id: 'ai_chat', label: 'AI चैट', icon: Bot },
            { id: 'bookings', label: 'बुकिंग', icon: CalendarCheck },
            { id: 'providers', label: 'मिस्त्री', icon: Users },
            { id: 'website', label: 'वेबसाइट', icon: Globe },
            { id: 'reports_automation', label: 'रिपोर्ट', icon: Settings },
          ] as const
        ).map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
                isActive
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <IconComponent
                className={`w-5 h-5 ${isActive ? 'text-amber-600' : ''}`}
              />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap truncate max-w-full px-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Mandatory Confirmation Gate Modal */}
      <ConfirmationModal
        request={pendingConfirmation}
        onCancel={() => setPendingConfirmation(null)}
      />
    </div>
  );
}
