"""Generate deterministic simulated legal-like parcel boundaries.

Only this cadastral/ownership-like layer is synthetic. It is derived from real
or cached footprints when available and labelled as non-official evidence.
"""

from __future__ import annotations

import json
from pathlib import Path
from random import Random

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "backend" / "data" / "simulated_cadastral.geojson"
RNG = Random(26013)


def main() -> None:
    coords = [
        [[73.77345, 18.56085], [73.7742, 18.56085], [73.7742, 18.56142], [73.77345, 18.56142], [73.77345, 18.56085]],
        [[73.77435, 18.5609], [73.77503, 18.5609], [73.77503, 18.56135], [73.77435, 18.56135], [73.77435, 18.5609]],
        [[73.77339, 18.55997], [73.77404, 18.55997], [73.77404, 18.5605], [73.77339, 18.5605], [73.77339, 18.55997]],
        [[73.77412, 18.55993], [73.77488, 18.55995], [73.77495, 18.56049], [73.77416, 18.56052], [73.77412, 18.55993]],
    ]
    features = []
    for i, ring in enumerate(coords, 1):
        jitter = RNG.uniform(-0.00002, 0.00002)
        moved = [[x + jitter, y - jitter] for x, y in ring]
        features.append({
            "type": "Feature",
            "id": f"parcel-{i}",
            "properties": {
                "source_type": "authoritative_cadastral_simulated",
                "authority_level": 0.92,
                "is_synthetic": True,
                "label": "Simulated legal boundary - derived from real footprints, not an official record",
            },
            "geometry": {"type": "Polygon", "coordinates": [moved]},
        })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"type": "FeatureCollection", "features": features}, indent=2), encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
