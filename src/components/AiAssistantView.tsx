import React, { useState } from 'react';
import {
  Send,
  Bot,
  User,
  MessageSquare,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import {
  ChatMessage,
  ServiceProvider,
  CustomerBooking,
  ConfirmationRequest,
} from '../types';

interface AiAssistantViewProps {
  providers: ServiceProvider[];
  bookings: CustomerBooking[];
  onRequestConfirmation: (req: ConfirmationRequest) => void;
  onLogAction: (titleHi: string, detailHi: string, category: 'message') => void;
}

const QUICK_PROMPTS_HI = [
  'वेबसाइट से प्राप्त हालिया ग्राहक बुकिंग और उनकी स्थिति दिखाओ।',
  'लंबित ग्राहक बुकिंग के लिए उपयुक्त स्थानीय मिस्त्री का सुझाव दो।',
  'ग्राहक को बुकिंग कन्फर्मेशन के लिए एक पेशेवर हिंदी व्हाट्सएप संदेश लिखें।',
  'गोमती नगर और इंदिरा नगर में अधिक इलेक्ट्रीशियन और प्लंबर बुकिंग कैसे पाएं?',
];

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  providers,
  bookings,
  onRequestConfirmation,
  onLogAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: `नमस्कार! मैं लखनऊ सेवा (LucknowSeva) का AI बिज़नेस सहायक हूँ।\n\nआपके वास्तविक व्यवसाय रिकॉर्ड में अभी ${providers.length} मिस्त्री और ${bookings.length} ग्राहक बुकिंग दर्ज हैं।\n\nआप मुझसे ग्राहकों के लिए व्हाट्सएप संदेश लिखवाने, सेवा के रेट तय करने, वेबसाइट सुधारने या व्यवसाय बढ़ाने के बारे में हिंदी में पूछ सकते हैं।`,
      timestamp: new Date().toLocaleTimeString('hi-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customRecipientPhone, setCustomRecipientPhone] = useState('');

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend ?? inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('hi-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptToSend) setInputText('');
    setIsLoading(true);

    try {
      const businessSnapshot = {
        totalProviders: providers.length,
        electricians: providers.filter(
          (p) => p.category === 'electrician' || p.category === 'both'
        ).length,
        plumbers: providers.filter(
          (p) => p.category === 'plumber' || p.category === 'both'
        ).length,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter((b) => b.status === 'pending').length,
        completedBookings: bookings.filter((b) => b.status === 'completed').length,
        coveredLocalities: Array.from(
          new Set(
            (providers || []).flatMap((p) =>
              p && Array.isArray(p.serviceAreas) ? p.serviceAreas : []
            )
          )
        ),
        recentBookings: bookings.slice(0, 10).map((b) => ({
          id: b.id,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          locality: b.locality,
          serviceType: b.serviceType,
          issueDescription: b.issueDescription,
          status: b.status,
          source: b.source || 'website',
          createdAt: b.createdAt,
        })),
        registeredProviders: providers.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          phone: p.phone,
          serviceAreas: p.serviceAreas,
          availability: p.availability,
        })),
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          businessSnapshot,
        }),
      });

      const data = await res.json();
      const replyText =
        data.reply ||
        'क्षमा करें, अभी उत्तर प्राप्त नहीं हो सका। कृपया पुनः प्रयास करें।';

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('hi-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'नेटवर्क त्रुटि: अभी सर्वर से संपर्क नहीं हो सका। कृपया अपना कनेक्शन जांचें।',
          timestamp: new Date().toLocaleTimeString('hi-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareDraftWithConfirmation = (draftText: string) => {
    const cleanedPhone = customRecipientPhone.replace(/\D/g, '').slice(-10);
    onRequestConfirmation({
      titleHi: 'AI द्वारा तैयार संदेश भेजने की पुष्टि करें',
      descriptionHi:
        'क्या आप इस संदेश को ग्राहक या मिस्त्री को व्हाट्सएप के माध्यम से भेजना चाहते हैं?',
      recipientOrTargetHi: cleanedPhone
        ? `+91 ${cleanedPhone}`
        : 'व्हाट्सएप संपर्क चयन (WhatsApp Contact Picker)',
      messagePreviewHi: draftText,
      impactWarningHi:
        'आपकी पुष्टि के बिना कोई भी संदेश वास्तविक ग्राहक को नहीं भेजा जाता है।',
      confirmButtonLabelHi: 'हाँ, व्हाट्सएप में खोलें',
      onConfirm: () => {
        onLogAction(
          'AI चैट से ग्राहक संदेश साझा किया गया',
          cleanedPhone
            ? `+91 ${cleanedPhone} के लिए संदेश खोला गया।`
            : 'व्हाट्सएप में संदेश ड्राफ्ट खोला गया।',
          'message'
        );
        const url = cleanedPhone
          ? `https://wa.me/91${cleanedPhone}?text=${encodeURIComponent(draftText)}`
          : `https://wa.me/?text=${encodeURIComponent(draftText)}`;
        window.location.href = url;
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            लखनऊ सेवा AI बिज़नेस चैट सहायक
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            अपने व्यवसाय के निर्णय, ग्राहक संदेश, रेट कार्ड और समस्याओं के समाधान के लिए हिंदी में बात करें।
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setMessages([
              {
                id: `welcome-${Date.now()}`,
                role: 'assistant',
                text: `चैट रीसेट कर दी गई है। आपके वास्तविक रिकॉर्ड में अभी ${providers.length} मिस्त्री और ${bookings.length} बुकिंग हैं। बताइए, मैं आज लखनऊ सेवा की कैसे मदद करूँ?`,
                timestamp: new Date().toLocaleTimeString('hi-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ])
          }
          className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>नई बातचीत शुरू करें</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Chat Area */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Quick Prompts Bar */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              त्वरित बिज़नेस प्रश्न (टैप करके पूछें):
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS_HI.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 hover:border-slate-400 text-left transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="p-4 sm:p-5 space-y-4 max-h-[460px] overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-900 text-white'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Bot className="w-5 h-5" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-slate-50 border border-slate-200 text-slate-900'
                      : 'bg-slate-900 text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  <div
                    className={`mt-2.5 pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] ${
                      msg.role === 'assistant'
                        ? 'border-slate-200/80 text-slate-500'
                        : 'border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-mono tabular-nums">{msg.timestamp}</span>

                    {msg.role === 'assistant' && msg.id !== 'welcome-msg' && (
                      <button
                        type="button"
                        onClick={() => handleShareDraftWithConfirmation(msg.text)}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold hover:bg-slate-100 inline-flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                        <span>पुष्टि के बाद व्हाट्सएप पर भेजें</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 p-3 text-xs text-slate-600">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <span>AI सहायक आपके व्यवसाय डेटा के अनुसार उत्तर तैयार कर रहा है...</span>
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center gap-2.5"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="यहाँ हिंदी या इंग्लिश में अपना सवाल लिखें..."
              className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>भेजें</span>
            </button>
          </form>
        </div>

        {/* Right Column: Live Context & Safe Message Sender */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              चैट में जुड़ा वास्तविक व्यवसाय डेटा
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI सहायक कभी भी नकली आंकड़े नहीं बनाता। वह नीचे दिए गए आपके वास्तविक डेटा का उपयोग करता है:
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">पंजीकृत मिस्त्री (Real Providers):</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {providers.length}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">कुल वास्तविक बुकिंग:</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {bookings.length}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">लंबित बुकिंग (Pending):</span>
                <span className="font-mono tabular-nums font-bold text-amber-800">
                  {bookings.filter((b) => b.status === 'pending').length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <h3 className="text-sm font-bold">
                सुरक्षित संदेश प्रेषण (Confirmation Gate)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              यदि आप AI द्वारा लिखे किसी संदेश को किसी ग्राहक या मिस्त्री के नंबर पर भेजना चाहते हैं, तो नीचे उनका 10-अंकों का मोबाइल नंबर लिखें। भेजने से पहले आपसे पुष्टि मांगी जाएगी।
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                प्राप्तकर्ता का मोबाइल नंबर (वैकल्पिक)
              </label>
              <input
                type="tel"
                maxLength={10}
                value={customRecipientPhone}
                onChange={(e) => setCustomRecipientPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
