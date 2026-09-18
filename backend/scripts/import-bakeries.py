"""Normalize the four user-provided district CSV exports into a reproducible source snapshot."""
import csv
import json
import pathlib
import sys


def main(paths: list[str]) -> None:
    rows = []
    for path_string in paths:
        path = pathlib.Path(path_string)
        district = next((name for name in ("대덕구", "동구", "유성구", "중구") if name in path.name), None)
        if district is None:
            raise ValueError(f"Unknown district: {path}")
        encoding = "utf-8-sig" if district == "대덕구" else "cp949"
        with path.open(encoding=encoding, newline="") as source:
            for row in csv.DictReader(source):
                if row.get("업종명", "제과점영업") != "제과점영업":
                    continue
                name = (row.get("업소명") or row.get("상호명") or "").strip()
                address = (row.get("소재지도로명주소") or row.get("소재지(도로명)") or "").strip()
                if name and address.startswith("대전"):
                    rows.append({"name": name, "district": district, "address": address})
    rows = list({(row["district"], row["name"], row["address"]): row for row in rows}.values())
    destination = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "bakeries.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} bakeries to {destination}")


if __name__ == "__main__":
    main(sys.argv[1:])
