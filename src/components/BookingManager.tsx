import React, { useState } from 'react';
import {
  CalendarPlus,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  CheckCircle2,
  UserCheck,
  Search,
} from 'lucide-react';
import {
  CustomerBooking,
  BookingStatus,
  BookingUrgency,
  ServiceProvider,
  LUCKNOW_LOCALITIES,
  ConfirmationRequest,
} from '../types';

interface BookingManagerProps {
  bookings: CustomerBooking[];
  providers: ServiceProvider[];
  customLocalities: string[];
  autoSuggestProviderByArea: boolean;
  onAddBooking: (
    booking: Omit<CustomerBooking, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  onUpdateBooking: (booking: CustomerBooking) => void;
  onDeleteBooking: (id: string) => void;
  onRequestConfirmation: (req: ConfirmationRequest) => void;
  onLogAction: (titleHi: string, detailHi: string, category: 'booking' | 'message') => void;
}

export const BookingManager: React.FC<BookingManagerProps> = ({
  bookings,
  providers,
  customLocalities,
  autoSuggestProviderByArea,
  onAddBooking,
  onUpdateBooking,
  onDeleteBooking,
  onRequestConfirmation,
  onLogAction,
}) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Booking Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [locality, setLocality] = useState(LUCKNOW_LOCALITIES[0]);
  const [fullAddress, setFullAddress] = useState('');
  const [serviceType, setServiceType] = useState<'electrician' | 'plumber'>('electrician');
  const [issueDescription, setIssueDescription] = useState('');
  const [urgency, setUrgency] = useState<BookingUrgency>('normal');
  const [preferredDate, setPreferredDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('सुबह 10:00 - दोपहर 1:00');
  const [estimatedAmount, setEstimatedAmount] = useState('199');
  const [assignedProviderId, setAssignedProviderId] = useState('');
  const [formError, setFormError] = useState('');

  const allLocalities = Array.from(new Set([...LUCKNOW_LOCALITIES, ...customLocalities]));

  const safeProviders = (providers || []).filter(Boolean);

  // Providers matching selected serviceType and optionally locality
  const matchingProviders = safeProviders.filter(
    (p) => p && (p.category === serviceType || p.category === 'both')
  );
  const sortedMatchingProviders = [...matchingProviders].sort((a, b) => {
    const aCoversArea = Array.isArray(a.serviceAreas) && a.serviceAreas.includes(locality) ? 1 : 0;
    const bCoversArea = Array.isArray(b.serviceAreas) && b.serviceAreas.includes(locality) ? 1 : 0;
    if (aCoversArea !== bCoversArea) return bCoversArea - aCoversArea;
    const aAvail = a.availability === 'available' ? 1 : 0;
    const bAvail = b.availability === 'available' ? 1 : 0;
    return bAvail - aAvail;
  });

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setLocality(allLocalities[0] || LUCKNOW_LOCALITIES[0]);
    setFullAddress('');
    setServiceType('electrician');
    setIssueDescription('');
    setUrgency('normal');
    setPreferredDate(new Date().toISOString().slice(0, 10));
    setPreferredTimeSlot('सुबह 10:00 - दोपहर 1:00');
    setEstimatedAmount('199');
    setAssignedProviderId('');
    setFormError('');
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = customerPhone.replace(/\D/g, '');
    if (!customerName.trim()) {
      setFormError('कृपया ग्राहक का नाम दर्ज करें।');
      return;
    }
    if (cleanedPhone.length < 10) {
      setFormError('कृपया ग्राहक का 10-अंकों का मोबाइल नंबर दर्ज करें।');
      return;
    }
    if (!issueDescription.trim()) {
      setFormError('कृपया समस्या या कार्य का विवरण लिखें।');
      return;
    }

    const initialStatus: BookingStatus = assignedProviderId ? 'assigned' : 'pending';

    onAddBooking({
      customerName: customerName.trim(),
      customerPhone: cleanedPhone.slice(-10),
      locality,
      fullAddress: fullAddress.trim() || locality,
      serviceType,
      issueDescription: issueDescription.trim(),
      urgency,
      preferredDate,
      preferredTimeSlot,
      estimatedAmount: Math.max(0, Number(estimatedAmount) || 0),
      assignedProviderId: assignedProviderId || undefined,
      status: initialStatus,
    });

    resetForm();
    setShowNewForm(false);
  };

  const handleStatusChangeWithConfirmation = (
    booking: CustomerBooking,
    newStatus: BookingStatus
  ) => {
    const statusLabelsHi: Record<BookingStatus, string> = {
      pending: 'लंबित (Pending)',
      assigned: 'मिस्त्री आवंटित (Assigned)',
      in_progress: 'कार्य प्रगति पर (In Progress)',
      completed: 'पूर्ण (Completed)',
      cancelled: 'रद्द (Cancelled)',
    };

    onRequestConfirmation({
      titleHi: 'बुकिंग स्थिति अपडेट करने की पुष्टि करें',
      descriptionHi: `क्या आप ग्राहक "${booking.customerName}" की बुकिंग स्थिति को "${statusLabelsHi[newStatus]}" में बदलना चाहते हैं?`,
      recipientOrTargetHi: `${booking.customerName} (+91 ${booking.customerPhone}) · ${booking.locality}`,
      messagePreviewHi: `प्रस्तावित स्थिति बदलाव: ${statusLabelsHi[booking.status]} → ${statusLabelsHi[newStatus]}`,
      impactWarningHi:
        'यह बदलाव आपके वास्तविक बुकिंग रिकॉर्ड और व्यापार रिपोर्ट में तुरंत दर्ज किया जाएगा।',
      confirmButtonLabelHi: 'हाँ, स्थिति अपडेट करें',
      onConfirm: () => {
        onUpdateBooking({
          ...booking,
          status: newStatus,
          finalAmount:
            newStatus === 'completed' && !booking.finalAmount
              ? booking.estimatedAmount
              : booking.finalAmount,
          updatedAt: new Date().toISOString(),
        });
        onLogAction(
          'बुकिंग स्थिति अपडेट की गई',
          `ग्राहक ${booking.customerName} की बुकिंग स्थिति '${statusLabelsHi[newStatus]}' की गई।`,
          'booking'
        );
      },
    });
  };

  const handleAssignProviderWithConfirmation = (
    booking: CustomerBooking,
    providerId: string
  ) => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;

    const customerMessage = `नमस्कार ${booking.customerName} जी, लखनऊ सेवा (LucknowSeva) में आपकी ${
      booking.serviceType === 'electrician' ? 'इलेक्ट्रीशियन' : 'प्लंबर'
    } बुकिंग के लिए मिस्त्री ${provider.name} (मोबाइल: +91 ${provider.phone}) को नियुक्त किया गया है। समय: ${
      booking.preferredDate
    } (${booking.preferredTimeSlot})। अनुमानित शुल्क: ₹${booking.estimatedAmount}।`;

    onRequestConfirmation({
      titleHi: 'मिस्त्री आवंटन की पुष्टि करें',
      descriptionHi: `क्या आप ग्राहक ${booking.customerName} की बुकिंग के लिए मिस्त्री "${provider.name}" को नियुक्त करना चाहते हैं?`,
      recipientOrTargetHi: `ग्राहक: ${booking.customerName} · मिस्त्री: ${provider.name}`,
      messagePreviewHi: customerMessage,
      impactWarningHi:
        'पुष्टि करने पर मिस्त्री बुकिंग से जुड़ जाएगा। ग्राहक को संदेश भेजने के लिए आप नीचे व्हाट्सएप बटन का उपयोग कर सकेंगे।',
      confirmButtonLabelHi: 'हाँ, मिस्त्री नियुक्त करें',
      onConfirm: () => {
        onUpdateBooking({
          ...booking,
          assignedProviderId: provider.id,
          status: booking.status === 'pending' ? 'assigned' : booking.status,
          updatedAt: new Date().toISOString(),
        });
        onLogAction(
          'बुकिंग पर मिस्त्री नियुक्त किया गया',
          `ग्राहक ${booking.customerName} के लिए मिस्त्री ${provider.name} नियुक्त।`,
          'booking'
        );
      },
    });
  };

  const handleSendCustomerWhatsApp = (booking: CustomerBooking) => {
    const assignedProv = providers.find((p) => p.id === booking.assignedProviderId);
    const msg = assignedProv
      ? `नमस्कार ${booking.customerName} जी, लखनऊ सेवा (LucknowSeva) से अपडेट: आपकी ${
          booking.serviceType === 'electrician' ? 'बिजली (इलेक्ट्रीशियन)' : 'प्लंबिंग'
        } सेवा के लिए मिस्त्री ${assignedProv.name} (+91 ${assignedProv.phone}) निर्धारित हैं। समय: ${
          booking.preferredDate
        }, ${booking.preferredTimeSlot}।`
      : `नमस्कार ${booking.customerName} जी, लखनऊ सेवा (LucknowSeva) में आपकी सेवा बुकिंग (${booking.locality}) प्राप्त हो गई है। हम जल्द ही मिस्त्री का विवरण साझा करेंगे।`;

    onRequestConfirmation({
      titleHi: 'वास्तविक ग्राहक को व्हाट्सएप संदेश भेजने की पुष्टि करें',
      descriptionHi:
        'यह क्रिया ग्राहक के मोबाइल नंबर पर नीचे दिया गया संदेश भेजने के लिए व्हाट्सएप खोलेगी।',
      recipientOrTargetHi: `${booking.customerName} (+91 ${booking.customerPhone})`,
      messagePreviewHi: msg,
      impactWarningHi:
        'यह संदेश सीधे वास्तविक ग्राहक को जाएगा। कृपया नाम, समय और विवरण की जांच कर लें।',
      confirmButtonLabelHi: 'हाँ, ग्राहक को संदेश भेजें',
      onConfirm: () => {
        onLogAction(
          'ग्राहक को व्हाट्सएप अपडेट भेजा गया',
          `${booking.customerName} (+91 ${booking.customerPhone}) को बुकिंग संदेश भेजा गया।`,
          'message'
        );
        window.location.href = `https://wa.me/91${booking.customerPhone}?text=${encodeURIComponent(msg)}`;
      },
    });
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.locality.toLowerCase().includes(q) ||
        b.issueDescription.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusLabelHi = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return 'लंबित (नया अनुरोध)';
      case 'assigned':
        return 'मिस्त्री आवंटित';
      case 'in_progress':
        return 'कार्य प्रगति पर';
      case 'completed':
        return 'कार्य पूर्ण';
      case 'cancelled':
        return 'रद्द';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            ग्राहक बुकिंग प्रबंधन (Customer Bookings)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            ग्राहकों की वास्तविक बुकिंग दर्ज करें, क्षेत्र के अनुसार मिस्त्री नियुक्त करें और पुष्टि के बाद अपडेट भेजें।
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowNewForm((prev) => !prev);
          }}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>{showNewForm ? 'फॉर्म बंद करें' : 'नई ग्राहक बुकिंग दर्ज करें'}</span>
        </button>
      </div>

      {/* New Booking Form */}
      {showNewForm && (
        <form
          onSubmit={handleCreateBooking}
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
        >
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            नई वास्तविक ग्राहक बुकिंग दर्ज करें
          </h3>

          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                ग्राहक का नाम *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="उदा. अनुराग वर्मा"
                className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                ग्राहक मोबाइल नंबर (10 अंक) *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                maxLength={10}
                className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                आवश्यक सेवा (Service Type) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setServiceType('electrician')}
                  className={`min-h-[46px] px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    serviceType === 'electrician'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  इलेक्ट्रीशियन
                </button>
                <button
                  type="button"
                  onClick={() => setServiceType('plumber')}
                  className={`min-h-[46px] px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    serviceType === 'plumber'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  प्लंबर
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                लखनऊ इलाका (Locality) *
              </label>
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full min-h-[46px] px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {allLocalities.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                पूरा पता / लैंडमार्क
              </label>
              <input
                type="text"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="उदा. मकान सं. 4/112, पत्रकारपुरम चौराहे के पास"
                className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                समस्या / काम का विवरण *
              </label>
              <input
                type="text"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="उदा. मेन एमसीबी बार-बार गिर रहा है और इन्वर्टर लाइन चेक करनी है"
                className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                अनुमानित शुल्क (₹) एवं प्राथमिकता
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)}
                  placeholder="₹ शुल्क"
                  className="w-full min-h-[46px] px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
                />
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as BookingUrgency)}
                  className="w-full min-h-[46px] px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="normal">सामान्य (Normal)</option>
                  <option value="urgent">तत्काल (Urgent)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                तारीख (Date)
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                समय स्लॉट (Time Slot)
              </label>
              <select
                value={preferredTimeSlot}
                onChange={(e) => setPreferredTimeSlot(e.target.value)}
                className="w-full min-h-[46px] px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="सुबह 8:00 - सुबह 10:00">सुबह 8:00 - सुबह 10:00</option>
                <option value="सुबह 10:00 - दोपहर 1:00">सुबह 10:00 - दोपहर 1:00</option>
                <option value="दोपहर 1:00 - शाम 4:00">दोपहर 1:00 - शाम 4:00</option>
                <option value="शाम 4:00 - रात 8:00">शाम 4:00 - रात 8:00</option>
                <option value="तुरंत (आपातकालीन विज़िट)">तुरंत (आपातकालीन विज़िट)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                मिस्त्री आवंटित करें (वैकल्पिक)
              </label>
              <select
                value={assignedProviderId}
                onChange={(e) => setAssignedProviderId(e.target.value)}
                className="w-full min-h-[46px] px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="">-- बाद में आवंटित करें --</option>
                {(autoSuggestProviderByArea ? sortedMatchingProviders : matchingProviders).map(
                  (prov) => {
                    const covers = Array.isArray(prov.serviceAreas) && prov.serviceAreas.includes(locality);
                    return (
                      <option key={prov.id} value={prov.id}>
                        {prov.name} ({covers ? 'इसी क्षेत्र में' : 'अन्य क्षेत्र'}) · +91 {prov.phone}
                      </option>
                    );
                  }
                )}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              className="min-h-[46px] px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            >
              बुकिंग सुरक्षित करें
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {(
            [
              { id: 'all', label: `सभी (${bookings.length})` },
              {
                id: 'pending',
                label: `लंबित (${bookings.filter((b) => b.status === 'pending').length})`,
              },
              {
                id: 'assigned',
                label: `आवंटित (${bookings.filter((b) => b.status === 'assigned').length})`,
              },
              {
                id: 'in_progress',
                label: `प्रगति पर (${bookings.filter((b) => b.status === 'in_progress').length})`,
              },
              {
                id: 'completed',
                label: `पूर्ण (${bookings.filter((b) => b.status === 'completed').length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ग्राहक नाम, फोन या क्षेत्र खोजें..."
            className="w-full min-h-[42px] pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Honest Empty State (Zero Fake Bookings) */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto mb-4">
            <CalendarPlus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            अभी कोई ग्राहक बुकिंग दर्ज नहीं है
          </h3>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            इस प्रोटोटाइप में कोई भी नकली (Fake) ग्राहक बुकिंग नहीं दिखाई गई है। जब ग्राहक कॉल या व्हाट्सएप से संपर्क करें, तो उनकी वास्तविक बुकिंग यहाँ दर्ज करें।
          </p>
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="mt-5 min-h-[46px] px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 inline-flex items-center gap-2"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>पहली वास्तविक बुकिंग दर्ज करें</span>
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
          चयनित फ़िल्टर में कोई बुकिंग नहीं मिली।
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const assignedProv = providers.find((p) => p.id === booking.assignedProviderId);
            const eligibleProviders = providers.filter(
              (p) => p.category === booking.serviceType || p.category === 'both'
            );

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {booking.serviceType === 'electrician'
                          ? 'इलेक्ट्रीशियन सेवा'
                          : 'प्लंबर सेवा'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        स्थिति: <strong className="text-slate-900">{getStatusLabelHi(booking.status)}</strong>
                      </span>
                      {booking.source === 'website' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                            🌐 वेबसाइट ऑनलाइन बुकिंग
                          </span>
                        </>
                      )}
                      {booking.urgency === 'urgent' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-red-700 font-bold">तत्काल आवश्यकता (Urgent)</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                      {booking.customerName}{' '}
                      <span className="text-sm font-mono tabular-nums font-normal text-slate-600">
                        (+91 {booking.customerPhone})
                      </span>
                    </h3>
                    <p className="text-sm text-slate-700 mt-1">{booking.issueDescription}</p>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-xs text-slate-500 block">अनुमानित सेवा शुल्क</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                      ₹{booking.finalAmount ?? booking.estimatedAmount}
                    </span>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <strong className="text-slate-800">{booking.locality}</strong> — {booking.fullAddress}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {booking.preferredDate} · {booking.preferredTimeSlot}
                  </span>
                </div>

                {/* Provider Assignment & Status Control Row */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                  {/* Assign Provider */}
                  <div className="lg:col-span-5 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
                    <select
                      value={booking.assignedProviderId || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignProviderWithConfirmation(booking, e.target.value);
                        }
                      }}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-800"
                    >
                      <option value="">
                        {eligibleProviders.length === 0
                          ? '-- पहले मिस्त्री पंजीकृत करें --'
                          : '-- मिस्त्री चुनें / बदलें --'}
                      </option>
                      {eligibleProviders.map((prov) => {
                        const covers = Array.isArray(prov.serviceAreas) && prov.serviceAreas.includes(booking.locality);
                        return (
                          <option key={prov.id} value={prov.id}>
                            {prov.name} ({covers ? 'इसी क्षेत्र में' : 'अन्य क्षेत्र'}) · +91 {prov.phone}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Status Update */}
                  <div className="lg:col-span-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        handleStatusChangeWithConfirmation(
                          booking,
                          e.target.value as BookingStatus
                        )
                      }
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold text-slate-900"
                    >
                      <option value="pending">स्थिति: लंबित (Pending)</option>
                      <option value="assigned">स्थिति: मिस्त्री आवंटित</option>
                      <option value="in_progress">स्थिति: कार्य प्रगति पर</option>
                      <option value="completed">स्थिति: कार्य पूर्ण (Completed)</option>
                      <option value="cancelled">स्थिति: रद्द (Cancelled)</option>
                    </select>
                  </div>

                  {/* Direct Customer Contact (Confirmation Gated) */}
                  <div className="lg:col-span-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onRequestConfirmation({
                          titleHi: 'ग्राहक को फोन कॉल करने की पुष्टि करें',
                          descriptionHi: `क्या आप ग्राहक ${booking.customerName} को कॉल करना चाहते हैं?`,
                          recipientOrTargetHi: `${booking.customerName} (+91 ${booking.customerPhone})`,
                          impactWarningHi: 'यह आपके मोबाइल फोन डायलर में ग्राहक का नंबर खोलेगा।',
                          confirmButtonLabelHi: 'हाँ, कॉल करें',
                          onConfirm: () => {
                            window.location.href = `tel:+91${booking.customerPhone}`;
                          },
                        })
                      }
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>कॉल</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendCustomerWhatsApp(booking)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>ग्राहक को संदेश</span>
                    </button>
                  </div>
                </div>

                {assignedProv && (
                  <div className="text-xs text-slate-600 bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-200/80">
                    नियुक्त मिस्त्री: <strong className="text-slate-900">{assignedProv.name}</strong> (+91{' '}
                    <span className="font-mono tabular-nums">{assignedProv.phone}</span>)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
