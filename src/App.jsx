import { useEffect, useMemo, useRef, useState } from "react";
import csvRaw from "../68.csv?raw";
import oneClickLogo from "../1clicklogo transs.png";
import {
  TPAT1_GROUP,
  ALEVEL_GROUP,
  computeGsatComposite,
  clampScore,
  initialGsatScores,
} from "./gsatWeights.js";

const SUBJECT_HEX = {
  tpat13: "#6366f1",
  tgat2: "#6366f1",
  tpat11: "#6366f1",
  physics: "#5b21b6",
  chemistry: "#db2777",
  biology: "#16a34a",
  math1: "#2563eb",
  english: "#facc15",
  thai: "#ea580c",
  social: "#57534e",
};

const SUBJECT_SHORT_LABEL = {
  tpat1: "TPAT1",
  physics: "ฟิสิกส์",
  chemistry: "เคมี",
  biology: "ชีวะ",
  math1: "คณิต1",
  english: "อังกฤษ",
  thai: "ไทย",
  social: "สังคม",
};

const SUBJECT_TEXT_HEX = {
  english: "#111827",
};

function sliderBackground(score, max, key) {
  const r = max > 0 ? Math.min(100, (score / max) * 100) : 0;
  const c = SUBJECT_HEX[key] || "#18181b";
  return `linear-gradient(to right, ${c} 0%, ${c} ${r}%, #e4e4e7 ${r}%, #e4e4e7 100%)`;
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out;
}

function parseNumeric(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseProgramsFromCsv(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) return [];

  return lines.slice(1).map((line, idx) => {
    const [fullName, faculty, university, major, region, category, max, min, avg] =
      parseCsvLine(line);
    return {
      id: `row-${idx}`,
      fullName: fullName || "",
      faculty: faculty || "",
      university: university || "",
      major: major || "",
      region: region || "",
      category: category || "",
      max: parseNumeric(max),
      min: parseNumeric(min),
      avg: parseNumeric(avg),
    };
  });
}

function uniqueSortedOptions(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "th"),
  );
}

function toggleInArray(values, value) {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

const PROGRAMS_FROM_CSV = parseProgramsFromCsv(csvRaw);
const DEFAULT_FILTER_OPTIONS = {
  universities: uniqueSortedOptions(PROGRAMS_FROM_CSV, "university"),
  faculties: uniqueSortedOptions(PROGRAMS_FROM_CSV, "faculty"),
  majors: uniqueSortedOptions(PROGRAMS_FROM_CSV, "major"),
  regions: uniqueSortedOptions(PROGRAMS_FROM_CSV, "region"),
  categories: uniqueSortedOptions(PROGRAMS_FROM_CSV, "category"),
};

const PARALLAX_PARTICLES = [
  { id: "p1", x: "8%", y: "18%", size: "7px", delay: "0s", dur: "6.2s" },
  { id: "p2", x: "22%", y: "62%", size: "5px", delay: "1.1s", dur: "7.8s" },
  { id: "p3", x: "41%", y: "26%", size: "8px", delay: "0.6s", dur: "7.1s" },
  { id: "p4", x: "58%", y: "72%", size: "6px", delay: "1.8s", dur: "8.4s" },
  { id: "p5", x: "70%", y: "20%", size: "6px", delay: "0.9s", dur: "6.9s" },
  { id: "p6", x: "84%", y: "56%", size: "9px", delay: "1.4s", dur: "7.3s" },
  { id: "p7", x: "92%", y: "30%", size: "5px", delay: "2.2s", dur: "8.8s" },
  { id: "p8", x: "14%", y: "38%", size: "4px", delay: "0.3s", dur: "5.9s" },
  { id: "p9", x: "30%", y: "12%", size: "6px", delay: "1.7s", dur: "7.2s" },
  { id: "p10", x: "49%", y: "46%", size: "5px", delay: "2.8s", dur: "8.2s" },
  { id: "p11", x: "62%", y: "10%", size: "7px", delay: "1.2s", dur: "6.1s" },
  { id: "p12", x: "76%", y: "80%", size: "4px", delay: "0.8s", dur: "7.7s" },
  { id: "p13", x: "88%", y: "14%", size: "6px", delay: "2.5s", dur: "6.8s" },
  { id: "p14", x: "5%", y: "74%", size: "8px", delay: "1.9s", dur: "8.6s" },
];

const REGION_MAP_ZONES = [
  {
    id: "north",
    label: "เหนือ",
    d: "M78 22 L122 12 L176 26 L162 70 L118 86 L82 70 Z",
  },
  {
    id: "northeast",
    label: "ตะวันออกเฉียงเหนือ",
    d: "M176 26 L236 32 L270 58 L250 116 L196 136 L162 70 Z",
  },
  {
    id: "central",
    label: "กลางและ กทม.",
    d: "M94 92 L148 88 L172 114 L152 162 L104 174 L74 140 Z",
  },
  {
    id: "east",
    label: "ตะวันออก",
    d: "M172 114 L212 122 L230 154 L200 172 L152 162 Z",
  },
  {
    id: "south",
    label: "ใต้",
    d: "M104 174 L142 178 L158 214 L144 274 L122 326 L98 312 L84 246 L88 198 Z",
  },
];

const TH_REGION_GEOJSON_URL =
  "https://raw.githubusercontent.com/chingchai/OpenGISData-Thailand/master/reg_royin.geojson";

function normalizeFacultyName(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/^คณะ/, "")
    .toLowerCase();
}

function getFacultyTrack(facultyName) {
  const normalized = normalizeFacultyName(facultyName);
  if (!normalized) return null;

  // Check specific tracks first to avoid "แพทย" matching "ทันตแพทย/สัตวแพทย".
  if (normalized.includes("ทันตแพทย")) return "dent";
  if (normalized.includes("สัตวแพทย")) return "vet";
  if (normalized.includes("เภสัช")) return "pharm";
  if (normalized.includes("แพทย")) return "med";
  return null;
}

function MultiFilter({ title, options, selected, onToggle, onSelectAll, onClearAll }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-zinc-700">{title}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-[11px] font-semibold text-indigo-600 hover:underline"
          >
            เลือกทั้งหมด
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-semibold text-zinc-500 hover:underline"
          >
            ล้างทั้งหมด
          </button>
        </div>
      </div>
      <div className="max-h-36 space-y-1 overflow-auto">
        {options.map((option) => {
          const isOn = selected.includes(option);
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1 text-xs ${
                isOn ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => onToggle(option)}
                className="mt-0.5 accent-indigo-600"
              />
              <span className="leading-snug text-zinc-800">{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function RegionMapFilter({ selected, onToggle, onSelectAll, onClearAll, regionCounts }) {
  const [geoRegions, setGeoRegions] = useState(null);
  const [geoLoaded, setGeoLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(TH_REGION_GEOJSON_URL);
        if (!res.ok) throw new Error("โหลดแผนที่ไม่สำเร็จ");
        const json = await res.json();
        if (!mounted) return;

        const grouped = {
          เหนือ: [],
          ตะวันออกเฉียงเหนือ: [],
          "กลางและ กทม.": [],
          ตะวันออก: [],
          ใต้: [],
        };

        for (const f of json.features || []) {
          const key = String(f?.properties?.reg_royin || "");
          let label = null;
          if (key === "North") label = "เหนือ";
          else if (key === "Northeast") label = "ตะวันออกเฉียงเหนือ";
          else if (key === "East") label = "ตะวันออก";
          else if (key === "South") label = "ใต้";
          else if (key === "Central" || key === "West") label = "กลางและ กทม.";
          if (!label) continue;
          grouped[label].push(f.geometry);
        }

        setGeoRegions(grouped);
        setGeoLoaded(true);
      } catch {
        if (mounted) setGeoLoaded(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const mapPolygons = useMemo(() => {
    if (!geoRegions) return null;
    const all = [];
    const regionPolys = [];

    for (const [label, geoms] of Object.entries(geoRegions)) {
      const polygons = [];
      for (const g of geoms) {
        if (!g) continue;
        if (g.type === "Polygon") polygons.push(g.coordinates);
        else if (g.type === "MultiPolygon") polygons.push(...g.coordinates);
      }
      regionPolys.push({ label, polygons });
      for (const poly of polygons) {
        for (const ring of poly) {
          for (const [lon, lat] of ring) all.push([lon, lat]);
        }
      }
    }
    if (all.length === 0) return null;

    const lons = all.map((p) => p[0]);
    const lats = all.map((p) => p[1]);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const pad = 10;
    const w = 280;
    const h = 360;
    const xScale = (lon) => ((lon - minLon) / (maxLon - minLon)) * w + pad;
    const yScale = (lat) => ((maxLat - lat) / (maxLat - minLat)) * h + pad;

    return regionPolys.map(({ label, polygons }) => {
      let pathD = "";
      const points = [];
      for (const poly of polygons) {
        for (const ring of poly) {
          ring.forEach(([lon, lat]) => points.push([lon, lat]));
          pathD += ring
            .map(([lon, lat], idx) => `${idx === 0 ? "M" : "L"}${xScale(lon).toFixed(2)} ${yScale(lat).toFixed(2)}`)
            .join(" ");
          pathD += " Z ";
        }
      }
      const cx = points.reduce((s, p) => s + xScale(p[0]), 0) / Math.max(points.length, 1);
      const cy = points.reduce((s, p) => s + yScale(p[1]), 0) / Math.max(points.length, 1);
      const override =
        label === "เหนือ"
          ? { cx: 132, cy: 96 }
          : label === "ตะวันออกเฉียงเหนือ"
            ? { cx: 206, cy: 128 }
            : label === "กลางและ กทม."
              ? { cx: 122, cy: 188 }
              : label === "ตะวันออก"
                ? { cx: 198, cy: 188 }
                : label === "ใต้"
                  ? { cx: 126, cy: 276 }
                  : null;
      return { label, pathD, cx: override?.cx ?? cx, cy: override?.cy ?? cy };
    });
  }, [geoRegions]);

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-zinc-700">ภูมิภาค (แผนที่)</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-[11px] font-semibold text-indigo-600 hover:underline"
          >
            เลือกทั้งหมด
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-semibold text-zinc-500 hover:underline"
          >
            ล้างทั้งหมด
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-2 ring-1 ring-zinc-200/80">
        {mapPolygons ? (
          <svg viewBox="0 0 300 390" className="mx-auto w-full max-w-[18rem]">
            {mapPolygons.map((zone) => {
              const on = selected.includes(zone.label);
              return (
                <g key={zone.label}>
                  <path
                    d={zone.pathD}
                    role="button"
                    tabIndex={0}
                    onClick={() => onToggle(zone.label)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onToggle(zone.label);
                    }}
                    className={`cursor-pointer stroke-[1.4] transition-all ${
                      on
                        ? "fill-indigo-500 stroke-indigo-800 opacity-95"
                        : "fill-zinc-200 stroke-zinc-500 opacity-90 hover:fill-indigo-200"
                    }`}
                  />
                </g>
              );
            })}
          </svg>
        ) : (
          <svg viewBox="50 6 240 332" className="mx-auto w-full max-w-[18rem]">
            {REGION_MAP_ZONES.map((zone) => {
              const on = selected.includes(zone.label);
              const count = regionCounts[zone.label] ?? 0;
              return (
                <g key={zone.id}>
                  <path
                    d={zone.d}
                    role="button"
                    tabIndex={0}
                    onClick={() => onToggle(zone.label)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onToggle(zone.label);
                    }}
                    className={`cursor-pointer stroke-[2] transition-all ${
                      on
                        ? "fill-indigo-500 stroke-indigo-700 opacity-95"
                        : "fill-zinc-200 stroke-zinc-400 opacity-90 hover:fill-indigo-200"
                    }`}
                  />
                  <text
                    x={
                      zone.id === "north"
                        ? 126
                        : zone.id === "northeast"
                          ? 220
                          : zone.id === "central"
                            ? 120
                            : zone.id === "east"
                              ? 196
                              : 120
                    }
                    y={
                      zone.id === "north"
                        ? 50
                        : zone.id === "northeast"
                          ? 84
                          : zone.id === "central"
                            ? 136
                            : zone.id === "east"
                              ? 146
                              : 246
                    }
                    textAnchor="middle"
                    className="select-none fill-white text-[9px] font-bold"
                    pointerEvents="none"
                  >
                    {zone.label}
                  </text>
                  <text
                    x={
                      zone.id === "north"
                        ? 126
                        : zone.id === "northeast"
                          ? 220
                          : zone.id === "central"
                            ? 120
                            : zone.id === "east"
                              ? 196
                              : 120
                    }
                    y={
                      zone.id === "north"
                        ? 62
                        : zone.id === "northeast"
                          ? 96
                          : zone.id === "central"
                            ? 148
                            : zone.id === "east"
                              ? 158
                              : 258
                    }
                    textAnchor="middle"
                    className="select-none fill-white text-[9px] font-semibold"
                    pointerEvents="none"
                  >
                    {count}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
      <div className="mt-2 grid grid-cols-1 gap-1.5 text-[11px] sm:grid-cols-2">
        {["เหนือ", "ตะวันออกเฉียงเหนือ", "กลางและ กทม.", "ตะวันออก", "ใต้"].map((region) => {
          const on = selected.includes(region);
          return (
            <button
              key={region}
              type="button"
              onClick={() => onToggle(region)}
              className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-left transition ${
                on
                  ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              <span className="font-semibold">{region}</span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                {regionCounts[region] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">
        {geoLoaded
          ? "กดภาคที่ต้องการเพื่อเปิด/ปิดตัวกรอง"
          : "กำลังโหลดแผนที่ประเทศไทย..."}
      </p>
    </div>
  );
}

export default function App() {
  const [isNoticeOpen, setIsNoticeOpen] = useState(true);
  const [scores, setScores] = useState(initialGsatScores);
  const [selectedProgramIds, setSelectedProgramIds] = useState(new Set());
  const [searchText, setSearchText] = useState("");
  const [scoreBump, setScoreBump] = useState(false);
  const [selectedUniversities, setSelectedUniversities] = useState(() => [
    ...DEFAULT_FILTER_OPTIONS.universities,
  ]);
  const [selectedFaculties, setSelectedFaculties] = useState(() => [
    ...DEFAULT_FILTER_OPTIONS.faculties,
  ]);
  const [selectedMajors, setSelectedMajors] = useState(() => [...DEFAULT_FILTER_OPTIONS.majors]);
  const [selectedRegions, setSelectedRegions] = useState(() => [...DEFAULT_FILTER_OPTIONS.regions]);
  const [selectedCategories, setSelectedCategories] = useState(() => [
    ...DEFAULT_FILTER_OPTIONS.categories,
  ]);
  const [isProgramPickerOpen, setIsProgramPickerOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [focusedResultId, setFocusedResultId] = useState(null);
  const [modalUniversityFilter, setModalUniversityFilter] = useState("all");
  const [modalFacultyFilter, setModalFacultyFilter] = useState("all");
  const [modalToneFilter, setModalToneFilter] = useState("all");
  const [hoveredWeightKey, setHoveredWeightKey] = useState(null);
  const [isCompactDevice, setIsCompactDevice] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 1536px), (pointer: coarse), (hover: none)").matches
      : false,
  );
  const [parallaxScrollY, setParallaxScrollY] = useState(0);
  const [parallaxPointerX, setParallaxPointerX] = useState(0);
  const [parallaxPointerY, setParallaxPointerY] = useState(0);
  const [parallaxPointerSpeed, setParallaxPointerSpeed] = useState(0);
  const [parallaxScrollProgress, setParallaxScrollProgress] = useState(0);
  const [smoothedComposite, setSmoothedComposite] = useState(0);
  const compositeBaseline = useRef(null);
  const pointerLastRef = useRef({ x: 0, y: 0, t: 0 });
  const programs = PROGRAMS_FROM_CSV;

  const composite = useMemo(() => computeGsatComposite(scores), [scores]);
  const tpat1Total = useMemo(
    () => TPAT1_GROUP.parts.reduce((sum, { key }) => sum + clampScore(scores[key]), 0),
    [scores]
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1536px), (pointer: coarse), (hover: none)");
    const apply = () => setIsCompactDevice(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  /* Samsung / แท็บเล็ตบางเคสไม่เข้า media พร้อมกัน หรือ mix-blend ทำจอดำ — sync คลาสบน <html> แทน */
  useEffect(() => {
    const cls = "force-light-ui";
    const sync = () => {
      const touch = (navigator.maxTouchPoints ?? 0) > 0;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const noHover = window.matchMedia("(hover: none)").matches;
      const narrow = window.matchMedia("(max-width: 1536px)").matches;
      document.documentElement.classList.toggle(cls, touch || coarse || noHover || narrow);
    };
    sync();
    const mqs = ["(pointer: coarse)", "(hover: none)", "(max-width: 1536px)"].map((q) =>
      window.matchMedia(q),
    );
    mqs.forEach((mq) => mq.addEventListener("change", sync));
    window.addEventListener("resize", sync);
    return () => {
      mqs.forEach((mq) => mq.removeEventListener("change", sync));
      window.removeEventListener("resize", sync);
      document.documentElement.classList.remove(cls);
    };
  }, []);

  useEffect(() => {
    if (compositeBaseline.current === null) {
      compositeBaseline.current = composite;
      return;
    }
    if (compositeBaseline.current !== composite) {
      compositeBaseline.current = composite;
      setScoreBump(true);
      const t = window.setTimeout(() => setScoreBump(false), 420);
      return () => window.clearTimeout(t);
    }
  }, [composite]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setSmoothedComposite((prev) => {
        const next = prev + (composite - prev) * 0.14;
        return Math.abs(next - composite) < 0.01 ? composite : next;
      });
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [composite]);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return undefined;

    const onScroll = () => {
      const y = window.scrollY || 0;
      setParallaxScrollY(y);
      const total = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      setParallaxScrollProgress(Math.max(0, Math.min(1, y / total)));
    };
    const onMove = (event) => {
      const nx = (event.clientX / window.innerWidth - 0.5) * 2;
      const ny = (event.clientY / window.innerHeight - 0.5) * 2;
      setParallaxPointerX(nx);
      setParallaxPointerY(ny);

      const now = performance.now();
      const last = pointerLastRef.current;
      if (last.t > 0) {
        const dt = Math.max(1, now - last.t);
        const dx = event.clientX - last.x;
        const dy = event.clientY - last.y;
        const pxPerSec = (Math.hypot(dx, dy) / dt) * 1000;
        const normalized = Math.max(0, Math.min(1.2, pxPerSec / 1800));
        setParallaxPointerSpeed((prev) => prev * 0.55 + normalized * 0.45);
      }
      pointerLastRef.current = { x: event.clientX, y: event.clientY, t: now };
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!isCompactDevice) {
      window.addEventListener("mousemove", onMove, { passive: true });
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (!isCompactDevice) {
        window.removeEventListener("mousemove", onMove);
      }
    };
  }, [isCompactDevice]);

  useEffect(() => {
    if (isCompactDevice) return undefined;
    let raf = 0;
    const tick = () => {
      setParallaxPointerSpeed((prev) => (prev < 0.01 ? 0 : prev * 0.92));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [isCompactDevice]);

  useEffect(() => {
    try {
      const acknowledged = window.localStorage.getItem("gsat_notice_ack_v1");
      if (acknowledged === "1") setIsNoticeOpen(false);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const filterOptions = DEFAULT_FILTER_OPTIONS;

  const filteredPrograms = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return programs.filter((p) => {
      if (selectedUniversities.length > 0 && !selectedUniversities.includes(p.university)) return false;
      if (selectedFaculties.length > 0 && !selectedFaculties.includes(p.faculty)) return false;
      if (selectedMajors.length > 0 && !selectedMajors.includes(p.major)) return false;
      if (selectedRegions.length > 0 && !selectedRegions.includes(p.region)) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
      if (!q) return true;
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.university.toLowerCase().includes(q) ||
        p.faculty.toLowerCase().includes(q) ||
        p.major.toLowerCase().includes(q)
      );
    });
  }, [
    programs,
    searchText,
    selectedUniversities,
    selectedFaculties,
    selectedMajors,
    selectedRegions,
    selectedCategories,
  ]);

  const regionCountsForMap = useMemo(() => {
    const bucket = Object.fromEntries(filterOptions.regions.map((r) => [r, 0]));
    programs.forEach((p) => {
      if (selectedUniversities.length > 0 && !selectedUniversities.includes(p.university)) return;
      if (selectedFaculties.length > 0 && !selectedFaculties.includes(p.faculty)) return;
      if (selectedMajors.length > 0 && !selectedMajors.includes(p.major)) return;
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return;
      if (bucket[p.region] == null) bucket[p.region] = 0;
      bucket[p.region] += 1;
    });
    return bucket;
  }, [
    programs,
    filterOptions.regions,
    selectedUniversities,
    selectedFaculties,
    selectedMajors,
    selectedCategories,
  ]);

  const results = useMemo(() => {
    const hasLowAlevel = ALEVEL_GROUP.parts.some(({ key }) => clampScore(scores[key]) < 30);
    return [...selectedProgramIds]
      .map((id) => {
        const p = programs.find((x) => x.id === id);
        if (!p) return null;
        const hasCutoff = p.min != null && Number.isFinite(p.min);
        let tone = "unknown";
        let status = "รายการนี้ไม่มีข้อมูลคะแนนต่ำสุด";
        if (hasLowAlevel) {
          tone = "blocked";
          status = "มีคะแนน A-Level ต่ำกว่า 30 อย่างน้อย 1 วิชา — คาดว่าไม่ผ่านเกณฑ์";
          return { program: p, tone, status, composite };
        }
        if (hasCutoff) {
          if (composite >= p.min) {
            tone = "pass";
            status = `คะแนนรวมของคุณไม่ต่ำกว่าคะแนนต่ำสุด (${p.min.toFixed(4)})`;
          } else {
            tone = "fail";
            status = `คะแนนรวมของคุณต่ำกว่าคะแนนต่ำสุด (${p.min.toFixed(4)})`;
          }
        }
        return { program: p, tone, status, composite };
      })
      .filter(Boolean);
  }, [selectedProgramIds, programs, composite, scores]);

  const passCount = useMemo(
    () => results.filter((r) => r.tone === "pass").length,
    [results],
  );
  const blockedCount = useMemo(
    () => results.filter((r) => r.tone === "blocked").length,
    [results],
  );
  const failCount = useMemo(
    () => results.filter((r) => r.tone === "fail").length,
    [results],
  );
  const modalUniversities = useMemo(
    () =>
      [...new Set(results.map((r) => r.program.university).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "th"),
      ),
    [results],
  );
  const modalFaculties = useMemo(
    () =>
      [...new Set(results.map((r) => r.program.faculty).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "th"),
      ),
    [results],
  );
  const modalFilteredResults = useMemo(
    () =>
      results.filter((r) => {
        if (modalUniversityFilter !== "all" && r.program.university !== modalUniversityFilter) return false;
        if (modalFacultyFilter !== "all" && r.program.faculty !== modalFacultyFilter) return false;
        if (modalToneFilter !== "all" && r.tone !== modalToneFilter) return false;
        return true;
      }),
    [results, modalUniversityFilter, modalFacultyFilter, modalToneFilter],
  );
  const modalPassCount = useMemo(
    () => modalFilteredResults.filter((r) => r.tone === "pass").length,
    [modalFilteredResults],
  );
  const modalBlockedCount = useMemo(
    () => modalFilteredResults.filter((r) => r.tone === "blocked").length,
    [modalFilteredResults],
  );
  const modalFailCount = useMemo(
    () => modalFilteredResults.filter((r) => r.tone === "fail").length,
    [modalFilteredResults],
  );
  const focusedResult = useMemo(
    () =>
      modalFilteredResults.find((r) => r.program.id === focusedResultId) ??
      modalFilteredResults[0] ??
      null,
    [modalFilteredResults, focusedResultId],
  );

  useEffect(() => {
    setSelectedProgramIds(new Set(filteredPrograms.map((p) => p.id)));
  }, [filteredPrograms]);

  useEffect(() => {
    if (!isResultsModalOpen) return;
    if (!focusedResultId && modalFilteredResults[0]) setFocusedResultId(modalFilteredResults[0].program.id);
  }, [isResultsModalOpen, focusedResultId, modalFilteredResults]);

  useEffect(() => {
    if (!isResultsModalOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsResultsModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isResultsModalOpen]);

  const toggleProgram = (id) => {
    setSelectedProgramIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearAllFilters = () => {
    setSelectedUniversities([]);
    setSelectedFaculties([]);
    setSelectedMajors([]);
    setSelectedRegions([]);
    setSelectedCategories([]);
  };

  const filteredRatioPct =
    programs.length > 0 ? Math.max(0, Math.min(100, (filteredPrograms.length / programs.length) * 100)) : 0;
  const ecgDurationSec = 4.2;
  const scoreBand = composite < 58 ? "score-low" : composite < 68 ? "score-mid" : "score-high";
  const scoreIntensity = Math.max(0.35, Math.min(1.15, composite / 100));
  const activeTracks = new Set(selectedFaculties.map(getFacultyTrack).filter(Boolean));
  const hasTrackSelection = activeTracks.size > 0;
  const healthGlyphActive = {
    med: !hasTrackSelection || activeTracks.has("med"),
    dent: !hasTrackSelection || activeTracks.has("dent"),
    vet: !hasTrackSelection || activeTracks.has("vet"),
    pharm: !hasTrackSelection || activeTracks.has("pharm"),
  };
  const overdriveBoost = isCompactDevice ? 1 : 3;

  return (
    <div
      className={`parallax-shell min-h-screen bg-[#fafafa] font-sans ${scoreBump ? "score-pulsing" : ""} ${scoreBand}`}
      style={{
        "--parallax-scroll-y": `${parallaxScrollY}px`,
        "--parallax-scroll-progress": `${parallaxScrollProgress}`,
        "--parallax-pointer-x": `${parallaxPointerX}`,
        "--parallax-pointer-y": `${parallaxPointerY}`,
        "--parallax-pointer-speed": `${parallaxPointerSpeed.toFixed(3)}`,
        "--ecg-dur": `${ecgDurationSec.toFixed(2)}s`,
        "--score-pulse": scoreBump ? 1 : 0,
        "--score-intensity": `${scoreIntensity.toFixed(3)}`,
        "--overdrive-boost": `${overdriveBoost}`,
      }}
    >
      <div className="overdrive-progress-beam" aria-hidden="true" />
      <div className="parallax-bg" aria-hidden="true">
        <div className="parallax-vignette" />
        <div className="parallax-spotlight" />
        <div className="cursor-halo" />
        <div className="parallax-grain" />
        <div className="parallax-scanlines" />
        <div
          className={`health-glyph health-glyph-med ${healthGlyphActive.med ? "is-active" : "is-dim"}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="health-glyph-icon health-glyph-icon--med" aria-hidden="true">
            <circle cx="12" cy="12" r="8.4" />
            <path d="M12 6.8v10.4M6.8 12h10.4" />
            <path d="M6 15.5h2.5l1.1-2.3 1.6 3.2 1.1-2h4.2" />
            <path d="M8.6 8.6h6.8" />
          </svg>
          <span className="health-glyph-label">แพทย์</span>
        </div>
        <div
          className={`health-glyph health-glyph-dent ${healthGlyphActive.dent ? "is-active" : "is-dim"}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="health-glyph-icon health-glyph-icon--dent" aria-hidden="true">
            <path d="M7 4c1.4 0 2.6.7 3.4 1.8.8-1.1 2-1.8 3.4-1.8 2.7 0 4.7 2.2 4.2 4.8-.6 3.1-1.9 5.8-3.6 8-.7.9-2 .8-2.6-.2L12 14.8l-1.8 1.8c-.6 1-1.9 1.1-2.6.2-1.7-2.2-3-4.9-3.6-8C2.3 6.2 4.3 4 7 4z" />
            <path d="M6.5 7.8l.9.9m9.2-1.1l.9.9m-1.7-2.2l.9.9" />
            <path d="M9.6 9.8h4.8M10.2 12.2h3.6" />
          </svg>
          <span className="health-glyph-label">ทันตะ</span>
        </div>
        <div
          className={`health-glyph health-glyph-vet ${healthGlyphActive.vet ? "is-active" : "is-dim"}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="health-glyph-icon health-glyph-icon--vet" aria-hidden="true">
            <circle cx="7" cy="7" r="2.3" />
            <circle cx="12" cy="5.6" r="2.1" />
            <circle cx="17" cy="7" r="2.3" />
            <path d="M12 10.2c-2.8 0-5 2.2-5 5 0 2.1 1.6 3.8 3.6 3.8.9 0 1.8-.4 2.4-1 .6.6 1.5 1 2.4 1 2 0 3.6-1.7 3.6-3.8 0-2.8-2.2-5-5-5z" />
            <path d="M3.5 14.8h2.2l.7-1.3.9 1.9.8-1.1h2" />
            <path d="M10.8 13.6h2.4M11.2 16h1.6" />
          </svg>
          <span className="health-glyph-label">สัตวะ</span>
        </div>
        <div
          className={`health-glyph health-glyph-pharm ${healthGlyphActive.pharm ? "is-active" : "is-dim"}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="health-glyph-icon health-glyph-icon--pharm" aria-hidden="true">
            <path d="M9 3h6M10 3v5l-4 7.2a4 4 0 0 0 3.5 5.8h5a4 4 0 0 0 3.5-5.8L14 8V3" />
            <path d="M8.5 13h7M9.2 15.3h5.6" />
            <circle cx="17.8" cy="6.8" r="2" />
            <path d="M11.1 6.4h1.8" />
          </svg>
          <span className="health-glyph-label">เภสัช</span>
        </div>
        <div className="antigravity-ring antigravity-ring-a" />
        <div className="antigravity-ring antigravity-ring-b" />
        <div className="antigravity-shear antigravity-shear-a" />
        <div className="antigravity-shear antigravity-shear-b" />
        <div className="parallax-streak parallax-streak-a" />
        <div className="parallax-streak parallax-streak-b" />
        <div className="parallax-heartbeat">
          <span />
          <span />
          <span />
        </div>
        <div className="parallax-orb parallax-orb-a" />
        <div className="parallax-orb parallax-orb-b" />
        <div className="parallax-med-cross parallax-med-cross-a">+</div>
        <div className="parallax-med-cross parallax-med-cross-b">+</div>
        <div className="parallax-particle-layer">
          {PARALLAX_PARTICLES.map((particle) => (
            <span
              key={particle.id}
              className="parallax-particle"
              style={{
                "--px": particle.x,
                "--py": particle.y,
                "--ps": particle.size,
                "--pd": particle.delay,
                "--pt": particle.dur,
              }}
            />
          ))}
        </div>
        <div className="parallax-ecg-wrap">
          <div className="parallax-ecg-line" />
        </div>
        <div className="parallax-grid" />
      </div>

      <main className="parallax-content mx-auto max-w-6xl px-4 py-8 pb-64 sm:px-6 sm:py-12 sm:pb-72 lg:px-10">
        <header className="parallax-panel parallax-tier-hero bolder-hero animate-enter mb-10 border-b border-zinc-200/90 pb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="title-med-gradient title-overdrive text-3xl font-black tracking-tight sm:text-5xl">
              <span className="title-med-badge mr-2 align-middle">+</span>
              คำนวณคะแนนรวม กสพท
            </h1>
            <a
              href="https://cotmesadmission.com/pdf/9Uo9Bs9YP568Fy0Fy1Bi5F.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-zinc-700 transition-colors hover:border-cyan-400 hover:text-cyan-700"
              title="เปิดเอกสารอ้างอิงจาก กสพท"
            >
              อ้างอิงจาก กสพท
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-zinc-700">
            ระบบนี้ใช้ข้อมูลประกาศ กสพท โดยกรองได้ 5 มิติ:
            มหาวิทยาลัย, คณะ, สาขา, ภูมิภาค, ประเภท (ค่าเริ่มต้นเป็นทั้งหมด)
          </p>
          <div className="mt-5 rounded-xl border border-zinc-300/90 bg-white p-4 shadow-md shadow-indigo-100/70">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-zinc-900">โครงสร้างคะแนนรวม (100%)</span>
              <span className="text-xs font-bold text-zinc-600">TPAT1 30% + A-Level 70%</span>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <a
                href="https://www.mytcas.com/blueprint/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-[11px] font-bold text-cyan-800 transition hover:bg-cyan-100"
              >
                ดูตัวอย่างข้อสอบ Blueprint (A-Level)
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href="https://cotmesadmission.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-800 transition hover:bg-indigo-100"
              >
                เว็บไซต์ กสพท
                <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="relative">
              <div className="flex h-12 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200/80">
                <div
                  className="group/seg relative flex h-full items-center justify-center bg-indigo-600 text-sm font-extrabold text-white transition-all duration-200 hover:brightness-110"
                  style={{ width: "30%" }}
                  title="TPAT1 30%"
                  onMouseEnter={() => setHoveredWeightKey("tpat1")}
                  onMouseLeave={() => setHoveredWeightKey(null)}
                  onFocus={() => setHoveredWeightKey("tpat1")}
                  onBlur={() => setHoveredWeightKey(null)}
                  tabIndex={0}
                >
                  <span className="px-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">TPAT1 30%</span>
                </div>
                {ALEVEL_GROUP.parts.map(({ key, label, weight }) => (
                  <div
                    key={key}
                    className="group/seg relative flex h-full items-center justify-center text-xs font-extrabold transition-all duration-200 hover:brightness-110"
                    style={{
                      width: `${weight}%`,
                      backgroundColor: SUBJECT_HEX[key] || "#10b981",
                      color: SUBJECT_TEXT_HEX[key] || "#ffffff",
                    }}
                    title={`A-Level ${label} ${weight % 1 === 0 ? weight : weight.toFixed(2)}%`}
                    onMouseEnter={() => setHoveredWeightKey(key)}
                    onMouseLeave={() => setHoveredWeightKey(null)}
                    onFocus={() => setHoveredWeightKey(key)}
                    onBlur={() => setHoveredWeightKey(null)}
                    tabIndex={0}
                  >
                    <span className="px-0.5 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
                      {SUBJECT_SHORT_LABEL[key]} {weight % 1 === 0 ? weight : weight.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>

              {hoveredWeightKey && (
                <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 animate-enter rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                  {hoveredWeightKey === "tpat1"
                    ? "TPAT1 ความถนัดแพทย์ 30%"
                    : (() => {
                        const part = ALEVEL_GROUP.parts.find((p) => p.key === hoveredWeightKey);
                        if (!part) return "";
                        const pct = part.weight % 1 === 0 ? part.weight : part.weight.toFixed(2);
                        return `A-Level ${part.label} ${pct}%`;
                      })()}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-zinc-500">เอาเมาส์วางบนแต่ละแท่งเพื่อดูรายละเอียดแบบเคลื่อนไหว</p>
          </div>

          <div className="mt-3 rounded-xl border border-zinc-300 bg-white p-4 shadow-sm">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-zinc-700">รายการหลังกรอง / ทั้งหมด</span>
              <span className="text-sm font-black text-zinc-900">
                {filteredPrograms.length} / {programs.length} รายการ
              </span>
            </div>
            <div className="h-8 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200/80">
              <div
                className="flex h-full items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white transition-all duration-300"
                style={{ width: `${filteredRatioPct}%` }}
              >
                {filteredPrograms.length} / {programs.length}
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              คิดเป็น {filteredRatioPct.toFixed(1)}% ของข้อมูลทั้งหมด
            </p>
          </div>
        </header>

        <section className="parallax-panel parallax-tier-primary animate-enter mb-10 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/80 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900">ตัวกรองข้อมูล (ค่าเริ่มต้น: ทั้งหมด)</h2>
              <p className="mt-1 text-xs text-zinc-500">เลือกได้หลายค่า หรือปล่อยว่างเพื่อแสดงทั้งหมด</p>
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MultiFilter
              title="มหาวิทยาลัย"
              options={filterOptions.universities}
              selected={selectedUniversities}
              onSelectAll={() => setSelectedUniversities([...filterOptions.universities])}
              onClearAll={() => setSelectedUniversities([])}
              onToggle={(value) =>
                setSelectedUniversities((prev) => toggleInArray(prev, value))
              }
            />
            <MultiFilter
              title="คณะ"
              options={filterOptions.faculties}
              selected={selectedFaculties}
              onSelectAll={() => setSelectedFaculties([...filterOptions.faculties])}
              onClearAll={() => setSelectedFaculties([])}
              onToggle={(value) =>
                setSelectedFaculties((prev) => toggleInArray(prev, value))
              }
            />
            <MultiFilter
              title="สาขา"
              options={filterOptions.majors}
              selected={selectedMajors}
              onSelectAll={() => setSelectedMajors([...filterOptions.majors])}
              onClearAll={() => setSelectedMajors([])}
              onToggle={(value) =>
                setSelectedMajors((prev) => toggleInArray(prev, value))
              }
            />
            <RegionMapFilter
              selected={selectedRegions}
              onSelectAll={() => setSelectedRegions([...filterOptions.regions])}
              onClearAll={() => setSelectedRegions([])}
              onToggle={(value) => setSelectedRegions((prev) => toggleInArray(prev, value))}
              regionCounts={regionCountsForMap}
            />
            <MultiFilter
              title="ประเภท"
              options={filterOptions.categories}
              selected={selectedCategories}
              onSelectAll={() => setSelectedCategories([...filterOptions.categories])}
              onClearAll={() => setSelectedCategories([])}
              onToggle={(value) =>
                setSelectedCategories((prev) => toggleInArray(prev, value))
              }
            />
          </div>

          <div className="mt-4 rounded-xl border border-zinc-200/80 bg-white p-3">
            <button
              type="button"
              onClick={() => setIsProgramPickerOpen((v) => !v)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left shadow-sm transition-colors ${
                isProgramPickerOpen
                  ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                  : "border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-white"
              }`}
            >
              <span className="text-sm font-extrabold">ค้นหาชื่อเต็ม / มหาวิทยาลัย และเลือกรายการ</span>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold ${
                  isProgramPickerOpen ? "bg-indigo-600 text-white" : "bg-zinc-800 text-white"
                }`}
              >
                <span>{isProgramPickerOpen ? "ซ่อน" : "แสดง"}</span>
                <span className="opacity-80">({filteredPrograms.length})</span>
                <span aria-hidden="true">{isProgramPickerOpen ? "▴" : "▾"}</span>
              </span>
            </button>

            {isProgramPickerOpen && (
              <>
                <input
                  type="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="ค้นหา ชื่อเต็ม / มหาวิทยาลัย / คณะ / สาขา"
                  className="input-focus-ring mt-3 w-full rounded-xl border-0 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium ring-1 ring-zinc-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />

                <p className="mt-3 text-xs text-zinc-500">
                  ผลลัพธ์หลังกรอง: <strong>{filteredPrograms.length}</strong> รายการ
                </p>

                <div className="mt-3 max-h-72 space-y-1.5 overflow-auto rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-2 sm:max-h-80">
                  {filteredPrograms.length === 0 ? (
                    <p className="px-3 py-8 text-center text-sm leading-relaxed text-zinc-500">
                      ไม่พบรายการที่ตรงกับตัวกรองหรือคำค้น
                    </p>
                  ) : null}
                  {filteredPrograms.map((p) => {
                    const sel = selectedProgramIds.has(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`checkbox-row flex cursor-pointer gap-3 rounded-lg px-2.5 py-2.5 text-sm ${
                          sel
                            ? "bg-zinc-900 text-white shadow-md ring-1 ring-zinc-800"
                            : "bg-white ring-1 ring-zinc-200/90 hover:bg-zinc-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={() => toggleProgram(p.id)}
                          className={`mt-0.5 shrink-0 sm:mt-1 ${sel ? "accent-white" : "accent-zinc-900"}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold leading-snug">{p.fullName}</span>
                          <span className="mt-0.5 block text-[11px] opacity-80">
                            {p.university} · {p.faculty} · {p.major}
                          </span>
                          <span className="text-[11px] opacity-80">
                            {p.region} · {p.category}
                          </span>
                          <span className="mt-0.5 block text-[11px] opacity-90">
                            ต่ำสุด {p.min != null ? p.min.toFixed(4) : "-"} · เฉลี่ย{" "}
                            {p.avg != null ? p.avg.toFixed(4) : "-"} · สูงสุด{" "}
                            {p.max != null ? p.max.toFixed(4) : "-"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(22rem,1.2fr)] lg:items-start lg:gap-10">
          <section className="parallax-panel parallax-tier-primary animate-enter animate-enter-delay-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/80 sm:p-6">
            <div className="border-b border-zinc-100 pb-5">
              <h2 className="text-base font-bold text-zinc-900">ใส่คะแนนแต่ละวิชา (เต็ม 100)</h2>
              <p className="mt-2 max-w-prose text-xs leading-relaxed text-zinc-500">
                แยกเป็น 2 กลุ่ม: <strong>TPAT1 ความถนัดแพทย์</strong> (30%) และ <strong>A-Level</strong> (70%)
              </p>
            </div>

            <div className="mt-8 space-y-10">
              <div className="card-interactive rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 sm:p-6">
                <div className="mb-5 flex flex-col gap-2 border-b border-indigo-200/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-indigo-950">{TPAT1_GROUP.title}</h3>
                    <p className="mt-0.5 text-xs font-medium text-indigo-800/80">
                      {TPAT1_GROUP.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white">
                    รวม 30%
                  </span>
                </div>
                <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-indigo-100/70 px-3 py-2 ring-1 ring-indigo-200/80">
                  <p className="text-[12px] font-bold text-indigo-900">คะแนนรวม TPAT1 (เต็ม 300)</p>
                  <input
                    type="number"
                    value={tpat1Total.toFixed(2)}
                    readOnly
                    aria-label="คะแนนรวม TPAT1 เต็ม 300"
                    className="w-24 rounded-lg border-0 bg-white px-2 py-1.5 text-center text-sm font-black text-indigo-900 ring-1 ring-indigo-300 sm:w-28"
                  />
                </div>
                <div className="space-y-3 border-l-2 border-indigo-300/90 pl-3 sm:space-y-4 sm:pl-5">
                  {TPAT1_GROUP.parts.map(({ key, label, weight, hint }) => (
                    <div
                      key={key}
                      className="slider-row-focus-within rounded-xl bg-white/90 p-3.5 ring-1 ring-indigo-100/90"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-[13px] font-bold text-zinc-900">
                          <span className="text-indigo-600">TPAT1</span>
                          <span className="font-medium text-zinc-600"> · {label}</span>
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500">
                          สัดส่วน {weight % 1 === 0 ? weight : weight.toFixed(2)}%
                        </span>
                      </div>
                      {hint ? (
                        <p className="mb-2 text-[11px] leading-snug text-zinc-500">{hint}</p>
                      ) : null}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={0.01}
                          value={clampScore(scores[key])}
                          onChange={(e) =>
                            setScores((s) => ({ ...s, [key]: clampScore(e.target.value) }))
                          }
                          className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200"
                          style={{
                            background: sliderBackground(clampScore(scores[key]), 100, key),
                          }}
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={clampScore(scores[key])}
                          onChange={(e) =>
                            setScores((s) => ({ ...s, [key]: clampScore(e.target.value) }))
                          }
                          className="input-focus-ring w-16 shrink-0 rounded-lg border-0 bg-white px-1.5 py-1.5 text-center text-sm font-bold text-zinc-900 ring-1 ring-zinc-200 sm:w-20 sm:px-2 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-interactive rounded-2xl border border-sky-200/70 bg-sky-50/35 p-4 sm:p-6">
                <div className="mb-5 flex flex-col gap-1 border-b border-sky-200/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-sky-950">{ALEVEL_GROUP.title}</h3>
                    <p className="mt-0.5 text-xs text-sky-900/70">{ALEVEL_GROUP.description}</p>
                  </div>
                  <span className="mt-2 shrink-0 rounded-md bg-sky-100 px-2 py-1 text-[11px] font-bold text-sky-700 sm:mt-0">
                    รวม 70%
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                  {ALEVEL_GROUP.parts.map(({ key, label, weight }) => (
                    <div
                      key={key}
                      className="slider-row-focus-within rounded-xl bg-white/85 p-3.5 ring-1 ring-sky-100/80"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-zinc-900">A-Level · {label}</span>
                        <span className="text-[10px] font-bold text-zinc-500">
                          สัดส่วน {weight % 1 === 0 ? weight : weight.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={0.01}
                          value={clampScore(scores[key])}
                          onChange={(e) =>
                            setScores((s) => ({ ...s, [key]: clampScore(e.target.value) }))
                          }
                          className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200"
                          style={{
                            background: sliderBackground(clampScore(scores[key]), 100, key),
                          }}
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={clampScore(scores[key])}
                          onChange={(e) =>
                            setScores((s) => ({ ...s, [key]: clampScore(e.target.value) }))
                          }
                          className="input-focus-ring w-[4.1rem] shrink-0 rounded-lg border-0 bg-white px-1 py-1.5 text-center text-[11px] font-semibold tabular-nums text-zinc-900 ring-1 ring-zinc-200 sm:w-[4.4rem] sm:px-1.5 sm:text-xs focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="parallax-panel parallax-tier-side animate-enter animate-enter-delay-3 lg:sticky lg:top-8 lg:self-start">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/80">
              <div className="border-b border-zinc-100 pb-3">
                <h2 className="text-base font-bold tracking-tight text-zinc-900">
                  สรุปผลเทียบกับรายการที่เลือก
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  ดูผลได้ทันที ไม่ต้องเลื่อนไปด้านล่าง
                </p>
                <p className="mt-2 rounded-lg bg-zinc-900 px-3 py-2 text-base font-black text-white">
                  ติดทั้งหมด {passCount} จาก {results.length || 0} ที่เลือก
                </p>
                <button
                  type="button"
                  onClick={() => setIsResultsModalOpen(true)}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 px-3 py-3 text-base font-black text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                >
                  ดูผลแบบเต็ม
                </button>
              </div>

              {results.length === 0 ? (
                <p className="py-5 text-center text-xs leading-relaxed text-zinc-500">
                  ยังไม่มีรายการที่เลือกไว้สำหรับเปรียบเทียบ
                </p>
              ) : (
                <div className="mt-3 max-h-[68vh] overflow-auto pr-1">
                  <div className="sticky top-0 z-10 mb-2 rounded-lg border border-zinc-200 bg-white/95 p-2 backdrop-blur">
                    <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-zinc-700">
                      <span>ภาพรวมผลลัพธ์</span>
                      <span>{results.length} รายการ</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div className="flex h-full w-full">
                        <div
                          className="bg-emerald-500"
                          style={{ width: `${results.length ? (passCount / results.length) * 100 : 0}%` }}
                        />
                        <div
                          className="bg-rose-500"
                          style={{ width: `${results.length ? (failCount / results.length) * 100 : 0}%` }}
                        />
                        <div
                          className="bg-zinc-400"
                          style={{ width: `${results.length ? (blockedCount / results.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                        ผ่าน {passCount}
                      </span>
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
                        ไม่ผ่าน {failCount}
                      </span>
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-700">
                        ไม่ผ่านเกณฑ์ {blockedCount}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                  {results.map((r) => (
                    <article
                      key={r.program.id}
                      className={`rounded-lg border-l-4 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none ${
                        r.tone === "blocked"
                          ? "border-zinc-400 bg-zinc-100/90"
                          : r.tone === "pass"
                          ? "border-emerald-500 bg-emerald-50/50"
                          : r.tone === "fail"
                            ? "border-rose-500 bg-rose-50/40"
                            : "border-amber-400 bg-amber-50/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold leading-snug text-zinc-900">{r.program.fullName}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            r.tone === "blocked"
                              ? "bg-zinc-700 text-white"
                              : r.tone === "pass"
                                ? "bg-emerald-600 text-white"
                                : r.tone === "fail"
                                  ? "bg-rose-600 text-white"
                                  : "bg-amber-500 text-white"
                          }`}
                        >
                          {r.tone === "blocked"
                            ? "ไม่ผ่านเกณฑ์"
                            : r.tone === "pass"
                              ? "ผ่าน"
                              : r.tone === "fail"
                                ? "ไม่ผ่าน"
                                : "รอตรวจ"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">{r.status}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs tabular-nums">
                        <div className="rounded-lg border border-zinc-200 bg-white/80 px-2 py-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">คะแนนคุณ</p>
                          <p className="text-sm font-black text-zinc-900">{r.composite.toFixed(4)}</p>
                        </div>
                        <div className="rounded-lg border border-indigo-200 bg-indigo-50/90 px-2 py-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                            คะแนนต่ำสุด
                          </p>
                          <p className="text-sm font-black text-indigo-900">
                            {r.program.min != null ? r.program.min.toFixed(4) : "-"}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>

        <section className="mt-8 grid max-lg:mb-4 gap-3 2xl:hidden">
          <div className="score-card-glow bolder-score-card relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-950/95 via-zinc-900/95 to-emerald-950/95 p-4 text-white shadow-lg ring-1 ring-cyan-300/20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.35),transparent_45%),radial-gradient(circle_at_88%_20%,rgba(16,185,129,0.28),transparent_46%)]" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-200/90">คะแนนรวมทั้งหมด</p>
              <p
                className={`mt-1 text-4xl font-black tabular-nums tracking-tight text-emerald-300 transition-[transform,filter] duration-200 ${scoreBump ? "animate-score-bump" : ""}`}
                aria-live="polite"
                role="status"
              >
                {composite.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br from-fuchsia-900/95 via-rose-900/95 to-amber-900/95 p-4 text-white shadow-lg ring-1 ring-rose-300/30">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_15%,rgba(244,114,182,0.36),transparent_44%),radial-gradient(circle_at_85%_20%,rgba(251,191,36,0.28),transparent_46%)]" />
            <div className="relative">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-rose-100/95">หากพบเจอปัญหา</p>
              <p className="mt-1 text-sm font-bold leading-snug text-white/95">แจ้งปัญหา หรือติดตามข่าวสารได้ที่</p>
              <div className="mt-2 relative inline-flex items-center">
                <img
                  src={oneClickLogo}
                  alt="Oneclickmath logo"
                  className="pointer-events-none absolute -left-3 -top-2 z-10 h-10 w-auto drop-shadow-[0_8px_18px_rgba(79,15,50,0.38)]"
                  loading="lazy"
                />
                <a
                  href="https://www.instagram.com/oneclickmath/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-5 py-2.5 pl-12 text-sm font-black text-white shadow-lg shadow-fuchsia-500/25 ring-1 ring-white/50 transition hover:brightness-110"
                >
                  @oneclickmath
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className="parallax-panel parallax-tier-results relative z-20 mt-16 rounded-2xl border-t-4 border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/70 p-5 shadow-sm ring-1 ring-zinc-200/80 sm:mt-20 sm:p-7">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700/80 sm:text-xs">
              Our Mission
            </p>
            <p className="mt-2 bg-gradient-to-r from-indigo-700 via-fuchsia-700 to-emerald-700 bg-clip-text text-xl font-black leading-tight text-transparent sm:text-3xl">
              เราต้องทำเพื่อเด็กไทยทุกคน
            </p>
            <p className="mt-1 text-lg font-bold leading-snug text-zinc-800 sm:text-2xl">
              ให้มีโอกาสได้รับการศึกษาที่ดี
            </p>
            <div className="mt-3 h-1.5 w-40 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 shadow-[0_0_14px_rgba(99,102,241,0.35)]" />
          </div>
        </footer>
      </main>

      <div className="hidden fixed bottom-5 left-5 z-40 2xl:block sm:bottom-7 sm:left-7">
        <div className="relative w-[min(88vw,18rem)] overflow-hidden rounded-3xl border border-white/25 bg-gradient-to-br from-fuchsia-900/95 via-rose-900/95 to-amber-900/95 px-4 py-4 text-white shadow-[0_18px_50px_-18px_rgba(79,15,50,0.9)] ring-1 ring-rose-300/30 backdrop-blur sm:w-[18rem] sm:px-5 sm:py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_15%,rgba(244,114,182,0.36),transparent_44%),radial-gradient(circle_at_85%_20%,rgba(251,191,36,0.28),transparent_46%)]" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-rose-100/95">หากพบเจอปัญหา</p>
            <p className="mt-1 max-w-[14rem] text-sm font-bold leading-snug text-white/95">
              แจ้งปัญหา หรือติดตามข่าวสารได้ที่
            </p>
            <div className="mt-2 relative inline-flex items-center">
              <img
                src={oneClickLogo}
                alt="Oneclickmath logo"
                className="pointer-events-none absolute -left-3 -top-2 z-10 h-12 w-auto drop-shadow-[0_8px_18px_rgba(79,15,50,0.38)] sm:h-14"
                loading="lazy"
              />
              <a
                href="https://www.instagram.com/oneclickmath/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-5 py-2.5 pl-14 text-sm font-black text-white shadow-lg shadow-fuchsia-500/25 ring-1 ring-white/50 transition hover:brightness-110 sm:pl-16"
              >
                @oneclickmath
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none hidden fixed bottom-5 right-5 z-40 2xl:block sm:bottom-7 sm:right-7">
        <div className="score-card-glow bolder-score-card relative min-w-[18.5rem] overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-indigo-950/95 via-zinc-900/95 to-emerald-950/95 px-6 py-5 text-white shadow-[0_18px_50px_-18px_rgba(15,23,42,0.95)] ring-1 ring-cyan-300/20 backdrop-blur sm:min-w-[22.5rem] sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.35),transparent_45%),radial-gradient(circle_at_88%_20%,rgba(16,185,129,0.28),transparent_46%)]" />
          <div className="relative">
            <p className="text-base font-bold uppercase tracking-[0.16em] text-zinc-200/90 sm:text-lg">
              คะแนนรวมทั้งหมด
            </p>
          <p
            className={`mt-2 text-6xl font-black tabular-nums tracking-tight text-emerald-300 drop-shadow-[0_0_20px_rgba(52,211,153,0.45)] transition-[transform,filter] duration-200 sm:text-7xl ${scoreBump ? "animate-score-bump" : ""}`}
            aria-live="polite"
            role="status"
          >
            {composite.toFixed(4)}
          </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-300 shadow-[0_0_14px_rgba(34,211,238,0.55)]"
                style={{ width: `${Math.min(100, Math.max(0, composite))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {isNoticeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="animate-enter w-full max-w-2xl rounded-2xl border border-white/20 bg-white p-5 shadow-2xl sm:p-6">
            <p className="text-lg font-black text-zinc-900 sm:text-xl">ประกาศสำคัญสำหรับผู้ใช้งาน</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-700">
              ระบบนี้จัดทำขึ้นเพื่อช่วยประเมินผลเบื้องต้นเท่านั้น ข้อมูลสถิติและผลการคำนวณอาจมีความคลาดเคลื่อนจากประกาศทางการได้
              (จัดทำโดย <strong>คณิตคลิกเดียว</strong>)
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-700">
              ผู้ใช้งานควรตรวจสอบข้อมูลล่าสุดจากแหล่งทางการของ <strong>กสพท</strong> และ{" "}
              <strong>TCAS</strong> ในปีการศึกษานั้นๆ ก่อนใช้ประกอบการตัดสินใจทุกครั้ง
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="https://cotmesadmission.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
              >
                เว็บไซต์ทางการ กสพท
              </a>
              <a
                href="https://www.mytcas.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800 hover:bg-cyan-100"
              >
                เว็บไซต์ทางการ TCAS
              </a>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsNoticeOpen(false);
                try {
                  window.localStorage.setItem("gsat_notice_ack_v1", "1");
                } catch {
                  /* ignore storage errors */
                }
              }}
              className="mt-5 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-black text-white hover:bg-zinc-800"
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}

      {isResultsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-parallax animate-enter w-full max-w-6xl overflow-hidden rounded-2xl border border-white/20 bg-zinc-950/95 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/15 px-5 py-4">
              <div>
                <p className="text-lg font-black">หน้าต่างสรุปผลแบบเต็ม</p>
                <p className="text-sm text-zinc-300">เลือกการ์ดทางซ้าย แล้วดูรายละเอียดแบบเต็มทางขวา</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResultsModalOpen(false);
                  setModalUniversityFilter("all");
                  setModalFacultyFilter("all");
                  setModalToneFilter("all");
                }}
                className="rounded-lg border border-white/30 px-3 py-1.5 text-sm font-bold text-zinc-100 hover:bg-white/10"
              >
                ปิด
              </button>
            </div>

            <div className="grid max-h-[75vh] grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
              <div className="max-h-[75vh] space-y-2 overflow-auto border-b border-white/10 p-3 lg:border-b-0 lg:border-r">
                <div className="sticky top-0 z-10 mb-2 space-y-2 rounded-xl border border-white/10 bg-zinc-900/90 p-2 backdrop-blur">
                  <div className="grid grid-cols-1 gap-2">
                    <select
                      value={modalUniversityFilter}
                      onChange={(e) => setModalUniversityFilter(e.target.value)}
                      className="rounded-lg border border-white/20 bg-zinc-950 px-2.5 py-2 text-sm text-zinc-100"
                    >
                      <option value="all">ทุกมหาวิทยาลัย</option>
                      {modalUniversities.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <select
                      value={modalFacultyFilter}
                      onChange={(e) => setModalFacultyFilter(e.target.value)}
                      className="rounded-lg border border-white/20 bg-zinc-950 px-2.5 py-2 text-sm text-zinc-100"
                    >
                      <option value="all">ทุกคณะ</option>
                      {modalFaculties.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <select
                      value={modalToneFilter}
                      onChange={(e) => setModalToneFilter(e.target.value)}
                      className="rounded-lg border border-white/20 bg-zinc-950 px-2.5 py-2 text-sm text-zinc-100"
                    >
                      <option value="all">ทุกสถานะ</option>
                      <option value="pass">ผ่าน</option>
                      <option value="fail">ไม่ผ่าน</option>
                      <option value="blocked">ไม่ผ่านเกณฑ์</option>
                    </select>
                  </div>
                  <p className="text-xs text-zinc-300">
                    ผลลัพธ์หลังกรอง: <strong>{modalFilteredResults.length}</strong> รายการ
                  </p>
                </div>

                {modalFilteredResults.map((r) => {
                  const active = focusedResult?.program.id === r.program.id;
                  const toneClass =
                    r.tone === "blocked"
                      ? "border-zinc-400/80 bg-zinc-500/20"
                      : r.tone === "pass"
                        ? "border-emerald-400/80 bg-emerald-500/20"
                        : r.tone === "fail"
                          ? "border-rose-400/80 bg-rose-500/20"
                          : "border-amber-400/80 bg-amber-500/20";
                  return (
                    <button
                      key={r.program.id}
                      type="button"
                      onClick={() => setFocusedResultId(r.program.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none ${
                        active
                          ? `${toneClass} shadow-lg`
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <p className="text-sm font-bold leading-snug text-white">{r.program.fullName}</p>
                      <p className="mt-1 text-xs text-zinc-200">{r.status}</p>
                    </button>
                  );
                })}
              </div>

              <div className="max-h-[75vh] overflow-auto p-4">
                {focusedResult ? (
                  <div
                    className={`rounded-2xl border p-4 ${
                      focusedResult.tone === "blocked"
                        ? "border-zinc-400/80 bg-zinc-500/15"
                        : focusedResult.tone === "pass"
                          ? "border-emerald-400/80 bg-emerald-500/12"
                          : focusedResult.tone === "fail"
                            ? "border-rose-400/80 bg-rose-500/12"
                            : "border-amber-400/80 bg-amber-500/10"
                    }`}
                  >
                    <p className="text-2xl font-black leading-snug text-white">{focusedResult.program.fullName}</p>
                    <p className="mt-2 text-base text-zinc-200">{focusedResult.status}</p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-zinc-900/70 p-3 ring-1 ring-white/10">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">คะแนนรวมของคุณ</p>
                        <p className="mt-1 text-3xl font-black text-emerald-400">
                          {focusedResult.composite.toFixed(4)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-zinc-900/70 p-3 ring-1 ring-white/10">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">คะแนนต่ำสุด</p>
                        <p className="mt-1 text-3xl font-black text-cyan-300">
                          {focusedResult.program.min != null ? focusedResult.program.min.toFixed(4) : "-"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl bg-zinc-900/70 p-3 ring-1 ring-white/10">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">ภาพรวมที่เลือก</p>
                      <p className="mt-2 text-base text-zinc-100">
                        ผ่าน <strong className="text-emerald-400">{modalPassCount}</strong> · ไม่ผ่าน{" "}
                        <strong className="text-rose-400">{modalFailCount}</strong> · ไม่ผ่านเกณฑ์{" "}
                        <strong className="text-zinc-300">{modalBlockedCount}</strong> จากทั้งหมด{" "}
                        <strong>{modalFilteredResults.length}</strong>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">ยังไม่มีรายการให้แสดง</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
