import React, { useState } from 'react';
import {
  UserPlus,
  Phone,
  MessageSquare,
  MapPin,
  Wrench,
  Zap,
  Droplets,
  Trash2,
  Edit3,
  Plus,
  Search,
  CheckCircle2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  ServiceProvider,
  ServiceCategory,
  ProviderAvailability,
  LUCKNOW_LOCALITIES,
  ELECTRICIAN_SKILLS,
  PLUMBER_SKILLS,
  ConfirmationRequest,
} from '../types';

interface ProviderManagerProps {
  providers: ServiceProvider[];
  customLocalities: string[];
  onAddLocality: (locality: string) => void;
  onAddProvider: (provider: Omit<ServiceProvider, 'id' | 'createdAt'>) => void;
  onUpdateProvider: (provider: ServiceProvider) => void;
  onDeleteProvider: (id: string) => void;
  onRequestConfirmation: (req: ConfirmationRequest) => void;
  onLogAction: (titleHi: string, detailHi: string, category: 'provider' | 'message') => void;
}

export const ProviderManager: React.FC<ProviderManagerProps> = ({
  providers,
  customLocalities,
  onAddLocality,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
  onRequestConfirmation,
  onLogAction,
}) => {
  const [subView, setSubView] = useState<'list' | 'areas' | 'form'>('list');
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | ServiceCategory>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newLocalityInput, setNewLocalityInput] = useState('');
  const [inlineLocalityInput, setInlineLocalityInput] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('electrician');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [experienceYears, setExperienceYears] = useState('3');
  const [idVerified, setIdVerified] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([
    'गोमती नगर (Gomti Nagar)',
    'हज़रतगंज (Hazratganj)',
  ]);
  const [baseVisitFee, setBaseVisitFee] = useState('149');
  const [availability, setAvailability] = useState<ProviderAvailability>('available');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const allLocalities = Array.from(new Set([...LUCKNOW_LOCALITIES, ...customLocalities]));

  const resetForm = () => {
    setEditingProvider(null);
    setName('');
    setCategory('electrician');
    setPhone('');
    setWhatsapp('');
    setExperienceYears('3');
    setIdVerified(false);
    setSelectedSkills([]);
    setSelectedAreas([LUCKNOW_LOCALITIES[0], LUCKNOW_LOCALITIES[4]]);
    setBaseVisitFee('149');
    setAvailability('available');
    setNotes('');
    setFormError('');
    setInlineLocalityInput('');
  };

  const openEditForm = (provider: ServiceProvider) => {
    setEditingProvider(provider);
    setName(provider.name);
    setCategory(provider.category);
    setPhone(provider.phone);
    setWhatsapp(provider.whatsapp);
    setExperienceYears(String(provider.experienceYears));
    setIdVerified(provider.idVerified);
    setSelectedSkills(provider.skills);
    setSelectedAreas(provider.serviceAreas);
    setBaseVisitFee(String(provider.baseVisitFee));
    setAvailability(provider.availability);
    setNotes(provider.notes);
    setFormError('');
    setSubView('form');
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const selectTopAreas = () => {
    setSelectedAreas([
      'गोमती नगर (Gomti Nagar)',
      'हज़रतगंज (Hazratganj)',
      'इंदिरा नगर (Indira Nagar)',
      'अलीगंज (Aliganj)',
      'आलमबाग (Alambagh)',
    ]);
  };

  const selectAllAreas = () => {
    setSelectedAreas([...allLocalities]);
  };

  const clearAreas = () => {
    setSelectedAreas([]);
  };

  const handleAddInlineLocality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineLocalityInput.trim()) return;
    const trimmed = inlineLocalityInput.trim();
    onAddLocality(trimmed);
    setSelectedAreas((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setInlineLocalityInput('');
  };

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = phone.replace(/\D/g, '');
    const cleanedWhatsapp = (whatsapp.replace(/\D/g, '') || cleanedPhone).slice(-10);

    if (!name.trim()) {
      setFormError('कृपया मिस्त्री का पूरा नाम दर्ज करें।');
      return;
    }
    if (cleanedPhone.length < 10) {
      setFormError('कृपया वैध 10-अंकों का मोबाइल नंबर दर्ज करें।');
      return;
    }
    if (selectedAreas.length === 0) {
      setFormError('कृपया कम से कम एक लखनऊ सेवा क्षेत्र (Locality) चुनें।');
      return;
    }

    const defaultSkills =
      category === 'electrician'
        ? [ELECTRICIAN_SKILLS[0]]
        : category === 'plumber'
        ? [PLUMBER_SKILLS[0]]
        : [ELECTRICIAN_SKILLS[0], PLUMBER_SKILLS[0]];

    const payload = {
      name: name.trim(),
      category,
      phone: cleanedPhone.slice(-10),
      whatsapp: cleanedWhatsapp,
      experienceYears: Math.max(0, Number(experienceYears) || 0),
      idVerified,
      skills: selectedSkills.length > 0 ? selectedSkills : defaultSkills,
      serviceAreas: selectedAreas,
      baseVisitFee: Math.max(0, Number(baseVisitFee) || 149),
      availability,
      notes: notes.trim(),
    };

    const isEditing = !!editingProvider;
    const catLabel = getCategoryLabelHi(category);
    const confirmTitle = isEditing
      ? 'मिस्त्री विवरण अपडेट करने की पुष्टि करें'
      : 'नया मिस्त्री जोड़ने की पुष्टि करें';
    const confirmDesc = isEditing
      ? `क्या आप "${name.trim()}" के विवरण में किए गए बदलाव सुरक्षित करना चाहते हैं?`
      : `क्या आप वास्तविक मिस्त्री "${name.trim()}" को लखनऊ सेवा नेटवर्क में जोड़ना चाहते हैं?`;

    const messagePreview = `मिस्त्री का नाम: ${name.trim()}
कार्य श्रेणी: ${catLabel}
मोबाइल नंबर: +91 ${cleanedPhone.slice(-10)}${cleanedWhatsapp !== cleanedPhone.slice(-10) ? ` · व्हाट्सएप: +91 ${cleanedWhatsapp}` : ''}
सेवा क्षेत्र (${selectedAreas.length} इलाके): ${selectedAreas.join(', ')}
विज़िट शुल्क: ₹${payload.baseVisitFee} · अनुभव: ${payload.experienceYears} वर्ष
सत्यापन: ${idVerified ? 'आधार/आईडी सत्यापित' : 'सत्यापन लंबित'}
कौशल: ${payload.skills.join(', ')}`;

    // Strict Requirement: Ask for confirmation before adding/updating a provider!
    onRequestConfirmation({
      titleHi: confirmTitle,
      descriptionHi: confirmDesc,
      recipientOrTargetHi: `${name.trim()} (+91 ${cleanedPhone.slice(-10)}) · ${catLabel}`,
      messagePreviewHi: messagePreview,
      impactWarningHi: isEditing
        ? 'पुष्टि करने पर यह विवरण तुरंत सुरक्षित हो जाएगा और ऐप दोबारा खोलने पर भी दिखाई देगा।'
        : 'यह मिस्त्री आपके वास्तविक मिस्त्री नेटवर्क में सुरक्षित हो जाएगा और ग्राहक बुकिंग आवंटन में उपलब्ध होगा। कोई भी नकली डेटा नहीं जोड़ा जाता है।',
      confirmButtonLabelHi: isEditing ? 'हाँ, बदलाव सुरक्षित करें' : 'हाँ, मिस्त्री पंजीकृत करें',
      onConfirm: () => {
        if (isEditing && editingProvider) {
          onUpdateProvider({
            ...editingProvider,
            ...payload,
          });
        } else {
          onAddProvider(payload);
        }
        resetForm();
        setSubView('list');
      },
    });
  };

  const handleAddCustomLocality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocalityInput.trim()) return;
    onAddLocality(newLocalityInput.trim());
    setNewLocalityInput('');
  };

  const handleContactProviderWithConfirm = (
    provider: ServiceProvider,
    channel: 'whatsapp' | 'call'
  ) => {
    if (channel === 'whatsapp') {
      const msgText = `नमस्कार ${provider.name} जी, लखनऊ सेवा (LucknowSeva) से संदेश: क्या आप आज आपके क्षेत्र (${provider.serviceAreas[0] || 'लखनऊ'}) में नई सर्विस बुकिंग के लिए उपलब्ध हैं?`;
      onRequestConfirmation({
        titleHi: 'मिस्त्री को व्हाट्सएप संदेश भेजने की पुष्टि करें',
        descriptionHi:
          'यह क्रिया आपके मिस्त्री के वास्तविक नंबर पर व्हाट्सएप संदेश विंडो खोलेगी।',
        recipientOrTargetHi: `${provider.name} (+91 ${provider.whatsapp})`,
        messagePreviewHi: msgText,
        impactWarningHi:
          'बिना पुष्टि के कोई संदेश नहीं भेजा जाता है। पुष्टि करने पर व्हाट्सएप संदेश तैयार किया जाएगा।',
        confirmButtonLabelHi: 'हाँ, व्हाट्सएप संदेश भेजें',
        onConfirm: () => {
          onLogAction(
            'मिस्त्री को व्हाट्सएप संदेश भेजा गया',
            `${provider.name} (${provider.whatsapp}) को उपलब्धता जांच संदेश भेजा गया।`,
            'message'
          );
          const url = `https://wa.me/91${provider.whatsapp}?text=${encodeURIComponent(msgText)}`;
          window.location.href = url;
        },
      });
    } else {
      onRequestConfirmation({
        titleHi: 'मिस्त्री को कॉल करने की पुष्टि करें',
        descriptionHi: 'क्या आप इस पंजीकृत मिस्त्री को सीधे फोन कॉल करना चाहते हैं?',
        recipientOrTargetHi: `${provider.name} (+91 ${provider.phone})`,
        impactWarningHi: 'यह आपके फोन डायलर में वास्तविक नंबर खोलेगा।',
        confirmButtonLabelHi: 'हाँ, कॉल डायल करें',
        onConfirm: () => {
          onLogAction(
            'मिस्त्री को फोन कॉल किया गया',
            `${provider.name} (${provider.phone}) को कॉल डायल किया गया।`,
            'provider'
          );
          window.location.href = `tel:+91${provider.phone}`;
        },
      });
    }
  };

  const safeProviders = (providers || []).filter(Boolean);

  const filteredProviders = safeProviders.filter((p) => {
    if (!p) return false;
    const pCategory = p.category;
    const pAreas = Array.isArray(p.serviceAreas) ? p.serviceAreas : [];
    const pSkills = Array.isArray(p.skills) ? p.skills : [];
    const pName = p.name || '';
    const pPhone = p.phone || '';

    if (categoryFilter !== 'all' && pCategory !== categoryFilter && pCategory !== 'both') {
      return false;
    }
    if (areaFilter !== 'all' && !pAreas.includes(areaFilter)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = pName.toLowerCase().includes(q);
      const matchPhone = pPhone.includes(q);
      const matchArea = pAreas.some((a) => (a || '').toLowerCase().includes(q));
      const matchSkill = pSkills.some((s) => (s || '').toLowerCase().includes(q));
      return matchName || matchPhone || matchArea || matchSkill;
    }
    return true;
  });

  const availableSkillOptions =
    category === 'electrician'
      ? ELECTRICIAN_SKILLS
      : category === 'plumber'
      ? PLUMBER_SKILLS
      : [...ELECTRICIAN_SKILLS, ...PLUMBER_SKILLS];

  const getCategoryLabelHi = (cat: ServiceCategory) => {
    if (cat === 'electrician') return 'इलेक्ट्रीशियन (बिजली मिस्त्री)';
    if (cat === 'plumber') return 'प्लंबर (नल/पाइप मिस्त्री)';
    return 'इलेक्ट्रीशियन एवं प्लंबर दोनों';
  };

  const getAvailabilityLabelHi = (avail: ProviderAvailability) => {
    if (avail === 'available') return 'उपलब्ध (Available)';
    if (avail === 'busy') return 'व्यस्त (On Job)';
    return 'छुट्टी पर (Offline)';
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            इलेक्ट्रीशियन और प्लंबर पंजीकरण व सेवा क्षेत्र
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            केवल अपने वास्तविक कारीगरों का पंजीकरण करें। मिस्त्री जोड़ने व हटाने से पहले पुष्टि आवश्यक है और डेटा हमेशा सुरक्षित रहता है।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSubView('list')}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                subView === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मिस्त्री सूची ({providers.length})
            </button>
            <button
              type="button"
              onClick={() => setSubView('areas')}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                subView === 'areas'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              सेवा क्षेत्र ({allLocalities.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setSubView('form');
            }}
            className="min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>नया मिस्त्री जोड़ें</span>
          </button>
        </div>
      </div>

      {/* Subview 1: Registration / Edit Form */}
      {subView === 'form' && (
        <form
          onSubmit={handleSaveProvider}
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {editingProvider
                  ? `मिस्त्री विवरण संपादित करें: ${editingProvider.name}`
                  : 'नया इलेक्ट्रीशियन / प्लंबर पंजीकरण फॉर्म'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                सुरक्षा नियम: फॉर्म सबमिट करने के बाद आपसे विवरण की पुष्टि (Confirmation) ली जाएगी।
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setSubView('list');
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
            >
              वापस सूची पर जाएं
            </button>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 font-medium">
              {formError}
            </div>
          )}

          {/* Form Section 1: Trade Category */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900">
              1. सेवा / कार्य श्रेणी (Trade Category) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCategory('electrician');
                  setSelectedSkills([]);
                }}
                className={`min-h-[50px] px-4 py-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  category === 'electrician'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${category === 'electrician' ? 'bg-amber-500 text-slate-900' : 'bg-amber-100 text-amber-700'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold">इलेक्ट्रीशियन</span>
                  <span className="block text-[11px] opacity-80">बिजली, वायरिंग, इन्वर्टर</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('plumber');
                  setSelectedSkills([]);
                }}
                className={`min-h-[50px] px-4 py-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  category === 'plumber'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${category === 'plumber' ? 'bg-sky-400 text-slate-900' : 'bg-sky-100 text-sky-700'}`}>
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold">प्लंबर</span>
                  <span className="block text-[11px] opacity-80">नल, पाइप, टंकी, ड्रेनेज</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('both');
                  setSelectedSkills([]);
                }}
                className={`min-h-[50px] px-4 py-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  category === 'both'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${category === 'both' ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-100 text-emerald-700'}`}>
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold">दोनों कार्य</span>
                  <span className="block text-[11px] opacity-80">इलेक्ट्रीशियन + प्लंबर</span>
                </div>
              </button>
            </div>
          </div>

          {/* Form Section 2: Personal Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                मिस्त्री का पूरा नाम *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="उदा. रमेश कुमार शर्मा"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                मोबाइल नंबर (10 अंक) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98XXXXXXXX"
                  maxLength={10}
                  className="w-full min-h-[48px] pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tabular-nums focus:outline-none focus:border-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                व्हाट्सएप नंबर (यदि अलग हो)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="खाली छोड़ने पर मोबाइल नंबर ही उपयोग होगा"
                  maxLength={10}
                  className="w-full min-h-[48px] pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tabular-nums focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                अनुभव (वर्ष) एवं विज़िट शुल्क (₹)
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="अनुभव"
                    className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">अनुभव (वर्ष)</span>
                </div>
                <div>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={baseVisitFee}
                    onChange={(e) => setBaseVisitFee(e.target.value)}
                    placeholder="विज़िट शुल्क"
                    className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">विज़िट शुल्क (₹)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                उपलब्धता स्थिति (Availability)
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as ProviderAvailability)}
                className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
              >
                <option value="available">उपलब्ध (Available — तुरंत बुकिंग के लिए)</option>
                <option value="busy">व्यस्त (Busy — अभी काम पर है)</option>
                <option value="offline">छुट्टी पर (Offline / Not Available)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                पहचान सत्यापन (ID Verification)
              </label>
              <label className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                  className="w-5 h-5 accent-slate-900 rounded"
                />
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>आधार कार्ड / पहचान पत्र सत्यापित है</span>
              </label>
            </div>
          </div>

          {/* Form Section 3: Lucknow Service Area Multi-select */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-sm font-semibold text-slate-900">
                  2. काम का इलाका / लखनऊ सेवा क्षेत्र चुनें *
                </label>
                <p className="text-xs text-slate-600">
                  चयनित क्षेत्र ({selectedAreas.length} इलाके चुने गए):
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectTopAreas}
                  className="min-h-[38px] px-3 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  प्रमुख 5 क्षेत्र
                </button>
                <button
                  type="button"
                  onClick={selectAllAreas}
                  className="min-h-[38px] px-3 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  सभी चुनें
                </button>
                <button
                  type="button"
                  onClick={clearAreas}
                  className="min-h-[38px] px-3 py-1 rounded-lg border border-slate-200 text-xs font-medium text-red-600 hover:bg-red-50 whitespace-nowrap"
                >
                  साफ़ करें
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {allLocalities.map((area) => {
                const isSelected = selectedAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={`min-h-[46px] px-3 py-2.5 rounded-xl text-left text-xs font-medium border transition-colors flex items-center justify-between gap-2 active:scale-[0.99] ${
                      isSelected
                        ? 'bg-amber-50 border-amber-600 text-slate-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{area}</span>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded border border-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Inline Add Area if needed */}
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg">
                <input
                  type="text"
                  value={inlineLocalityInput}
                  onChange={(e) => setInlineLocalityInput(e.target.value)}
                  placeholder="यदि इलाका सूची में नहीं है (उदा. तेलीबाग, कुर्सी रोड)..."
                  className="flex-1 min-h-[42px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddInlineLocality}
                  className="min-h-[42px] px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>यह क्षेत्र जोड़ें</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Section 4: Skills Multi-select */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-sm font-semibold text-slate-900">
              3. विशिष्ट कार्य व कौशल (Skills) चुनें
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {availableSkillOptions.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-medium border transition-colors flex items-center justify-between gap-2 active:scale-[0.99] ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{skill}</span>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded border border-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Section 5: Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              अतिरिक्त जानकारी / नोट्स (वैकल्पिक)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="उदा. खुद की बाइक व टूल्स उपलब्ध हैं, सुबह 8 से शाम 8 तक सेवा"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setSubView('list');
              }}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>{editingProvider ? 'पुष्टि करके बदलाव सुरक्षित करें' : 'पुष्टि करके मिस्त्री पंजीकृत करें'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Subview 2: Service Area Coverage Directory */}
      {subView === 'areas' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-base font-bold text-slate-900">
              नया लखनऊ सेवा क्षेत्र (Locality) जोड़ें
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              प्रमुख इलाके पहले से शामिल हैं। यदि आप किसी नए मोहल्ले या कॉलोनी में सेवा देते हैं, तो उसे यहाँ जोड़ें।
            </p>
            <form onSubmit={handleAddCustomLocality} className="mt-3 flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={newLocalityInput}
                onChange={(e) => setNewLocalityInput(e.target.value)}
                placeholder="उदा. तेलीबाग (Telibagh) या कुर्सी रोड (Kursi Road)"
                className="flex-1 min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
              <button
                type="submit"
                className="min-h-[46px] px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>क्षेत्र जोड़ें</span>
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allLocalities.map((locality) => {
              const areaProviders = safeProviders.filter(
                (p) => p && Array.isArray(p.serviceAreas) && p.serviceAreas.includes(locality)
              );
              const elecCount = areaProviders.filter(
                (p) => p && (p.category === 'electrician' || p.category === 'both')
              ).length;
              const plumbCount = areaProviders.filter(
                (p) => p && (p.category === 'plumber' || p.category === 'both')
              ).length;

              return (
                <div
                  key={locality}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                        <h4 className="font-bold text-slate-900 text-sm">{locality}</h4>
                      </div>
                      <span className="text-xs font-mono tabular-nums text-slate-600">
                        कुल: {areaProviders.length}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-600">
                      <span>इलेक्ट्रीशियन: <strong className="font-mono tabular-nums text-slate-900">{elecCount}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>प्लंबर: <strong className="font-mono tabular-nums text-slate-900">{plumbCount}</strong></span>
                    </div>

                    {areaProviders.length > 0 ? (
                      <ul className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        {areaProviders.map((ap) => (
                          <li
                            key={ap.id}
                            className="flex items-center justify-between text-xs text-slate-700"
                          >
                            <span className="font-medium truncate">{ap.name}</span>
                            <span className="font-mono tabular-nums text-slate-500">
                              +91 {ap.phone}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        इस क्षेत्र में अभी कोई वास्तविक मिस्त्री पंजीकृत नहीं है।
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setSelectedAreas([locality]);
                      setSubView('form');
                    }}
                    className="mt-4 min-h-[44px] w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    + इस क्षेत्र के लिए मिस्त्री जोड़ें
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subview 3: Provider List & Filters */}
      {subView === 'list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="नाम, मोबाइल नंबर, कौशल या लखनऊ क्षेत्र से खोजें..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as 'all' | ServiceCategory)}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium text-slate-700"
              >
                <option value="all">सभी श्रेणियां (All)</option>
                <option value="electrician">केवल इलेक्ट्रीशियन</option>
                <option value="plumber">केवल प्लंबर</option>
                <option value="both">इलेक्ट्रीशियन + प्लंबर</option>
              </select>

              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium text-slate-700"
              >
                <option value="all">सभी लखनऊ क्षेत्र</option>
                {allLocalities.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Honest Empty State (Zero Fake Providers) */}
          {providers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                अभी कोई इलेक्ट्रीशियन या प्लंबर पंजीकृत नहीं है
              </h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                डेटा प्रामाणिकता नियम के अनुसार इस ऐप में कोई भी नकली (Fake) मिस्त्री नहीं दिखाया गया है। केवल अपने वास्तविक इलेक्ट्रीशियन और प्लंबर का नाम, फोन नंबर और लखनऊ के सेवा क्षेत्र जोड़कर शुरुआत करें।
              </p>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setSubView('form');
                }}
                className="mt-5 min-h-[48px] px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 inline-flex items-center gap-2 active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>पहला वास्तविक मिस्त्री पंजीकृत करें</span>
              </button>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-600">
                आपकी खोज या फ़िल्टर से मेल खाने वाला कोई मिस्त्री नहीं मिला।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                          {provider.category === 'electrician' ? (
                            <Zap className="w-5 h-5 text-amber-600" />
                          ) : provider.category === 'plumber' ? (
                            <Droplets className="w-5 h-5 text-sky-600" />
                          ) : (
                            <Wrench className="w-5 h-5 text-slate-700" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            {provider.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                            <span>{getCategoryLabelHi(provider.category)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {provider.experienceYears} वर्ष अनुभव
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {provider.idVerified ? 'आईडी सत्यापित' : 'आईडी लंबित'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-slate-700 block">
                          {getAvailabilityLabelHi(provider.availability)}
                        </span>
                        <span className="text-xs font-mono tabular-nums text-slate-500">
                          विज़िट: ₹{provider.baseVisitFee}
                        </span>
                      </div>
                    </div>

                    {/* Unboxed Metadata Details */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                      <div>
                        <span className="font-semibold text-slate-900">संपर्क नंबर: </span>
                        <span className="font-mono tabular-nums">+91 {provider.phone}</span>
                        {provider.whatsapp && provider.whatsapp !== provider.phone && (
                          <span>
                            {' '}
                            · व्हाट्सएप: <span className="font-mono tabular-nums">+91 {provider.whatsapp}</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">लखनऊ सेवा क्षेत्र: </span>
                        <span>{(provider.serviceAreas || []).join(' · ')}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">मुख्य कौशल: </span>
                        <span>{(provider.skills || []).join(' · ')}</span>
                      </div>
                      {provider.notes && (
                        <div className="text-slate-500">
                          <span className="font-medium text-slate-700">नोट: </span>
                          {provider.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons with 44px+ Mobile Hitboxes */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleContactProviderWithConfirm(provider, 'call')}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 hover:bg-slate-100 flex items-center gap-1.5 whitespace-nowrap active:scale-[0.98]"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>कॉल करें</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleContactProviderWithConfirm(provider, 'whatsapp')}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 hover:bg-slate-100 flex items-center gap-1.5 whitespace-nowrap active:scale-[0.98]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>व्हाट्सएप संदेश</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(provider)}
                        className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center justify-center active:scale-[0.95]"
                        title="विवरण संपादित करें"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onRequestConfirmation({
                            titleHi: 'मिस्त्री रिकॉर्ड हटाने की पुष्टि करें',
                            descriptionHi: `क्या आप वाकई ${provider.name} को पंजीकृत मिस्त्री सूची से हटाना चाहते हैं?`,
                            recipientOrTargetHi: `${provider.name} (+91 ${provider.phone})`,
                            impactWarningHi: 'हटाने के बाद इस मिस्त्री को नई बुकिंग में आवंटित नहीं किया जा सकेगा।',
                            confirmButtonLabelHi: 'हाँ, रिकॉर्ड हटाएं',
                            onConfirm: () => onDeleteProvider(provider.id),
                          })
                        }
                        className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-red-600 hover:bg-red-50 flex items-center justify-center active:scale-[0.95]"
                        title="मिस्त्री हटाएं"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
