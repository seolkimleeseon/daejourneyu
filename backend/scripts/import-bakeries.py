"""Normalize the four user-provided district CSV exports into a reproducible source snapshot."""
import csv
import json
import pathlib
import re
import sys


CHAIN_NAMES = ("파리바게", "뚜레쥬르", "던킨", "크리스피크림", "브레댄코", "파리크라상", "로띠번", "호밀호두")
NON_BAKERY_NAMES = ("만두", "김밥", "국밥", "순대", "떡볶이")


def is_pilgrimage_bakery(name: str) -> bool:
    normalized = "".join(char for char in name.lower() if char not in " ()·._-")
    return bool(normalized) and not any(word in normalized for word in CHAIN_NAMES + NON_BAKERY_NAMES)


def bakery_name_key(name: str) -> str:
    normalized = "".join(char for char in name.lower() if char not in " ()·._-")
    return re.sub(r"([가-힣])[1-9](?:호점)?$", r"\1", normalized)


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
                status = (row.get("영업상태명") or row.get("영업상태") or row.get("상태") or "").strip()
                if row.get("폐업일자") or any(word in status for word in ("폐업", "휴업", "말소", "취소")):
                    continue
                name = (row.get("업소명") or row.get("상호명") or "").strip()
                address = (row.get("소재지도로명주소") or row.get("소재지(도로명)") or "").strip()
                if is_pilgrimage_bakery(name) and address.startswith("대전") and district in address:
                    rows.append({"name": name, "district": district, "address": address})
    deduped = {}
    for row in rows:
        deduped.setdefault((row["district"], bakery_name_key(row["name"])), row)
    rows = list(deduped.values())
    destination = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "bakeries.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} bakeries to {destination}")


if __name__ == "__main__":
    main(sys.argv[1:])
