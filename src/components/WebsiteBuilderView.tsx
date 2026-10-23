import React, { useState, useEffect } from 'react';
import {
  Globe,
  Wand2,
  Eye,
  Check,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  WebsiteConfig,
  LUCKNOW_LOCALITIES,
  ConfirmationRequest,
  CustomerBooking,
} from '../types';

interface WebsiteBuilderViewProps {
  config: WebsiteConfig;
  customLocalities: string[];
  onSaveDraft: (updated: WebsiteConfig) => void;
  onPublishWebsite: (publishedConfig: WebsiteConfig) => void;
  onRequestConfirmation: (req: ConfirmationRequest) => void;
  onCustomerInquirySubmit: (
    booking: Omit<CustomerBooking, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  onLogAction: (titleHi: string, detailHi: string, category: 'website' | 'booking') => void;
}

interface AiWebsiteSuggestion {
  suggestedHeadline: string;
  suggestedSubheadline: string;
  suggestedAnnouncement: string;
  seoKeywords: string[];
  improvementsList: string[];
}

export const WebsiteBuilderView: React.FC<WebsiteBuilderViewProps> = ({
  config,
  customLocalities,
  onSaveDraft,
  onPublishWebsite,
  onRequestConfirmation,
  onCustomerInquirySubmit,
  onLogAction,
}) => {
  const [draft, setDraft] = useState<WebsiteConfig>(config);
  const [activeMode, setActiveMode] = useState<'editor' | 'preview'>('editor');
  const [aiGoal, setAiGoal] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiWebsiteSuggestion | null>(null);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  // New Service Item in Rate Card
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('₹199 से शुरू');
  const [newServiceCat, setNewServiceCat] = useState<'electrician' | 'plumber'>('electrician');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Live Customer Website Preview Inquiry Form
  const [inqName, setInqName] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqService, setInqService] = useState<'electrician' | 'plumber'>('electrician');
  const [inqArea, setInqArea] = useState(
    (draft.activeLocalities && draft.activeLocalities[0]) || LUCKNOW_LOCALITIES[0]
  );
  const [inqIssue, setInqIssue] = useState('');
  const [inqSuccessMessage, setInqSuccessMessage] = useState('');

  const allLocalities = Array.from(new Set([...LUCKNOW_LOCALITIES, ...customLocalities]));

  const updateField = <K extends keyof WebsiteConfig>(
    key: K,
    val: WebsiteConfig[K]
  ) => {
    const next = { ...draft, [key]: val };
    setDraft(next);
    onSaveDraft(next);
  };

  const toggleActiveLocality = (loc: string) => {
    const list = Array.isArray(draft.activeLocalities) ? draft.activeLocalities : [];
    const exists = list.includes(loc);
    const updated = exists
      ? list.filter((l) => l !== loc)
      : [...list, loc];
    updateField('activeLocalities', updated);
  };

  const handleAddServiceCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceTitle.trim()) return;
    const updated = [
      ...draft.services,
      {
        id: `srv-${Date.now()}`,
        category: newServiceCat,
        titleHi: newServiceTitle.trim(),
        priceLabelHi: newServicePrice.trim() || '₹149 से शुरू',
        descriptionHi:
          newServiceDesc.trim() || 'सत्यापित मिस्त्री द्वारा घर पर त्वरित रिपेयर सेवा।',
      },
    ];
    updateField('services', updated);
    setNewServiceTitle('');
    setNewServiceDesc('');
  };

  const handleRemoveServiceCard = (id: string) => {
    updateField(
      'services',
      draft.services.filter((s) => s.id !== id)
    );
  };

  const handleGetAiSuggestions = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/website-improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentConfig: draft,
          customGoal: aiGoal,
        }),
      });
      const data = await res.json();
      if (data.suggestedHeadline) {
        setAiSuggestion(data);
      }
    } catch {
      // handled gracefully
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiSuggestionToDraft = () => {
    if (!aiSuggestion) return;
    const next: WebsiteConfig = {
      ...draft,
      headlineHi: aiSuggestion.suggestedHeadline,
      subheadlineHi: aiSuggestion.suggestedSubheadline,
      announcementBannerHi: aiSuggestion.suggestedAnnouncement,
      seoKeywords: aiSuggestion.seoKeywords,
    };
    setDraft(next);
    onSaveDraft(next);
    onLogAction(
      'वेबसाइट ड्राफ्ट में AI सुधार लागू किए गए',
      'शीर्षक, घोषणा बैनर और SEO कीवर्ड ड्राफ्ट में अपडेट किए गए (अभी अप्रकाशित)।',
      'website'
    );
  };

  const handlePublishWithConfirmation = () => {
    onRequestConfirmation({
      titleHi: 'वेबसाइट बदलाव प्रकाशित (Publish) करने की पुष्टि करें',
      descriptionHi:
        'क्या आप वाकई इन वेबसाइट बदलावों को वास्तविक ग्राहकों के लिए लाइव प्रकाशित करना चाहते हैं?',
      recipientOrTargetHi: `${draft.businessName} — सार्वजनिक ग्राहक वेबसाइट`,
      messagePreviewHi: `मुख्य शीर्षक: "${draft.headlineHi}"\nसंपर्क नंबर: ${
        draft.contactPhone ? `+91 ${draft.contactPhone}` : 'अनिर्दिष्ट'
      }\nसक्रिय लखनऊ क्षेत्र: ${draft.activeLocalities.length} इलाके\nकुल सूचीबद्ध सेवाएं: ${
        draft.services.length
      }`,
      impactWarningHi:
        'पुष्टि करने के बाद ये विवरण और रेट कार्ड आपके ग्राहकों को सार्वजनिक वेबसाइट पर दिखाई देंगे।',
      confirmButtonLabelHi: 'हाँ, वेबसाइट बदलाव प्रकाशित करें',
      onConfirm: () => {
        const published: WebsiteConfig = {
          ...draft,
          isPublished: true,
          lastPublishedAt: new Date().toLocaleString('hi-IN'),
        };
        setDraft(published);
        onPublishWebsite(published);
        onLogAction(
          'वेबसाइट बदलाव लाइव प्रकाशित किए गए',
          `मालिक की पुष्टि के बाद लखनऊ सेवा वेबसाइट अपडेट की गई।`,
          'website'
        );
      },
    });
  };

  const handleCustomerPreviewBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = inqPhone.replace(/\D/g, '');
    if (!inqName.trim() || cleanedPhone.length < 10 || !inqIssue.trim()) return;

    onRequestConfirmation({
      titleHi: 'वेबसाइट से प्राप्त ग्राहक बुकिंग दर्ज करने की पुष्टि करें',
      descriptionHi:
        'क्या आप वेबसाइट फॉर्म से इस वास्तविक बुकिंग अनुरोध को अपने बुकिंग डैशबोर्ड में जोड़ना चाहते हैं?',
      recipientOrTargetHi: `${inqName} (+91 ${cleanedPhone}) · ${inqArea}`,
      messagePreviewHi: `सेवा: ${
        inqService === 'electrician' ? 'इलेक्ट्रीशियन' : 'प्लंबर'
      }\nसमस्या: ${inqIssue}`,
      impactWarningHi:
        'पुष्टि करने पर यह बुकिंग आपकी वास्तविक ग्राहक बुकिंग सूची में लंबित (Pending) स्थिति में जुड़ जाएगी।',
      confirmButtonLabelHi: 'हाँ, बुकिंग स्वीकार करें',
      onConfirm: () => {
        onCustomerInquirySubmit({
          customerName: inqName.trim(),
          customerPhone: cleanedPhone.slice(-10),
          locality: inqArea,
          fullAddress: inqArea,
          serviceType: inqService,
          issueDescription: inqIssue.trim(),
          urgency: 'normal',
          preferredDate: new Date().toISOString().slice(0, 10),
          preferredTimeSlot: 'सुबह 10:00 - दोपहर 1:00',
          estimatedAmount: inqService === 'plumber' ? 199 : 149,
          status: 'pending',
          source: 'website',
        });
        onLogAction(
          'वेबसाइट से नई वास्तविक ग्राहक बुकिंग दर्ज हुई',
          `${inqName} (${inqArea}) का अनुरोध बुकिंग सूची में जोड़ा गया।`,
          'booking'
        );
        setInqName('');
        setInqPhone('');
        setInqIssue('');
        setInqSuccessMessage(
          '✓ धन्यवाद! आपका बुकिंग अनुरोध लखनऊ सेवा डैशबोर्ड में सफलतापूर्वक दर्ज हो गया है।'
        );
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            वेबसाइट बिल्डर और सुधार सहायक
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            अपनी LucknowSeva वेबसाइट संपादित करें, AI से सुधार सुझाव लें और पुष्टि के बाद बदलाव प्रकाशित करें।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveMode('editor')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeMode === 'editor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              वेबसाइट संपादक (Editor)
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('preview')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ग्राहक वेबसाइट प्रीव्यू</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePublishWithConfirmation}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Globe className="w-4 h-4" />
            <span>वेबसाइट प्रकाशित करें</span>
          </button>
        </div>
      </div>

      {/* Publication Status Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div>
          <span className="font-semibold text-slate-900">प्रकाशन स्थिति: </span>
          {draft.isPublished ? (
            <span className="text-emerald-700 font-semibold">
              लाइव प्रकाशित (अंतिम प्रकाशन: <strong className="font-mono tabular-nums">{draft.lastPublishedAt}</strong>)
            </span>
          ) : (
            <span className="text-amber-800 font-semibold">
              🔒 सुरक्षित ड्राफ्ट मोड (अप्रकाशित) — डेटा सुरक्षित है, कोई भी बदलाव अभी लाइव प्रकाशित नहीं है।
            </span>
          )}
        </div>
        <span className="text-slate-600 font-medium">
          सुरक्षा नियम: आपकी स्पष्ट पुष्टि के बिना वेबसाइट लाइव प्रकाशित नहीं होगी।
        </span>
      </div>

      {activeMode === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Website Content & Services Editor */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                1. मुख्य वेबसाइट संदेश और संपर्क नंबर
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    व्यवसाय का नाम
                  </label>
                  <input
                    type="text"
                    value={draft.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    सेवा का समय (Operating Hours)
                  </label>
                  <input
                    type="text"
                    value={draft.operatingHoursHi}
                    onChange={(e) => updateField('operatingHoursHi', e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ग्राहक हेल्पलाइन फोन नंबर (10 अंक)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={draft.contactPhone}
                    onChange={(e) =>
                      updateField('contactPhone', e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="अपना वास्तविक बिज़नेस नंबर लिखें"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    व्हाट्सएप बुकिंग नंबर (10 अंक)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={draft.whatsappNumber}
                    onChange={(e) =>
                      updateField('whatsappNumber', e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="अपना व्हाट्सएप नंबर लिखें"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  मुख्य शीर्षक (Hero Headline)
                </label>
                <input
                  type="text"
                  value={draft.headlineHi}
                  onChange={(e) => updateField('headlineHi', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  उप-शीर्षक (Subheadline)
                </label>
                <textarea
                  rows={2}
                  value={draft.subheadlineHi}
                  onChange={(e) => updateField('subheadlineHi', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  शीर्ष सूचना पट्टी (Top Announcement Banner)
                </label>
                <input
                  type="text"
                  value={draft.announcementBannerHi}
                  onChange={(e) => updateField('announcementBannerHi', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            {/* Active Lucknow Localities on Website */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                2. वेबसाइट पर दिखने वाले लखनऊ सेवा क्षेत्र
              </h3>
              <p className="text-xs text-slate-600">
                केवल उन्हीं इलाकों को चुनें जहाँ आपके पास वास्तविक इलेक्ट्रीशियन और प्लंबर उपलब्ध हैं:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allLocalities.map((loc) => {
                  const active = draft.activeLocalities.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleActiveLocality(loc)}
                      className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between gap-1.5 ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="truncate">{loc}</span>
                      {active && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Service Rate Card Editor */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                3. सेवाएं और रेट कार्ड (Services & Rate Card)
              </h3>

              <div className="space-y-2.5">
                {draft.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-3.5 rounded-xl border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {srv.category === 'electrician' ? 'इलेक्ट्रीशियन' : 'प्लंबर'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums font-semibold text-amber-800">
                          {srv.priceLabelHi}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {srv.titleHi}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">{srv.descriptionHi}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveServiceCard(srv.id)}
                      className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0"
                      title="सेवा हटाएं"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddServiceCard}
                className="pt-3 border-t border-slate-100 space-y-3"
              >
                <p className="text-xs font-semibold text-slate-800">
                  नई सेवा कार्ड जोड़ें:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <select
                    value={newServiceCat}
                    onChange={(e) =>
                      setNewServiceCat(e.target.value as 'electrician' | 'plumber')
                    }
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                  >
                    <option value="electrician">इलेक्ट्रीशियन सेवा</option>
                    <option value="plumber">प्लंबर सेवा</option>
                  </select>
                  <input
                    type="text"
                    value={newServiceTitle}
                    onChange={(e) => setNewServiceTitle(e.target.value)}
                    placeholder="सेवा का नाम (उदा. एसी पावर पॉइंट)"
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="शुल्क (उदा. ₹199 से शुरू)"
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono tabular-nums"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    placeholder="संक्षिप्त विवरण लिखें..."
                    className="flex-1 min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <button
                    type="submit"
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>सेवा जोड़ें</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right 5 Cols: AI Website Improvement Assistant */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    AI वेबसाइट सुधार सहायक
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    अपनी वेबसाइट के लिए बेहतर हिंदी शीर्षक, स्थानीय लखनऊ SEO कीवर्ड और ग्राहकों का भरोसा बढ़ाने के सुझाव पाएं।
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  आपका विशेष लक्ष्य क्या है? (वैकल्पिक)
                </label>
                <input
                  type="text"
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  placeholder="उदा. गोमती नगर में आपातकालीन बिजली रिपेयर बुकिंग बढ़ाना"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <button
                type="button"
                onClick={handleGetAiSuggestions}
                disabled={isAiLoading}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                <span>
                  {isAiLoading
                    ? 'AI आपकी वेबसाइट का विश्लेषण कर रहा है...'
                    : 'AI से वेबसाइट सुधार सुझाव प्राप्त करें'}
                </span>
              </button>

              {aiSuggestion && (
                <div className="pt-4 border-t border-slate-200 space-y-4 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block mb-1">
                      सुझाया गया मुख्य शीर्षक:
                    </span>
                    <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                      {aiSuggestion.suggestedHeadline}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-900 block mb-1">
                      सुझाया गया उप-शीर्षक:
                    </span>
                    <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                      {aiSuggestion.suggestedSubheadline}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-900 block mb-1.5">
                      वेबसाइट बेहतर बनाने के मुख्य सुझाव:
                    </span>
                    <ul className="space-y-1.5 text-slate-700 list-disc pl-4">
                      {aiSuggestion.improvementsList.map((item, i) => (
                        <li key={i} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-900 block mb-1">
                      सुझाए गए लोकल SEO कीवर्ड:
                    </span>
                    <p className="text-slate-600">
                      {aiSuggestion.seoKeywords.join(' · ')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyAiSuggestionToDraft}
                    className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                  >
                    इन सुझावों को ड्राफ्ट में लागू करें (प्रकाशन से पहले जांचें)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Live Customer Website Preview */
        <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-xs">
          {/* Top Announcement Bar */}
          <div className="bg-slate-900 text-amber-300 px-4 py-2.5 text-center text-xs font-medium">
            {draft.announcementBannerHi}
          </div>

          <div className="p-6 sm:p-10 space-y-8 max-w-4xl mx-auto">
            {/* Brand & Contact Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {draft.businessName}
                </h1>
                <p className="text-sm text-slate-600 mt-1">{draft.taglineHi}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                  <Clock className="w-4 h-4 text-amber-700" />
                  {draft.operatingHoursHi}
                </span>
                {draft.contactPhone && (
                  <span className="font-mono tabular-nums font-bold text-slate-900">
                    · कॉल: +91 {draft.contactPhone}
                  </span>
                )}
              </div>
            </div>

            {/* Hero Section */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
              <h2 className="text-xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {draft.headlineHi}
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {draft.subheadlineHi}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-700">
                {draft.trustHighlightsHi.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Services Rate Card */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                हमारी इलेक्ट्रीशियन और प्लंबर सेवाएं (पारदर्शी शुल्क)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {draft.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 rounded-2xl border border-slate-200 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>
                          {srv.category === 'electrician'
                            ? 'इलेक्ट्रीशियन सेवा'
                            : 'प्लंबर सेवा'}
                        </span>
                        <span className="font-mono tabular-nums font-bold text-amber-800">
                          {srv.priceLabelHi}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">
                        {srv.titleHi}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">{srv.descriptionHi}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Areas */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-700" />
                <span>लखनऊ में हमारे सेवा क्षेत्र</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {draft.activeLocalities.join(' · ')}
              </p>
            </div>

            {/* Customer Online Inquiry Form */}
            {draft.enableOnlineBookingForm && (
              <form
                onSubmit={handleCustomerPreviewBookingSubmit}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
              >
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  घर बैठे मिस्त्री बुक करें (ग्राहक बुकिंग फॉर्म)
                </h3>
                {inqSuccessMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 font-medium">
                    {inqSuccessMessage}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <input
                    type="text"
                    value={inqName}
                    onChange={(e) => setInqName(e.target.value)}
                    placeholder="आपका नाम *"
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm"
                    required
                  />
                  <input
                    type="tel"
                    maxLength={10}
                    value={inqPhone}
                    onChange={(e) => setInqPhone(e.target.value)}
                    placeholder="10-अंकों का मोबाइल नंबर *"
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm font-mono tabular-nums"
                    required
                  />
                  <select
                    value={inqService}
                    onChange={(e) =>
                      setInqService(e.target.value as 'electrician' | 'plumber')
                    }
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm"
                  >
                    <option value="electrician">इलेक्ट्रीशियन (बिजली मिस्त्री)</option>
                    <option value="plumber">प्लंबर (नल/पाइप मिस्त्री)</option>
                  </select>
                  <select
                    value={inqArea}
                    onChange={(e) => setInqArea(e.target.value)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm"
                  >
                    {draft.activeLocalities.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={inqIssue}
                  onChange={(e) => setInqIssue(e.target.value)}
                  placeholder="समस्या लिखें (उदा. पंखा रिपेयर, एमसीबी फॉल्ट, नल लीकेज) *"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm"
                  required
                />
                <button
                  type="submit"
                  className="min-h-[46px] px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 inline-flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>बुकिंग अनुरोध भेजें (पुष्टि सहित)</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
