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
        city_area TEXT DEFAULT 'Kharadi, Pune',
        cadastral_year TEXT DEFAULT '1960',
        survey_year TEXT DEFAULT '2024',
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'IN_PROGRESS',
        parcels_count INTEGER DEFAULT 24,
        current_step INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    );
    """)

    # Investigation Sources — per-investigation uploaded datasets
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS investigation_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        investigation_id TEXT NOT NULL,
        source_key TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_format TEXT NOT NULL,
        original_crs TEXT NOT NULL DEFAULT 'EPSG:4326',
        target_crs TEXT NOT NULL DEFAULT 'EPSG:32643',
        features_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'VALID',
        data_json TEXT,
        uploaded_at TEXT NOT NULL,
        UNIQUE(investigation_id, source_key)
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

    # SQLite R-Tree Spatial Index for fast candidate spatial filtering (PS-26013 Part B)
    try:
        cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS parcel_rtree USING rtree(
            id,              -- Integer primary key
            min_x, max_x,    -- Minimum and maximum longitude
            min_y, max_y     -- Minimum and maximum latitude
        );
        """)
    except Exception as e:
        print(f"Notice: R-Tree virtual table initialization: {e}")

    # Check and alter tables if columns are missing from earlier migration
    cursor.execute("PRAGMA table_info(investigations)")
    inv_cols = [c[1] for c in cursor.fetchall()]
    for col, col_def in [
        ("city_area", "TEXT DEFAULT 'Kharadi, Pune'"),
        ("cadastral_year", "TEXT DEFAULT '1960'"),
        ("survey_year", "TEXT DEFAULT '2024'"),
        ("description", "TEXT DEFAULT ''"),
        ("current_step", "INTEGER DEFAULT 1"),
    ]:
        if col not in inv_cols:
            cursor.execute(f"ALTER TABLE investigations ADD COLUMN {col} {col_def}")

    cursor.execute("PRAGMA table_info(review_decisions)")
    rd_cols = [c[1] for c in cursor.fetchall()]
    if "row_hash" not in rd_cols:
        cursor.execute("ALTER TABLE review_decisions ADD COLUMN row_hash TEXT NOT NULL DEFAULT ''")

    cursor.execute("PRAGMA table_info(audit_logs)")
    al_cols = [c[1] for c in cursor.fetchall()]
    if "row_hash" not in al_cols:
        cursor.execute("ALTER TABLE audit_logs ADD COLUMN row_hash TEXT NOT NULL DEFAULT ''")

    # Clean database initialization - no preloaded data
    # (Tables are created clean and empty ready for real user investigations)
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
        prev_hash = stored
    return {"chain_valid": True, "tampered_at": None, "total_entries": len(rows)}


def index_features_rtree(features: list[dict[str, Any]]) -> None:
    """Populate SQLite R-Tree with bounding boxes of features for sub-millisecond spatial queries."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM parcel_rtree")
        for idx, feat in enumerate(features):
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [])
            if geom.get("type") == "Polygon" and coords:
                ring = coords[0]
                lons = [p[0] for p in ring]
                lats = [p[1] for p in ring]
                cursor.execute(
                    "INSERT OR REPLACE INTO parcel_rtree (id, min_x, max_x, min_y, max_y) VALUES (?, ?, ?, ?, ?)",
                    (idx, min(lons), max(lons), min(lats), max(lats))
                )
        conn.commit()
    except Exception as e:
        print(f"Notice: R-Tree indexing exception: {e}")
    finally:
        conn.close()


def query_candidates_rtree(min_x: float, max_x: float, min_y: float, max_y: float) -> list[int]:
    """Query SQLite R-Tree for candidate feature indices within the spatial bounding box."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id FROM parcel_rtree WHERE min_x <= ? AND max_x >= ? AND min_y <= ? AND max_y >= ?",
            (max_x, min_x, max_y, min_y)
        )
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return []
    finally:
        conn.close()


# ── Investigation CRUD Helpers ─────────────────────────────────────────────
def create_investigation(
    inv_id: str,
    name: str,
    city_area: str = "Kharadi, Pune",
    cadastral_year: str = "1960",
    survey_year: str = "2024",
    description: str = "",
    parcels_count: int = 24,
) -> dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    ts = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        """INSERT OR REPLACE INTO investigations
           (id, area_id, area_name, city_area, cadastral_year, survey_year, description, status, parcels_count, current_step, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (inv_id, "pune_kharadi", name, city_area, cadastral_year, survey_year, description, "IN_PROGRESS", parcels_count, 1, ts),
    )
    conn.commit()
    conn.close()
    return {
        "id": inv_id,
        "name": name,
        "city_area": city_area,
        "cadastral_year": cadastral_year,
        "survey_year": survey_year,
        "description": description,
        "parcels_count": parcels_count,
        "current_step": 1,
        "created_at": ts,
    }


def get_investigations() -> list[dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM investigations ORDER BY created_at DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def get_investigation(inv_id: str) -> dict[str, Any] | None:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM investigations WHERE id = ?", (inv_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    inv = dict(row)
    cursor.execute("SELECT * FROM investigation_sources WHERE investigation_id = ?", (inv_id,))
    sources = [dict(r) for r in cursor.fetchall()]
    inv["sources"] = {s["source_key"]: s for s in sources}
    inv["sources_list"] = sources
    conn.close()
    return inv


def update_investigation_step(inv_id: str, step: int) -> None:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE investigations SET current_step = MAX(current_step, ?) WHERE id = ?", (step, inv_id))
    conn.commit()
    conn.close()


def upsert_investigation_source(
    inv_id: str,
    source_key: str,
    filename: str,
    file_format: str,
    original_crs: str = "EPSG:4326",
    target_crs: str = "EPSG:32643",
    features_count: int = 0,
    status: str = "VALID",
    data_json: str | None = None,
) -> dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    ts = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        """INSERT INTO investigation_sources
           (investigation_id, source_key, filename, file_format, original_crs, target_crs, features_count, status, data_json, uploaded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(investigation_id, source_key) DO UPDATE SET
               filename = excluded.filename,
               file_format = excluded.file_format,
               original_crs = excluded.original_crs,
               target_crs = excluded.target_crs,
               features_count = excluded.features_count,
               status = excluded.status,
               data_json = excluded.data_json,
               uploaded_at = excluded.uploaded_at""",
        (inv_id, source_key, filename, file_format, original_crs, target_crs, features_count, status, data_json, ts),
    )
    conn.commit()
    conn.close()
    return {
        "investigation_id": inv_id,
        "source_key": source_key,
        "filename": filename,
        "file_format": file_format,
        "original_crs": original_crs,
        "target_crs": target_crs,
        "features_count": features_count,
        "status": status,
        "uploaded_at": ts,
    }


def get_investigation_sources(inv_id: str) -> dict[str, dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM investigation_sources WHERE investigation_id = ?", (inv_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {r["source_key"]: r for r in rows}
