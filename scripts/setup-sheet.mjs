// एक बार चलाएं: npm run sheet:setup
// .env.local से क्रेडेंशियल पढ़कर Google Sheet को तैयार करता है —
// टैब का नाम, हेडर पंक्ति, पहली पंक्ति फ्रीज़, "स्थिति" ड्रॉपडाउन + रंग, अनुरोध कुंजी कॉलम छुपाना।
// दोबारा चलाना सुरक्षित है (मौजूदा शिकायतें नहीं बदलतीं)।

import { JWT } from "google-auth-library";

try {
  process.loadEnvFile(".env.local");
} catch {
  console.error("✗ .env.local नहीं मिली। प्रोजेक्ट फोल्डर से चलाएं।");
  process.exit(1);
}

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const sheetId = process.env.GOOGLE_SHEET_ID;
const tab = process.env.GOOGLE_SHEET_TAB || "शिकायतें";

if (!email || !key || !sheetId) {
  console.error("✗ .env.local में GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY और GOOGLE_SHEET_ID भरें।");
  process.exit(1);
}

// lib/services/google-sheets.ts के SHEET_HEADERS और content/hi/status.ts के statuses से मेल खाना चाहिए
const HEADERS = [
  "शिकायत आईडी",
  "प्राप्ति तिथि",
  "नाम",
  "मोबाइल नंबर",
  "गांव",
  "श्रेणी",
  "विवरण",
  "स्थान",
  "फोटो URL",
  "स्थिति",
  "टिप्पणी (आंतरिक)",
  "WhatsApp स्थिति",
  "अनुरोध कुंजी",
  "वेबसाइट पर टिप्पणी",
];
// ड्रॉपडाउन का क्रम = काम का क्रम; "छुपाएं" वाली शिकायत वेबसाइट पर नहीं दिखती
const STATUS = [
  { value: "लंबित", color: { red: 1, green: 0.95, blue: 0.8 } },
  { value: "कार्य प्रगति पर", color: { red: 0.85, green: 0.92, blue: 1 } },
  { value: "विभाग को भेजा गया", color: { red: 0.93, green: 0.9, blue: 1 } },
  { value: "पूर्ण", color: { red: 0.85, green: 0.96, blue: 0.87 } },
  { value: "छुपाएं", color: { red: 0.9, green: 0.9, blue: 0.9 } },
];
const STATUS_COL = 9; // J
const KEY_COL = 12; // M
const PUBLIC_NOTE_COL = 13; // N
const LAST_COL = 13; // N
const COLORS = {
  white: { red: 1, green: 1, blue: 1 },
  ink: { red: 0.11, green: 0.1, blue: 0.09 }, // #1c1917
  brandDark: { red: 0.6, green: 0.2, blue: 0.07 }, // #9a3412
  idColumn: { red: 1, green: 0.945, blue: 0.902 }, // #fff1e6
  band: { red: 0.984, green: 0.969, blue: 0.949 }, // #fbf7f2
};
const WIDTHS = [130, 140, 160, 120, 120, 120, 380, 220, 220, 160, 220, 130, 100, 300];

const auth = new JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
const api = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
const call = async (url, method = "GET", data) => (await auth.request({ url, method, data })).data;

try {
  const meta = await call(`${api}?fields=properties.title,sheets.properties`);
  console.log(`✓ शीट मिली: "${meta.properties.title}"`);

  let sheet = meta.sheets.find((s) => s.properties.title === tab)?.properties;
  const requests = [];
  if (!sheet) {
    sheet = meta.sheets[0].properties;
    requests.push({
      updateSheetProperties: { properties: { sheetId: sheet.sheetId, title: tab }, fields: "title" },
    });
    console.log(`✓ पहले टैब का नाम बदलकर "${tab}" किया`);
  }
  const id = sheet.sheetId;

  // पढ़ने में आसानी: हेडर पंक्ति और आईडी कॉलम अलग रंग में, बड़ा फ़ॉन्ट, पट्टीदार पंक्तियां
  const DATA = { sheetId: id, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: LAST_COL + 1 };
  const ID_CELLS = { sheetId: id, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 };
  requests.push(
    {
      // पहली पंक्ति (हेडर) और पहला कॉलम (आईडी) स्क्रॉल करते समय दिखते रहें
      updateSheetProperties: {
        properties: { sheetId: id, gridProperties: { frozenRowCount: 1, frozenColumnCount: 1 } },
        fields: "gridProperties(frozenRowCount,frozenColumnCount)",
      },
    },
    {
      // सभी शिकायतें: सामान्य गहरा टेक्स्ट, फ़ॉन्ट 11, बीच में संरेखित, कोई अलग पृष्ठभूमि नहीं (पट्टियां banding से)।
      // ज़रूरी: वेबसाइट से जुड़ी हर नई पंक्ति ऊपर वाली पंक्ति का फ़ॉर्मेट लेती है — पहली पंक्ति ने हेडर का
      // सफ़ेद-बोल्ड फ़ॉर्मेट ले लिया था, इसलिए यहां टेक्स्ट का रंग और bold साफ़ तौर पर तय करते हैं।
      repeatCell: {
        range: DATA,
        cell: {
          userEnteredFormat: {
            textFormat: { bold: false, fontSize: 11, foregroundColor: COLORS.ink },
            verticalAlignment: "MIDDLE",
          },
        },
        fields: "userEnteredFormat.textFormat,userEnteredFormat.verticalAlignment,userEnteredFormat.backgroundColor",
      },
    },
    {
      // आईडी कॉलम: बोल्ड, गहरा केसरिया, हल्की केसरिया पृष्ठभूमि
      repeatCell: {
        range: ID_CELLS,
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true, fontSize: 11, foregroundColor: COLORS.brandDark },
            backgroundColor: COLORS.idColumn,
          },
        },
        fields: "userEnteredFormat(textFormat,backgroundColor)",
      },
    },
    {
      // स्थिति कॉलम बोल्ड (रंग conditional formatting से आते हैं)
      repeatCell: {
        range: { sheetId: id, startRowIndex: 1, startColumnIndex: STATUS_COL, endColumnIndex: STATUS_COL + 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 11 }, horizontalAlignment: "CENTER" } },
        fields: "userEnteredFormat.textFormat.bold,userEnteredFormat.textFormat.fontSize,userEnteredFormat.horizontalAlignment",
      },
    },
    {
      // हेडर पंक्ति: बड़ा बोल्ड सफ़ेद टेक्स्ट, गहरी केसरिया पृष्ठभूमि
      repeatCell: {
        range: { sheetId: id, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: LAST_COL + 1 },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true, fontSize: 12, foregroundColor: COLORS.white },
            backgroundColor: COLORS.brandDark,
            wrapStrategy: "WRAP",
            verticalAlignment: "MIDDLE",
            horizontalAlignment: "CENTER",
          },
        },
        fields: "userEnteredFormat(textFormat,backgroundColor,wrapStrategy,verticalAlignment,horizontalAlignment)",
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: id, dimension: "ROWS", startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 48 },
        fields: "pixelSize",
      },
    },
    {
      repeatCell: {
        range: { sheetId: id, startRowIndex: 1, startColumnIndex: 6, endColumnIndex: 7 },
        cell: { userEnteredFormat: { wrapStrategy: "WRAP" } },
        fields: "userEnteredFormat.wrapStrategy",
      },
    },
    {
      setDataValidation: {
        range: { sheetId: id, startRowIndex: 1, startColumnIndex: STATUS_COL, endColumnIndex: STATUS_COL + 1 },
        rule: {
          condition: { type: "ONE_OF_LIST", values: STATUS.map((s) => ({ userEnteredValue: s.value })) },
          showCustomUi: true,
          strict: true,
        },
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: id, dimension: "COLUMNS", startIndex: KEY_COL, endIndex: KEY_COL + 1 },
        properties: { hiddenByUser: true },
        fields: "hiddenByUser",
      },
    },
    ...WIDTHS.map((px, i) => ({
      updateDimensionProperties: {
        range: { sheetId: id, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 },
        properties: { pixelSize: px },
        fields: "pixelSize",
      },
    })),
  );

  // पट्टीदार पंक्तियां (B→N; आईडी कॉलम का अपना रंग है) — पुरानी banding हटाकर नई
  const banded = await call(`${api}?fields=sheets(properties.sheetId,bandedRanges.bandedRangeId)`);
  for (const b of banded.sheets.find((x) => x.properties.sheetId === id)?.bandedRanges ?? []) {
    requests.push({ deleteBanding: { bandedRangeId: b.bandedRangeId } });
  }
  requests.push({
    addBanding: {
      bandedRange: {
        range: { sheetId: id, startRowIndex: 1, startColumnIndex: 1, endColumnIndex: LAST_COL + 1 },
        rowProperties: { firstBandColor: COLORS.white, secondBandColor: COLORS.band },
      },
    },
  });

  // वेबसाइट वाली टिप्पणी का कॉलम हल्के हरे रंग में, ताकि स्टाफ को पता रहे यह सार्वजनिक है
  requests.push({
    repeatCell: {
      range: { sheetId: id, startRowIndex: 1, startColumnIndex: PUBLIC_NOTE_COL, endColumnIndex: PUBLIC_NOTE_COL + 1 },
      cell: { userEnteredFormat: { backgroundColor: { red: 0.93, green: 0.99, blue: 0.95 }, wrapStrategy: "WRAP" } },
      fields: "userEnteredFormat(backgroundColor,wrapStrategy)",
    },
  });

  // स्थिति के रंग — पुराने नियम हटाकर नए जोड़ें (दोबारा चलाना सुरक्षित)
  const cf = await call(`${api}?fields=sheets(properties.sheetId,conditionalFormats)`);
  const existing = cf.sheets.find((s) => s.properties.sheetId === id)?.conditionalFormats ?? [];
  for (let i = existing.length - 1; i >= 0; i--) {
    requests.push({ deleteConditionalFormatRule: { sheetId: id, index: i } });
  }
  STATUS.forEach((s, index) =>
    requests.push({
      addConditionalFormatRule: {
        index,
        rule: {
          ranges: [{ sheetId: id, startRowIndex: 1, startColumnIndex: STATUS_COL, endColumnIndex: STATUS_COL + 1 }],
          booleanRule: {
            condition: { type: "TEXT_EQ", values: [{ userEnteredValue: s.value }] },
            format: { backgroundColor: s.color },
          },
        },
      },
    }),
  );

  await call(`${api}:batchUpdate`, "POST", { requests });

  const range = encodeURIComponent(`'${tab}'!A1:N1`);
  await call(`${api}/values/${range}?valueInputOption=RAW`, "PUT", { values: [HEADERS] });

  console.log("✓ हेडर पंक्ति, फ्रीज़, स्थिति ड्रॉपडाउन (5 विकल्प), रंग और 'वेबसाइट पर टिप्पणी' कॉलम सेट हो गए");
  console.log("✓ पढ़ने में आसानी: बड़ा फ़ॉन्ट, गहरा हेडर, आईडी कॉलम फ्रीज़ + हाइलाइट, पट्टीदार पंक्तियां");
  console.log(`\nशीट तैयार है: https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
} catch (error) {
  const status = error?.response?.status;
  if (status === 403) {
    console.error(`✗ अनुमति नहीं मिली। शीट को इस ईमेल के साथ "Editor" के रूप में शेयर करें:\n  ${email}`);
  } else if (status === 404) {
    console.error("✗ शीट नहीं मिली — GOOGLE_SHEET_ID जांचें।");
  } else if (error?.response?.data?.error?.message?.includes("has not been used")) {
    console.error("✗ Google Sheets API चालू नहीं है — Cloud Console में 'Google Sheets API' को Enable करें।");
  } else {
    console.error("✗", error?.response?.data?.error?.message ?? error?.message ?? error);
  }
  process.exit(1);
}
