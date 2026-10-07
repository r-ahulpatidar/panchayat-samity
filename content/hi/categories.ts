// समस्या की श्रेणियां। `id` URL और कोड में, `label` शीट और UI में उपयोग होता है।

export const categories = [
  { id: "sadak", label: "सड़क", icon: "🛣️", description: "टूटी सड़क, गड्ढे, कच्चा रास्ता" },
  { id: "pani", label: "पानी", icon: "🚰", description: "पीने का पानी, हैंडपंप, पाइपलाइन" },
  { id: "bijli", label: "बिजली", icon: "⚡", description: "बिजली कटौती, ट्रांसफार्मर, कनेक्शन" },
  { id: "safai", label: "साफ-सफाई", icon: "🧹", description: "कचरा, गंदगी, सार्वजनिक शौचालय" },
  { id: "nali", label: "नाली / जल निकासी", icon: "🌊", description: "भरी हुई नाली, पानी का भराव" },
  { id: "street-light", label: "स्ट्रीट लाइट", icon: "💡", description: "खराब या बंद स्ट्रीट लाइट" },
  { id: "swasthya", label: "स्वास्थ्य", icon: "🏥", description: "स्वास्थ्य केंद्र, दवाइयां, एम्बुलेंस" },
  { id: "shiksha", label: "शिक्षा", icon: "📚", description: "स्कूल, शिक्षक, आंगनबाड़ी" },
  { id: "yojana", label: "सरकारी योजनाएं", icon: "📋", description: "पेंशन, राशन, आवास, अन्य योजनाएं" },
  { id: "anya", label: "अन्य समस्या", icon: "📝", description: "कोई भी अन्य स्थानीय समस्या" },
] as const;

export type Category = (typeof categories)[number];
export type CategoryId = Category["id"];

export const categoryIds = categories.map((c) => c.id) as [CategoryId, ...CategoryId[]];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
