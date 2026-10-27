// पूरे साइट में बार-बार आने वाले शब्द।

export const common = {
  cta: "अपनी समस्या बताएं",
  callUs: "कॉल करें",
  whatsappUs: "WhatsApp करें",
  skipToContent: "मुख्य सामग्री पर जाएं",
  menu: "मेनू",
  nav: [
    { href: "/", label: "मुख्य पृष्ठ" },
    { href: "/samasya-batayen", label: "समस्या बताएं" },
    { href: "/samasya-sthiti", label: "समस्याओं की स्थिति" },
    { href: "/prathmiktayen", label: "प्राथमिकताएं" },
    { href: "/hamare-bare-mein", label: "हमारे बारे में" },
    { href: "/sampark", label: "संपर्क करें" },
  ],
  footer: {
    privacy: "गोपनीयता नीति",
    purpose: "यह वेबसाइट क्षेत्र के लोगों की समस्याएं सीधे प्रतिनिधि तक पहुंचाने के लिए बनाई गई है।",
  },
  notFound: {
    title: "यह पेज नहीं मिला",
    body: "आप जो पेज ढूंढ रहे हैं वह मौजूद नहीं है।",
    back: "मुख्य पृष्ठ पर जाएं",
  },
} as const;
