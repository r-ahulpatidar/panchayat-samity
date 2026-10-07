// प्रतिनिधि को भेजे जाने वाले संदेश के शब्द।
// Cloud API टेम्पलेट का असली टेक्स्ट Meta WhatsApp Manager में अप्रूव होता है (README देखें);
// यहां का टेक्स्ट wa.me फॉलबैक संदेश के लिए है।

export const waMessage = {
  heading: "नई जन समस्या प्राप्त हुई",
  id: "शिकायत आईडी",
  name: "नाम",
  mobile: "मोबाइल नंबर",
  village: "गांव",
  category: "श्रेणी",
  description: "समस्या का विवरण",
  location: "स्थान",
  date: "प्राप्त होने की तारीख",
  truncated: "… (पूरा विवरण शीट में देखें)",
} as const;
