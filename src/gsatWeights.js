/**
 * เกณฑ์คะแนนรวม กสพท — ใช้เดียวกันทุกคณะ/มหาวิทยาลัย
 *
 * TPAT1 = ความถนัดแพทย์ รวม 30% — มี 3 พาร์ตย่อย (พาร์ตละ 10%)
 *   เชาวน์ปัญญา / จริยธรรม / ความคิดเชื่อมโยง → รวมเป็นชื่อ TPAT1 ชุดเดียว
 * A-Level รวม 70%
 *
 * หมายเหตุ: พาร์ต "เชื่อมโยง" ในระบบกรอกคะแนนใช้ key เดียวกับ TGAT2 (เหตุผล) ตามรูปแบบ TCAS
 */

export const GSAT_WEIGHT_NOTES = [
  "TPAT1 (ความถนัดแพทย์) นับ 30% — แบ่ง 3 พาร์ต พาร์ตละ 10%: เชาวน์ปัญญา · จริยธรรม · ความคิดเชื่อมโยง",
  "A-Level นับ 70% — วิทย์ (ฟิสิกส์ เคมี ชีวะ) 28% แบ่งเท่ากัน · คณิต 1 (14%) · อังกฤษ (14%) · ไทย (7%) · สังคม (7%)",
];

/** 3 พาร์ตย่อยของ TPAT1 (รวมเป็น TPAT1 ชุดเดียว 30%) */
export const TPAT1_GROUP = {
  title: "TPAT1 — ความถนัดแพทย์",
  description:
    "กลุ่มนี้รวม 30% ของคะแนนทั้งหมด — แต่ละพาร์ตมีสัดส่วน 10% · ใส่คะแนนแต่ละพาร์ตเต็ม 100",
  parts: [
    { key: "tpat11", weight: 10, label: "เชาวน์ปัญญา" },
    { key: "tpat13", weight: 10, label: "จริยธรรม" },
    {
      key: "tgat2",
      weight: 10,
      label: "ความคิดเชื่อมโยง",
    },
  ],
};

/** A-Level 70% */
export const ALEVEL_ENTRIES = [
  { key: "physics", weight: 28 / 3, label: "ฟิสิกส์" },
  { key: "chemistry", weight: 28 / 3, label: "เคมี" },
  { key: "biology", weight: 28 / 3, label: "ชีวะ" },
  { key: "math1", weight: 14, label: "คณิต 1" },
  { key: "english", weight: 14, label: "อังกฤษ" },
  { key: "thai", weight: 7, label: "ไทย" },
  { key: "social", weight: 7, label: "สังคม" },
];

export const ALEVEL_GROUP = {
  title: "A-Level",
  description: "กลุ่มนี้รวม 70% — แต่ละวิชาใส่คะแนนเต็ม 100",
  parts: ALEVEL_ENTRIES,
};

/** flat list สำหรับคำนวณ — ลำดับ TPAT1 ก่อน แล้วตามด้วย A-Level */
export const GSAT_WEIGHT_ENTRIES = [...TPAT1_GROUP.parts, ...ALEVEL_ENTRIES];

const sumWeights = GSAT_WEIGHT_ENTRIES.reduce((s, e) => s + e.weight, 0);

if (Math.abs(sumWeights - 100) > 0.001) {
  // eslint-disable-next-line no-console
  console.warn("GSAT weights should sum to 100, got", sumWeights);
}

export function initialGsatScores() {
  return GSAT_WEIGHT_ENTRIES.reduce((acc, { key }) => {
    acc[key] = 0;
    return acc;
  }, {});
}

export function clampScore(raw, max = 100) {
  const n = Number(String(raw ?? "").replace(/,/g, "").trim());
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, n));
}

/** คะแนนรวมตามสัดส่วน กสพท (สมมติแต่ละวิชาเต็ม 100 แล้วถ่วงน้ำหนัก) */
export function computeGsatComposite(scores) {
  return GSAT_WEIGHT_ENTRIES.reduce((sum, { key, weight }) => {
    return sum + (clampScore(scores[key]) * weight) / 100;
  }, 0);
}
