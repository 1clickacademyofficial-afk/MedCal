/** จำแนกสายจากข้อความชื่อคณะ/หลักสูตรในประกาศ กสพท */

export const TRACK_IDS = ["med", "dental", "vet", "pharm"];

export const TRACK_OPTIONS = [
  { id: "med", shortLabel: "แพทย์", fullLabel: "แพทยศาสตร์" },
  { id: "dental", shortLabel: "ทันตะ", fullLabel: "ทันตแพทยศาสตร์" },
  { id: "vet", shortLabel: "สัตวะ", fullLabel: "สัตวแพทยศาสตร์" },
  { id: "pharm", shortLabel: "เภสัช", fullLabel: "เภสัชศาสตร์" },
];

/**
 * @returns {'med'|'dental'|'vet'|'pharm'|'other'}
 */
export function classifyProgramTrack(institution) {
  const s = String(institution || "");
  if (/ทันตแพทย์|ทันตแพทยศาสตร์|สำนักวิชาทันต/.test(s)) return "dental";
  if (/สัตวแพทย์|สัตวแพทยศาสตร์/.test(s)) return "vet";
  if (/เภสัชศาสตร์/.test(s)) return "pharm";
  if (/แพทยศาสตร์|วิทยาลัยแพทยศาสตร์|วิทยาลัยแพทย/.test(s)) return "med";
  return "other";
}

/** ดึงชื่อมหาวิทยาลัย / สถาบัน จากบรรทัดประกาศ (สำหรับจัดกลุ่มเลือกมหาวิทยาลัย) */
export function extractUniversityLabel(institution) {
  const part = String(institution || "").split(/\s*[–—]\s*/)[0].trim();
  const words = part.split(/\s+/).filter(Boolean);
  const idx = words.findIndex((w) => w.includes("มหาวิทยาลัย") || w.includes("วิทยาลัย"));
  if (idx === -1) return part || institution;
  return words.slice(idx).join(" ");
}
