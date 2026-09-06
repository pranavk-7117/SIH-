"""
Synthetic Revenue Attribute Layer — BHUMI-FUSE

Each parcel has a corresponding revenue record joining non-spatial (legal/ownership)
attributes to spatial geometry via parcel_id. This directly demonstrates the
PS-26013 requirement for spatial + non-spatial dataset integration.

Label: 'Simulated Revenue Attribute Layer' — data is realistic but synthetic.
"""
from __future__ import annotations
import random
from typing import Any

LAND_USE_CLASSES = ["Residential", "Commercial", "Mixed-Use", "Agricultural", "Industrial", "Institutional"]
MUTATION_TYPES = ["Sale Deed", "Gift Deed", "Inheritance", "Court Decree", "Exchange Deed"]
OWNERS = [
    "Rajesh Kumar Sharma", "Priya Suresh Nair", "Mohammed Farooq Khan",
    "Sunita Dattatray Patil", "Anil Vinayak Joshi", "Kavitha Ramesh Iyer",
    "Deepak Sunil Kulkarni", "Meena Prakash Desai", "Sanjay Bhaskar Rao",
    "Lakshmi Narayana Reddy", "Fatima Begum Shaikh", "Rajan Thomas Mathew",
]

rng = random.Random(42)  # deterministic seed for reproducibility


def _make_record(parcel_id: str, pid_num: int, area_id: str) -> dict[str, Any]:
    rng.seed(pid_num * 17 + hash(area_id) % 997)
    year = rng.randint(1982, 2023)
    month = rng.randint(1, 12)
    day = rng.randint(1, 28)
    survey_no = f"{rng.randint(100, 999)}/{rng.randint(1, 20)}"
    khata_no = f"KH-{rng.randint(1000, 9999)}"
    return {
        "parcel_id": parcel_id,
        "survey_number": survey_no,
        "khata_number": khata_no,
        "khasra_number": f"KS-{rng.randint(100, 999)}",
        "owner_of_record": rng.choice(OWNERS),
        "co_owner": rng.choice(OWNERS) if rng.random() > 0.6 else None,
        "land_use_class": rng.choice(LAND_USE_CLASSES),
        "area_sqm_revenue": round(rng.uniform(800, 3200), 1),
        "last_mutation_date": f"{day:02d}-{month:02d}-{year}",
        "mutation_type": rng.choice(MUTATION_TYPES),
        "encumbrance": rng.random() > 0.75,
        "dispute_flag": rng.random() > 0.85,
        "revenue_source": "Simulated Revenue Attribute Layer (Maharashtra 7/12 Extract format)",
        "data_label": "illustrative",
    }


# Parcel ID ranges per area
_AREA_RANGES = {
    "pune_kharadi": range(101, 125),
    "pmrda_wagholi": range(201, 225),
    "pcmc_hinjawadi": range(301, 325),
}

# Pre-generate all records
_RECORDS: dict[str, dict[str, Any]] = {}
for _area_id, _pid_range in _AREA_RANGES.items():
    for _pid in _pid_range:
        _pid_str = str(_pid)
        _RECORDS[f"{_area_id}:{_pid_str}"] = _make_record(_pid_str, _pid, _area_id)


def get_revenue_records(area_id: str) -> list[dict[str, Any]]:
    """Return all revenue records for the given study area."""
    records = []
    for pid in _AREA_RANGES.get(area_id, _AREA_RANGES["pune_kharadi"]):
        key = f"{area_id}:{pid}"
        if key in _RECORDS:
            records.append(_RECORDS[key])
    return records


def get_revenue_record(area_id: str, parcel_id: str) -> dict[str, Any] | None:
    """Return a single revenue record by area and parcel_id."""
    return _RECORDS.get(f"{area_id}:{parcel_id}")
