export type ServiceCategory = 'electrician' | 'plumber' | 'both';

export type ProviderAvailability = 'available' | 'busy' | 'offline';

export interface ServiceProvider {
  id: string;
  name: string;
  category: ServiceCategory;
  phone: string;
  whatsapp: string;
  experienceYears: number;
  idVerified: boolean;
  skills: string[];
  serviceAreas: string[];
  baseVisitFee: number;
  availability: ProviderAvailability;
  notes: string;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export type BookingUrgency = 'normal' | 'urgent';

export interface CustomerBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  locality: string;
  fullAddress: string;
  serviceType: 'electrician' | 'plumber';
  issueDescription: string;
  urgency: BookingUrgency;
  preferredDate: string;
  preferredTimeSlot: string;
  estimatedAmount: number;
  finalAmount?: number;
  assignedProviderId?: string;
  status: BookingStatus;
  source?: 'website' | 'manual' | 'ai_assistant';
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteServiceItem {
  id: string;
  category: 'electrician' | 'plumber';
  titleHi: string;
  priceLabelHi: string;
  descriptionHi: string;
}

export interface WebsiteConfig {
  businessName: string;
  taglineHi: string;
  headlineHi: string;
  subheadlineHi: string;
  announcementBannerHi: string;
  contactPhone: string;
  whatsappNumber: string;
  operatingHoursHi: string;
  activeLocalities: string[];
  trustHighlightsHi: string[];
  services: WebsiteServiceItem[];
  seoKeywords: string[];
  enableOnlineBookingForm: boolean;
  isPublished: boolean;
  lastPublishedAt?: string;
}

export interface AutomationRule {
  id: string;
  titleHi: string;
  triggerDescriptionHi: string;
  actionType: 'whatsapp_customer' | 'whatsapp_provider' | 'auto_suggest_provider' | 'payment_feedback';
  templateMessageHi: string;
  enabled: boolean;
  requireConfirmationBeforeSend: boolean;
  lastTriggeredAt?: string;
}

export interface ActionAuditLog {
  id: string;
  timestamp: string;
  actionTitleHi: string;
  detailHi: string;
  confirmedByOwner: boolean;
  category: 'message' | 'website' | 'booking' | 'provider' | 'automation';
}

export interface ConfirmationRequest {
  titleHi: string;
  descriptionHi: string;
  impactWarningHi: string;
  recipientOrTargetHi?: string;
  messagePreviewHi?: string;
  confirmButtonLabelHi: string;
  onConfirm: () => void;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedCustomerMessage?: {
    recipientLabel: string;
    messageText: string;
  };
}

export const LUCKNOW_LOCALITIES: string[] = [
  'गोमती नगर (Gomti Nagar)',
  'गोमती नगर विस्तार (Gomti Nagar Ext)',
  'इंदिरा नगर (Indira Nagar)',
  'अलीगंज (Aliganj)',
  'हज़रतगंज (Hazratganj)',
  'आलमबाग (Alambagh)',
  'महानगर (Mahanagar)',
  'जानकीपुरम (Jankipuram)',
  'राजाजीपुरम (Rajajipuram)',
  'चिनहट (Chinhat)',
  'अमीनाबाद (Aminabad)',
  'आशियाना (Ashiyana)',
];

export const ELECTRICIAN_SKILLS: string[] = [
  'हाउस वायरिंग एवं फॉल्ट रिपेयर',
  'इन्वर्टर और बैटरी इंस्टॉलेशन',
  'एमसीबी (MCB) और फ्यूज बोर्ड रिपेयर',
  'सीलिंग फैन और लाइट फिटिंग',
  'गीज़र और हीटर इलेक्ट्रिकल रिपेयर',
  'एसी पावर पॉइंट और स्टेबलाइज़र',
];

export const PLUMBER_SKILLS: string[] = [
  'पाइप लीकेज और ब्लॉकेज रिपेयर',
  'टैप, मिक्सर और शॉवर फिटिंग',
  'वाटर टैंक और मोटर इंस्टॉलेशन',
  'वॉशबेसिन और सिंक ड्रेनेज रिपेयर',
  'बाथरूम और टॉयलेट सीट फिटिंग',
  'गीज़र पाइपलाइन कनेक्शन',
];

export const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = {
  businessName: 'लखनऊ सेवा (LucknowSeva)',
  taglineHi: 'लखनऊ की भरोसेमंद इलेक्ट्रीशियन और प्लंबर होम सर्विस',
  headlineHi: 'घर या दुकान की बिजली और प्लंबिंग समस्या का त्वरित समाधान',
  subheadlineHi: 'गोमती नगर, इंदिरा नगर, अलीगंज, हज़रतगंज और पूरे लखनऊ में सत्यापित कारीगरों द्वारा पारदर्शी सेवा।',
  announcementBannerHi: 'सुबह 8:00 बजे से रात 9:00 बजे तक बुकिंग उपलब्ध • काम शुरू करने से पहले स्पष्ट शुल्क जानकारी',
  contactPhone: '',
  whatsappNumber: '',
  operatingHoursHi: 'प्रतिदिन सुबह 8:00 बजे से रात 9:00 बजे तक',
  activeLocalities: [
    'गोमती नगर (Gomti Nagar)',
    'इंदिरा नगर (Indira Nagar)',
    'अलीगंज (Aliganj)',
    'हज़रतगंज (Hazratganj)',
    'आलमबाग (Alambagh)',
  ],
  trustHighlightsHi: [
    'पंजीकृत और पहचान-सत्यापित स्थानीय मिस्त्री',
    'काम शुरू होने से पहले स्पष्ट अनुमानित शुल्क',
    'कोई छुपा हुआ अतिरिक्त चार्ज नहीं',
  ],
  services: [
    {
      id: 'srv-elec-1',
      category: 'electrician',
      titleHi: 'बिजली फॉल्ट, एमसीबी और वायरिंग जांच',
      priceLabelHi: '₹149 विज़िट शुल्क से शुरू',
      descriptionHi: 'शॉर्ट सर्किट, एमसीबी ट्रिपिंग, स्विचबोर्ड और पंखे की मरम्मत।',
    },
    {
      id: 'srv-elec-2',
      category: 'electrician',
      titleHi: 'इन्वर्टर, गीज़र और उपकरण इंस्टॉलेशन',
      priceLabelHi: '₹299 से शुरू',
      descriptionHi: 'नया इन्वर्टर कनेक्शन, गीज़र पॉइंट और भारी उपकरणों की सुरक्षित फिटिंग।',
    },
    {
      id: 'srv-plumb-1',
      category: 'plumber',
      titleHi: 'नल, पाइप लीकेज और ब्लॉकेज रिपेयर',
      priceLabelHi: '₹149 विज़िट शुल्क से शुरू',
      descriptionHi: 'किचन सिंक, बाथरूम टैप, मिक्सर और पाइप लीकेज का पक्का समाधान।',
    },
    {
      id: 'srv-plumb-2',
      category: 'plumber',
      titleHi: 'पानी की टंकी और मोटर फिटिंग',
      priceLabelHi: '₹349 से शुरू',
      descriptionHi: 'ओवरहेड टैंक, फ्लोट वाल्व और वाटर मोटर पंप की फिटिंग व रिपेयर।',
    },
  ],
  seoKeywords: [
    'लखनऊ इलेक्ट्रीशियन सर्विस',
    'लखनऊ प्लंबर बुकिंग',
    'Gomti Nagar Electrician Plumber',
    'LucknowSeva Home Service',
  ],
  enableOnlineBookingForm: true,
  isPublished: false,
};

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'auto-booking-ack',
    titleHi: 'नई बुकिंग प्राप्त होने पर ग्राहक पावती संदेश',
    triggerDescriptionHi: 'जब कोई नई ग्राहक बुकिंग दर्ज की जाती है',
    actionType: 'whatsapp_customer',
    templateMessageHi:
      'नमस्कार {{ग्राहक_नाम}} जी, लखनऊ सेवा (LucknowSeva) में आपकी {{सेवा}} बुकिंग ({{क्षेत्र}}) दर्ज हो गई है। हम शीघ्र ही मिस्त्री का विवरण साझा करेंगे।',
    enabled: true,
    requireConfirmationBeforeSend: true,
  },
  {
    id: 'auto-provider-dispatch',
    titleHi: 'मिस्त्री आवंटित होने पर ग्राहक व मिस्त्री को सूचना',
    triggerDescriptionHi: 'जब किसी बुकिंग पर इलेक्ट्रीशियन या प्लंबर नियुक्त किया जाता है',
    actionType: 'whatsapp_provider',
    templateMessageHi:
      'नमस्कार {{ग्राहक_नाम}} जी, आपकी बुकिंग के लिए मिस्त्री {{मिस्त्री_नाम}} ({{मिस्त्री_फोन}}) को नियुक्त किया गया है। समय: {{समय}}।',
    enabled: true,
    requireConfirmationBeforeSend: true,
  },
  {
    id: 'auto-area-match',
    titleHi: 'लखनऊ क्षेत्र के अनुसार उपलब्ध मिस्त्री का स्वतः सुझाव',
    triggerDescriptionHi: 'बुकिंग फॉर्म में ग्राहक का इलाका (Locality) चुनते समय',
    actionType: 'auto_suggest_provider',
    templateMessageHi: 'चयनित क्षेत्र और कौशल से मेल खाने वाले उपलब्ध मिस्त्रियों को सबसे ऊपर दिखाएं।',
    enabled: true,
    requireConfirmationBeforeSend: true,
  },
  {
    id: 'auto-completion-receipt',
    titleHi: 'कार्य पूर्ण होने पर बिल सारांश और फीडबैक संदेश',
    triggerDescriptionHi: 'जब बुकिंग की स्थिति "पूर्ण (Completed)" चिह्नित की जाती है',
    actionType: 'payment_feedback',
    templateMessageHi:
      'नमस्कार {{ग्राहक_नाम}} जी, लखनऊ सेवा का उपयोग करने के लिए धन्यवाद! कुल सेवा शुल्क: ₹{{राशि}}। कृपया अपना अनुभव साझा करें।',
    enabled: false,
    requireConfirmationBeforeSend: true,
  },
];
