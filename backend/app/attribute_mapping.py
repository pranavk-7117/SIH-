"""
Intelligent Attribute Mapping Module — BHUMI-FUSE

Implements rule-based schema crosswalk with fuzzy-string-match fallback
(Levenshtein distance) for unmapped fields. This is an honest, defensible
implementation of 'intelligent attribute mapping' at prototype scale.

Supports 3 department schemas → 1 canonical schema normalization + reverse mapping
for inter-departmental data exchange.
"""
from __future__ import annotations
from typing import Any


# ── Canonical Schema ────────────────────────────────────────────────────────
CANONICAL_FIELDS = {
    "parcel_id": str,
    "owner_name": str,
    "area_sqm": float,
    "land_use": str,
    "survey_number": str,
    "mutation_date": str,
    "encumbrance": bool,
}

# ── Department Schemas ───────────────────────────────────────────────────────
DEPARTMENT_SCHEMAS: dict[str, dict[str, str]] = {
    "revenue": {
        # dept field name → canonical field name
        "patta_holder": "owner_name",
        "ksetra_phal": "area_sqm",
        "bhu_upyog": "land_use",
        "sarvekshan_sankha": "survey_number",
        "antarim_tithi": "mutation_date",
        "girvi": "encumbrance",
        "parcel_id": "parcel_id",
    },
    "municipal": {
        # dept field name → canonical field name
        "property_owner": "owner_name",
        "plot_area": "area_sqm",
        "zone_class": "land_use",
        "property_survey_no": "survey_number",
        "last_transfer_date": "mutation_date",
        "mortgage_flag": "encumbrance",
        "parcel_id": "parcel_id",
    },
    "pmrda": {
        "pattadar": "owner_name",
        "plot_area_sqm": "area_sqm",
        "land_category": "land_use",
        "survey_no": "survey_number",
        "mutation_dt": "mutation_date",
        "encumbrance_flag": "encumbrance",
        "parcel_id": "parcel_id",
    },
}

# Reverse: canonical → dept-specific field name
REVERSE_SCHEMAS: dict[str, dict[str, str]] = {
    dept: {v: k for k, v in schema.items()}
    for dept, schema in DEPARTMENT_SCHEMAS.items()
}


def _levenshtein(a: str, b: str) -> int:
    """Classic DP Levenshtein distance."""
    if len(a) < len(b):
        return _levenshtein(b, a)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a):
        curr = [i + 1]
        for j, cb in enumerate(b):
            curr.append(min(prev[j + 1] + 1, curr[j] + 1, prev[j] + (ca != cb)))
        prev = curr
    return prev[-1]


def fuzzy_match_field(incoming_field: str, schema: dict[str, str]) -> tuple[str | None, float]:
    """
    Try to match an unmapped incoming field to a department schema key using
    Levenshtein distance. Returns (best_match_key, confidence) or (None, 0.0).
    """
    best_key, best_score = None, 0.0
    field_lower = incoming_field.lower()
    for key in schema:
        dist = _levenshtein(field_lower, key.lower())
        max_len = max(len(field_lower), len(key))
        similarity = 1.0 - dist / max_len if max_len > 0 else 0.0
        if similarity > best_score:
            best_score = similarity
            best_key = key
    return (best_key, round(best_score, 3)) if best_score >= 0.60 else (None, 0.0)


def normalize_to_canonical(record: dict[str, Any], dept_id: str) -> dict[str, Any]:
    """
    Map a department-schema record to the canonical schema.
    Returns {canonical_field: value, _mapping_log: [...]}.
    """
    schema = DEPARTMENT_SCHEMAS.get(dept_id, {})
    out: dict[str, Any] = {}
    mapping_log = []

    for dept_field, value in record.items():
        if dept_field in schema:
            canonical = schema[dept_field]
            out[canonical] = value
            mapping_log.append({"dept_field": dept_field, "canonical": canonical, "method": "exact", "confidence": 1.0})
        else:
            matched_key, conf = fuzzy_match_field(dept_field, schema)
            if matched_key:
                canonical = schema[matched_key]
                out[canonical] = value
                mapping_log.append({"dept_field": dept_field, "canonical": canonical, "method": "fuzzy", "confidence": conf})
            else:
                out[f"_unmapped_{dept_field}"] = value
                mapping_log.append({"dept_field": dept_field, "canonical": None, "method": "unmapped", "confidence": 0.0})

    out["_mapping_log"] = mapping_log
    return out


def map_to_department(canonical_record: dict[str, Any], dept_id: str) -> dict[str, Any]:
    """
    Reverse-map a canonical record to the target department's schema.
    Used by /export/department/{dept_id}.
    """
    reverse = REVERSE_SCHEMAS.get(dept_id, {})
    out: dict[str, Any] = {}
    for canonical_field, value in canonical_record.items():
        if canonical_field.startswith("_"):
            continue
        dept_field = reverse.get(canonical_field, canonical_field)
        out[dept_field] = value
    out["_target_schema"] = dept_id
    out["_bhumi_fuse_version"] = "1.0.0"
    return out


def detect_schema(incoming_fields: list[str]) -> tuple[str, float]:
    """
    Identify which department schema best matches a set of incoming field names.
    Returns (dept_id, match_confidence).
    """
    best_dept, best_score = "revenue", 0.0
    for dept, schema in DEPARTMENT_SCHEMAS.items():
        schema_keys = set(schema.keys())
        matches = sum(1 for f in incoming_fields if f in schema_keys)
        score = matches / len(schema_keys) if schema_keys else 0.0
        if score > best_score:
            best_score = score
            best_dept = dept
    return best_dept, round(best_score, 3)
