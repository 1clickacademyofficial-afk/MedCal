# -*- coding: utf-8 -*-
"""Extract กสพท score tables from text-based PDFs into JSON for the web app."""
import argparse
import json
import re
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

# เช่น 50310101100101A (503 + หลักสูตร + A)
CODE_RE = re.compile(r"^503\d{10,14}A$")


def parse_gsat_text(text: str) -> tuple[int | None, list[dict]]:
    """Parse announcement body; return (พ.ศ. ปีการศึกษา, programs)."""
    be_year = None
    m = re.search(r"ปีการศึกษา\s*(\d{4})", text)
    if m:
        be_year = int(m.group(1))

    def parse_num(x: str):
        t = x.strip()
        if t in ("-", ""):
            return None
        try:
            return float(t)
        except ValueError:
            return None

    lines = [ln.strip() for ln in text.splitlines()]
    programs: list[dict] = []
    i = 0
    while i < len(lines):
        ln = lines[i]
        code = None
        institution = ""
        j = i + 1

        combined = re.match(r"^(503\d{10,14}A)\s+(.+)$", ln)
        if combined:
            code = combined.group(1)
            institution = combined.group(2).strip()
        elif CODE_RE.match(ln):
            code = ln
            name_parts: list[str] = []
            while j < len(lines):
                nxt = lines[j]
                if re.match(r"^503\d{10,14}A(\s+|$)", nxt):
                    break
                if re.match(r"^-?[\d.]+\s*$", nxt):
                    break
                if re.match(r"^-?[\d.]+\s+-?[\d.]+$", nxt):
                    break
                if re.match(r"^-?[\d.]+\s+-?[\d.]+\s+-?[\d.]+$", nxt):
                    break
                if nxt:
                    name_parts.append(nxt)
                j += 1
            institution = " ".join(name_parts).strip()

        if not code:
            i += 1
            continue

        nums: list[str] = []
        k = j
        while k < len(lines) and len(nums) < 3:
            chunk = lines[k]
            if re.match(r"^-?[\d.]+\s+-?[\d.]+$", chunk):
                nums.extend(chunk.split()[:2])
                k += 1
                break
            if re.match(r"^-?[\d.]+\s+-?[\d.]+\s+-?[\d.]+$", chunk):
                nums.extend(chunk.split()[:3])
                k += 1
                break
            if re.match(r"^-?[\d.]+\s*$", chunk):
                nums.append(chunk)
            k += 1

        if len(nums) >= 3:
            programs.append(
                {
                    "code": code,
                    "institution": institution,
                    "max": parse_num(nums[0]),
                    "min": parse_num(nums[1]),
                    "avg": parse_num(nums[2]),
                }
            )
        i = k if k > j else j

    return be_year, programs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("-o", "--out", type=Path, required=True)
    args = parser.parse_args()

    if fitz is None:
        raise SystemExit("Install PyMuPDF: pip install pymupdf")

    doc = fitz.open(args.pdf)
    full = "\n".join(page.get_text() for page in doc)
    be_year, programs = parse_gsat_text(full)
    stem = args.pdf.stem
    file_year = int(stem) if stem.isdigit() else None
    # พ.ศ. = 2500 + xx for file 68 -> 2568
    if be_year is None and file_year is not None:
        be_year = 2500 + file_year

    payload = {
        "sourceFile": args.pdf.name,
        "beYear": be_year,
        "academicYearLabel": f"พ.ศ. {be_year}" if be_year else None,
        "programs": programs,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(programs)} programs to {args.out} (ปี พ.ศ. {be_year})")


if __name__ == "__main__":
    main()
