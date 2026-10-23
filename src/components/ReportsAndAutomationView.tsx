import React from 'react';
import {
  BarChart3,
  Download,
  ShieldCheck,
  BellRing,
  CheckCircle2,
  History,
  Trash2,
} from 'lucide-react';
import {
  ServiceProvider,
  CustomerBooking,
  AutomationRule,
  ActionAuditLog,
  ConfirmationRequest,
} from '../types';

interface ReportsAndAutomationViewProps {
  providers: ServiceProvider[];
  bookings: CustomerBooking[];
  automationRules: AutomationRule[];
  auditLogs: ActionAuditLog[];
  onToggleAutomationRule: (ruleId: string) => void;
  onToggleRuleConfirmationLock: (ruleId: string) => void;
  onUpdateRuleTemplate: (ruleId: string, newTemplate: string) => void;
  onTestAutomationRule: (rule: AutomationRule) => void;
  onClearAllDataWithConfirmation: () => void;
  onRequestConfirmation: (req: ConfirmationRequest) => void;
}

export const ReportsAndAutomationView: React.FC<ReportsAndAutomationViewProps> = ({
  providers,
  bookings,
  automationRules,
  auditLogs,
  onToggleAutomationRule,
  onToggleRuleConfirmationLock,
  onUpdateRuleTemplate,
  onTestAutomationRule,
  onClearAllDataWithConfirmation,
}) => {
  // Real Business Report Calculations (Zero Fake Metrics)
  const safeBookings = (bookings || []).filter(Boolean);
  const safeProviders = (providers || []).filter(Boolean);

  const totalBookings = safeBookings.length;
  const pendingCount = safeBookings.filter((b) => b && b.status === 'pending').length;
  const assignedCount = safeBookings.filter((b) => b && b.status === 'assigned').length;
  const inProgressCount = safeBookings.filter((b) => b && b.status === 'in_progress').length;
  const completedBookings = safeBookings.filter((b) => b && b.status === 'completed');
  const cancelledCount = safeBookings.filter((b) => b && b.status === 'cancelled').length;

  const totalCompletedRevenue = completedBookings.reduce(
    (sum, b) => sum + (b.finalAmount ?? b.estimatedAmount ?? 0),
    0
  );
  const totalPipelineValue = safeBookings
    .filter((b) => b && b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.finalAmount ?? b.estimatedAmount ?? 0), 0);

  const electricianBookings = safeBookings.filter(
    (b) => b && b.serviceType === 'electrician'
  ).length;
  const plumberBookings = safeBookings.filter((b) => b && b.serviceType === 'plumber').length;

  // Locality Breakdown from Real Bookings
  const localityStats = Array.from(
    safeBookings.reduce((map, b) => {
      if (!b) return map;
      const locKey = b.locality || 'अन्य लखनऊ क्षेत्र';
      const current = map.get(locKey) || { count: 0, revenue: 0 };
      current.count += 1;
      if (b.status === 'completed') {
        current.revenue += b.finalAmount ?? b.estimatedAmount ?? 0;
      }
      map.set(locKey, current);
      return map;
    }, new Map<string, { count: number; revenue: number }>())
  );

  const handleDownloadCsv = () => {
    const headers = [
      'Booking_ID',
      'Customer_Name',
      'Phone',
      'Locality',
      'Service_Type',
      'Status',
      'Date',
      'Amount_INR',
    ];
    const rows = bookings.map((b) => [
      b.id,
      `"${b.customerName.replace(/"/g, '""')}"`,
      b.customerPhone,
      `"${b.locality.replace(/"/g, '""')}"`,
      b.serviceType,
      b.status,
      b.preferredDate,
      String(b.finalAmount ?? b.estimatedAmount),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `lucknowseva_bookings_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Booking Status & Business Reports */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              बुकिंग स्थिति और व्यापार रिपोर्ट (Business Reports)
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              यह रिपोर्ट केवल आपके द्वारा दर्ज किए गए वास्तविक मिस्त्रियों और वास्तविक ग्राहक बुकिंग पर आधारित है।
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={bookings.length === 0}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>रिपोर्ट CSV डाउनलोड करें</span>
          </button>
        </div>

        {/* 4-Column Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">कुल वास्तविक बुकिंग</span>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {totalBookings}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              इलेक्ट्रीशियन: <span className="font-mono tabular-nums">{electricianBookings}</span> · प्लंबर:{' '}
              <span className="font-mono tabular-nums">{plumberBookings}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">पूर्ण बुकिंग से वास्तविक आय</span>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
              ₹{totalCompletedRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              पूर्ण कार्य: <span className="font-mono tabular-nums">{completedBookings.length}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">कुल संभावित आय (Pipeline)</span>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              ₹{totalPipelineValue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              लंबित + प्रगति पर बुकिंग सहित
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">पंजीकृत मिस्त्री नेटवर्क</span>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {providers.length}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              उपलब्ध:{' '}
              <span className="font-mono tabular-nums">
                {providers.filter((p) => p.availability === 'available').length}
              </span>
            </p>
          </div>
        </div>

        {/* Status Breakdown & Locality Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-700" />
              <span>बुकिंग स्थिति विवरण (Booking Status Summary)</span>
            </h3>
            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-700">1. लंबित (Pending — नया अनुरोध)</span>
                <span className="font-mono tabular-nums font-bold text-amber-800">
                  {pendingCount}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-700">2. मिस्त्री आवंटित (Provider Assigned)</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {assignedCount}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-700">3. कार्य प्रगति पर (In Progress)</span>
                <span className="font-mono tabular-nums font-bold text-sky-700">
                  {inProgressCount}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-700">4. कार्य पूर्ण (Completed)</span>
                <span className="font-mono tabular-nums font-bold text-emerald-700">
                  {completedBookings.length}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-700">5. रद्द (Cancelled)</span>
                <span className="font-mono tabular-nums font-bold text-red-700">
                  {cancelledCount}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              लखनऊ क्षेत्र-वार वास्तविक मांग (Locality Report)
            </h3>
            {localityStats.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                जब आप वास्तविक ग्राहक बुकिंग जोड़ेंगे, तो यहाँ लखनऊ के प्रत्येक इलाके की मांग और आय स्वतः दिखाई देगी।
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                {localityStats.map(([loc, stats]) => (
                  <div key={loc} className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-800 font-medium">{loc}</span>
                    <div className="font-mono tabular-nums text-right">
                      <span className="text-slate-700">{stats.count} बुकिंग</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className="font-bold text-slate-900">₹{stats.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Automation Settings for Repetitive Tasks */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            दोहराए जाने वाले कार्यों के लिए ऑटोमेशन सेटिंग्स (Automation)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            बार-बार होने वाले कार्यों के लिए स्मार्ट नियम और संदेश टेम्पलेट सेट करें। ग्राहक सुरक्षा के लिए प्रत्येक संदेश भेजने से पहले आपकी पुष्टि अनिवार्य है।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {automationRules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{rule.titleHi}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ट्रिगर: {rule.triggerDescriptionHi}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleAutomationRule(rule.id)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      rule.enabled
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {rule.enabled ? 'सक्रिय (ON)' : 'बंद (OFF)'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    स्वचालित संदेश टेम्पलेट / नियम:
                  </label>
                  <textarea
                    rows={2}
                    value={rule.templateMessageHi}
                    onChange={(e) => onUpdateRuleTemplate(rule.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.requireConfirmationBeforeSend}
                    onChange={() => onToggleRuleConfirmationLock(rule.id)}
                    className="w-4 h-4 accent-slate-900 rounded"
                  />
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    भेजने से पहले हमेशा पुष्टि मांगें
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => onTestAutomationRule(rule)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <BellRing className="w-3.5 h-3.5 text-amber-700" />
                  <span>टेस्ट और पुष्टि जांचें</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Confirmed Actions Audit History & Data Reset */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              पुष्टि किए गए कार्यों का लॉग (Confirmed Action History)
            </h3>
          </div>

          {(providers.length > 0 || bookings.length > 0) && (
            <button
              type="button"
              onClick={onClearAllDataWithConfirmation}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>सभी दर्ज रिकॉर्ड रीसेट करें</span>
            </button>
          )}
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">
            अभी तक कोई बाहरी संदेश या वेबसाइट प्रकाशन नहीं किया गया है। जब आप किसी कार्य की पुष्टि (Confirm) करेंगे, तो उसका विवरण यहाँ दर्ज होगा।
          </p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <div>
                  <span className="font-semibold text-slate-900">
                    {log.actionTitleHi}
                  </span>
                  <span className="text-slate-600"> — {log.detailHi}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 shrink-0">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    मालिक द्वारा पुष्टि कृत
                  </span>
                  <span className="font-mono tabular-nums">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
