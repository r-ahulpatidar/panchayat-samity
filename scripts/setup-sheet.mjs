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

// lib/services/google-sheets.ts के SHEET_HEADERS और lib/complaints/types.ts के STATUS से मेल खाना चाहिए
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
  "टिप्पणी",
  "WhatsApp स्थिति",
  "अनुरोध कुंजी",
];
const STATUS = [
  { value: "लंबित", color: { red: 1, green: 0.95, blue: 0.8 } },
  { value: "कार्य प्रगति पर", color: { red: 0.85, green: 0.92, blue: 1 } },
  { value: "समाधान हो गया", color: { red: 0.85, green: 0.96, blue: 0.87 } },
];
const STATUS_COL = 9; // J
const KEY_COL = 12; // M
const WIDTHS = [130, 140, 160, 120, 120, 120, 380, 220, 220, 140, 220, 130, 100];

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

  requests.push(
    {
      updateSheetProperties: {
        properties: { sheetId: id, gridProperties: { frozenRowCount: 1 } },
        fields: "gridProperties.frozenRowCount",
      },
    },
    {
      repeatCell: {
        range: { sheetId: id, startRowIndex: 0, endRowIndex: 1 },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
            backgroundColor: { red: 0.76, green: 0.25, blue: 0.05 },
            wrapStrategy: "WRAP",
            verticalAlignment: "MIDDLE",
          },
        },
        fields: "userEnteredFormat(textFormat,backgroundColor,wrapStrategy,verticalAlignment)",
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

  // स्थिति के रंग — पहले से हों तो दोबारा न जोड़ें
  const cf = await call(`${api}?fields=sheets(properties.sheetId,conditionalFormats)`);
  const existing = cf.sheets.find((s) => s.properties.sheetId === id)?.conditionalFormats ?? [];
  if (existing.length === 0) {
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
  }

  await call(`${api}:batchUpdate`, "POST", { requests });

  const range = encodeURIComponent(`'${tab}'!A1:M1`);
  await call(`${api}/values/${range}?valueInputOption=RAW`, "PUT", { values: [HEADERS] });

  console.log("✓ हेडर पंक्ति, फ्रीज़, स्थिति ड्रॉपडाउन और रंग सेट हो गए");
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
