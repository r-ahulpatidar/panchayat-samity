import { site } from "./site";

// शिकायत की स्थिति — शीट के "स्थिति" ड्रॉपडाउन के विकल्प और वेबसाइट पर उनका रूप।
// `label` बिल्कुल वही होना चाहिए जो शीट में लिखा है (scripts/setup-sheet.mjs की STATUS सूची से मेल)।

export const statuses = [
  {
    id: "pending",
    label: "लंबित",
    hint: "समस्या दर्ज हो गई है, जल्द काम शुरू होगा",
    step: 1,
    visible: true,
  },
  {
    id: "in-progress",
    label: "कार्य प्रगति पर",
    hint: "समस्या पर काम चल रहा है",
    step: 2,
    visible: true,
  },
  {
    id: "forwarded",
    label: "विभाग को भेजा गया",
    hint: "समस्या संबंधित सरकारी विभाग को भेजी गई है, वहां से काम होगा",
    step: 2,
    visible: true,
  },
  {
    id: "done",
    label: "पूर्ण",
    hint: "समस्या का समाधान हो गया है",
    step: 3,
    visible: true,
  },
  {
    id: "hidden",
    label: "छुपाएं",
    hint: "डुप्लीकेट / गलत / निजी शिकायत — वेबसाइट पर नहीं दिखती",
    step: 0,
    visible: false,
  },
] as const;

export type Status = (typeof statuses)[number];
export type StatusId = Status["id"];

/** नई शिकायत की डिफ़ॉल्ट स्थिति */
export const DEFAULT_STATUS = statuses[0];

// पुरानी शीट के मान, ताकि पहले से भरी पंक्तियां सही दिखें
const ALIASES: Record<string, StatusId> = {
  "समाधान हो गया": "done",
  "कार्य प्रगति पर है": "in-progress",
};

/** शीट का मान → स्थिति। खाली/अनजान मान = लंबित (दिखती रहे, खोए नहीं)। */
export function statusFromSheet(value: string | undefined): Status {
  const v = (value ?? "").trim();
  const id = ALIASES[v];
  return statuses.find((s) => s.label === v || s.id === id) ?? DEFAULT_STATUS;
}

export function getStatus(id: StatusId): Status {
  return statuses.find((s) => s.id === id) ?? DEFAULT_STATUS;
}

/** प्रगति के चरण (कार्ड पर स्टेपर) */
export const progressSteps = ["दर्ज हुई", "काम जारी", "पूर्ण"] as const;

export const issuesPage = {
  metaTitle: "समस्याओं की स्थिति",
  metaDescription: `${site.panchayatName} में दर्ज सभी जन समस्याओं की ताज़ा स्थिति — लंबित, प्रगति पर और पूर्ण।`,
  title: "समस्याओं की स्थिति",
  intro: "पंचायत में दर्ज हर समस्या, उसकी फोटो और उस पर चल रहे काम की ताज़ा जानकारी। नाम और मोबाइल नंबर कभी नहीं दिखाए जाते।",
  total: "कुल समस्याएं",
  doneShare: (done: number, total: number) => `${total} में से ${done} समस्याओं का समाधान हो चुका है`,
  all: "सभी",
  filterStatus: "स्थिति के अनुसार देखें",
  filterVillage: "गांव",
  allVillages: "सभी गांव",
  searchLabel: "अपनी शिकायत संख्या से खोजें",
  searchPlaceholder: "जैसे: JK-2026-0012",
  clear: "हटाएं",
  received: "दर्ज",
  update: "ताज़ा जानकारी",
  photoAlt: "समस्या की फोटो",
  openPhoto: "फोटो बड़ी करके देखें",
  enlarge: "बड़ा करें",
  closePhoto: "फोटो बंद करें",
  showMore: "और समस्याएं देखें",
  showing: (shown: number, total: number) => `${total} में से ${shown} दिखाई जा रही हैं`,
  empty: "इस चुनाव के अनुसार कोई समस्या नहीं मिली।",
  notFoundId: "यह शिकायत संख्या नहीं मिली। नई शिकायत यहां दिखने में कुछ मिनट लग सकते हैं।",
  noIssues: "अभी तक कोई समस्या दर्ज नहीं हुई है।",
  loadError: "अभी स्थिति लोड नहीं हो पाई। कृपया थोड़ी देर बाद फिर से देखें।",
  lastUpdated: "जानकारी अपडेट हुई",
  updatesNote: "स्थिति में बदलाव कुछ मिनटों में यहां दिखने लगते हैं।",
  cta: "अपनी समस्या बताएं",
} as const;
