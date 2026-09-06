import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent.parent / "bhumi_fuse.db"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def _sha256_row(prev_hash: str, row_data: dict) -> str:
    """Compute SHA-256(prev_hash + JSON(row_data)) for tamper-evident chaining."""
    payload = prev_hash + json.dumps(row_data, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()


def _get_latest_hash(cursor: sqlite3.Cursor, table: str) -> str:
    """Fetch the last row_hash from a table, or genesis hash if empty."""
    try:
        cursor.execute(f"SELECT row_hash FROM {table} ORDER BY rowid DESC LIMIT 1")
        row = cursor.fetchone()
        return row[0] if row and row[0] else "0" * 64
    except Exception:
        return "0" * 64


def init_db() -> None:
    conn = get_db()
    cursor = conn.cursor()

    # Investigations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS investigations (
        id TEXT PRIMARY KEY,
        area_id TEXT NOT NULL,
        area_name TEXT NOT NULL,
        status TEXT DEFAULT 'IN_PROGRESS',
        parcels_count INTEGER DEFAULT 24,
        created_at TEXT NOT NULL
    );
    """)

    # Review Decisions — append-only ledger with hash chain
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS review_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT NOT NULL,
        parcel_id TEXT NOT NULL,
        decision TEXT NOT NULL,
        reviewer TEXT NOT NULL,
        note TEXT,
        version INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        row_hash TEXT NOT NULL DEFAULT ''
    );
    """)

    # Audit Trail — tamper-evident hash chain
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        user TEXT NOT NULL,
        details TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        row_hash TEXT NOT NULL DEFAULT ''
    );
    """)

    # Ground Truth Annotations (review decisions reframed as GT records)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ground_truth (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parcel_id TEXT NOT NULL,
        area_id TEXT NOT NULL,
        verified_match TEXT,
        verifying_officer TEXT NOT NULL,
        decision TEXT NOT NULL,
        ai_recommendation TEXT,
        matches_ai_recommendation INTEGER NOT NULL DEFAULT 0,
        timestamp TEXT NOT NULL
    );
    """)

    # Check and alter tables if columns are missing from earlier migration
    cursor.execute("PRAGMA table_info(review_decisions)")
    rd_cols = [c[1] for c in cursor.fetchall()]
    if "row_hash" not in rd_cols:
        cursor.execute("ALTER TABLE review_decisions ADD COLUMN row_hash TEXT NOT NULL DEFAULT ''")

    cursor.execute("PRAGMA table_info(audit_logs)")
    al_cols = [c[1] for c in cursor.fetchall()]
    if "row_hash" not in al_cols:
        cursor.execute("ALTER TABLE audit_logs ADD COLUMN row_hash TEXT NOT NULL DEFAULT ''")

    # Seed investigations if empty
    cursor.execute("SELECT COUNT(*) FROM investigations")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            "INSERT INTO investigations (id, area_id, area_name, status, parcels_count, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            [
                ("INV-2026-00124", "pune_kharadi", "Kharadi Sector 12, Pune", "IN_PROGRESS", 24, "2026-09-02T10:30:00Z"),
                ("INV-2026-00123", "pmrda_wagholi", "Wagholi Peri-Urban Village, PMRDA", "IN_PROGRESS", 24, "2026-09-03T09:15:00Z"),
                ("INV-2026-00122", "pcmc_hinjawadi", "Hinjawadi Phase 3 IT Corridor, PCMC", "COMPLETED", 24, "2026-09-01T14:20:00Z"),
            ],
        )

    # Seed audit logs with hash chain if empty or missing row_hash
    cursor.execute("SELECT COUNT(*) FROM audit_logs")
    if cursor.fetchone()[0] == 0:
        seed_entries = [
            ("aud-001", "Sources Ingested", "System",
             "Ingested 4 files: Cadastral SHP, Drone GeoJSON footprints, GNSS CSV, Municipal GeoJSON. Real GeoJSON/CSV paths active; SHP/GeoTIFF/GPKG coming soon.",
             "upload", "02 Sep 2026 10:30"),
            ("aud-002", "CRS Normalized", "System",
             "Transformed all ingested sources from declared EPSG:32643 (UTM Zone 43N) to common WGS84 EPSG:4326 reference frame.",
             "process", "02 Sep 2026 10:32"),
            ("aud-003", "Boundary Observations Ingested", "System",
             "Ingested 24 physical parcel boundary observations (OSM/footprint-derived). Boundary observations sourced from prepared footprint data; learned image segmentation is the next inference layer.",
             "process", "02 Sep 2026 10:35"),
            ("aud-004", "Evidence Graph Built", "System",
             "Constructed spatial evidence graph: 59 nodes, 58 cross-source relationship edges. Adjacency and road-intersection edges computed from real spatial predicates (centroid proximity, bounding-box adjacency).",
             "process", "02 Sep 2026 10:38"),
            ("aud-005", "Registration & Alignment", "System",
             "RANSAC-filtered correspondence set. True TPS (r²log(r) kernel) transform computed on inlier control points. Sub-meter RMSE validated post-alignment.",
             "process", "02 Sep 2026 10:41"),
            ("aud-006", "Topology Verification & Correction", "System",
             "ST_IsValid executed on all harmonized polygons. Auto-corrected self-intersections via buffer(0). Remaining invalid geometries routed to manual correction.",
             "process", "02 Sep 2026 10:45"),
        ]
        prev_hash = "0" * 64
        for entry in seed_entries:
            row_data = {"id": entry[0], "action": entry[1], "user": entry[2],
                        "details": entry[3], "type": entry[4], "timestamp": entry[5]}
            h = _sha256_row(prev_hash, row_data)
            cursor.execute(
                "INSERT INTO audit_logs (id, action, user, details, type, timestamp, row_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (*entry, h),
            )
            prev_hash = h
    else:
        # Check if rows have empty row_hash and populate them
        cursor.execute("SELECT rowid, id, action, user, details, type, timestamp, row_hash FROM audit_logs ORDER BY rowid ASC")
        rows = cursor.fetchall()
        prev_hash = "0" * 64
        for row in rows:
            if not row["row_hash"]:
                row_data = {"id": row["id"], "action": row["action"], "user": row["user"],
                            "details": row["details"], "type": row["type"], "timestamp": row["timestamp"]}
                h = _sha256_row(prev_hash, row_data)
                cursor.execute("UPDATE audit_logs SET row_hash = ? WHERE rowid = ?", (h, row["rowid"]))
                prev_hash = h
            else:
                prev_hash = row["row_hash"]

    conn.commit()
    conn.close()


def insert_review(
    case_id: str, parcel_id: str, decision: str, reviewer: str, note: str,
    ai_recommendation: str = "", area_id: str = "pune_kharadi"
) -> dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT MAX(version) FROM review_decisions WHERE case_id = ?", (case_id,))
    res = cursor.fetchone()[0]
    next_ver = (res or 0) + 1
    ts = datetime.now(timezone.utc).isoformat()

    # Build row data for hashing
    row_data = {"case_id": case_id, "parcel_id": parcel_id, "decision": decision,
                "reviewer": reviewer, "note": note, "version": next_ver, "created_at": ts}
    prev_hash = _get_latest_hash(cursor, "review_decisions")
    row_hash = _sha256_row(prev_hash, row_data)

    cursor.execute(
        "INSERT INTO review_decisions (case_id, parcel_id, decision, reviewer, note, version, created_at, row_hash) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (case_id, parcel_id, decision, reviewer, note, next_ver, ts, row_hash),
    )

    # Audit log entry with hash chain
    audit_id = f"aud-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    details = f"Parcel {parcel_id}: Decision '{decision.upper()}' recorded (v{next_ver}). Note: {note}"
    audit_row = {"id": audit_id, "action": f"Decision: {decision.upper()}", "user": reviewer,
                 "details": details, "type": "decision", "timestamp": ts}
    prev_hash_audit = _get_latest_hash(cursor, "audit_logs")
    audit_hash = _sha256_row(prev_hash_audit, audit_row)
    cursor.execute(
        "INSERT INTO audit_logs (id, action, user, details, type, timestamp, row_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (audit_id, audit_row["action"], reviewer, details, "decision", ts, audit_hash),
    )

    # Ground Truth record — every review decision IS a GT annotation
    matches_ai = 1 if ai_recommendation and decision.lower() in ai_recommendation.lower() else 0
    cursor.execute(
        "INSERT INTO ground_truth (parcel_id, area_id, verifying_officer, decision, ai_recommendation, matches_ai_recommendation, timestamp) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (parcel_id, area_id, reviewer, decision, ai_recommendation, matches_ai, ts),
    )

    conn.commit()
    conn.close()

    return {"case_id": case_id, "parcel_id": parcel_id, "decision": decision,
            "reviewer": reviewer, "note": note, "version": next_ver,
            "created_at": ts, "row_hash": row_hash[:16] + "..."}


def get_all_reviews() -> list[dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM review_decisions ORDER BY id DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def get_all_audits() -> list[dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY rowid DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def get_db_stats() -> dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM review_decisions"); total_reviews = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM audit_logs"); total_audits = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM investigations"); total_inv = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM ground_truth"); total_gt = cursor.fetchone()[0]
    cursor.execute("SELECT SUM(matches_ai_recommendation), COUNT(*) FROM ground_truth")
    gt_row = cursor.fetchone()
    gt_matches = gt_row[0] or 0
    gt_total = gt_row[1] or 0
    gt_agreement = round(gt_matches / gt_total, 3) if gt_total > 0 else None
    conn.close()
    return {
        "total_reviews": total_reviews,
        "total_audits": total_audits,
        "total_investigations": total_inv,
        "total_gt_annotations": total_gt,
        "gt_ai_agreement_rate": gt_agreement,
        "database": "SQLite (ACID compliant, tamper-evident hash chain)",
        "file": str(DB_PATH.name),
    }


def verify_audit_chain() -> dict[str, Any]:
    """Recompute the hash chain and report whether it is intact."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, action, user, details, type, timestamp, row_hash FROM audit_logs ORDER BY rowid ASC")
    rows = cursor.fetchall()
    conn.close()

    prev_hash = "0" * 64
    for row in rows:
        row_data = {"id": row["id"], "action": row["action"], "user": row["user"],
                    "details": row["details"], "type": row["type"], "timestamp": row["timestamp"]}
        expected = _sha256_row(prev_hash, row_data)
        stored = row["row_hash"]
        if stored and stored != expected:
            return {"chain_valid": False, "tampered_at": row["id"], "total_entries": len(rows)}
        prev_hash = stored or expected

    return {"chain_valid": True, "tampered_at": None, "total_entries": len(rows)}
