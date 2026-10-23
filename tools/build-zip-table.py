"""Build data/zips.json from the US Census ZCTA Gazetteer file.

Download the national ZCTA gazetteer (public domain), e.g.
https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip
unzip it, then run:

    python3 tools/build-zip-table.py path/to/2024_Gaz_zcta_national.txt data/zips.json

Output maps each 5-digit ZIP to [lat, lon] rounded to 2 decimals (~1 km),
which is plenty for "centers within X miles" and keeps the file small.
"""

import csv
import json
import sys

# Enrollment centers whose postal code has no Census ZCTA (airport-only ZIPs,
# Canadian border crossings). Keyed by the first 5 chars of postalCode.
EXTRA = {
    "30320": [33.64, -84.43],  # Atlanta Hartsfield-Jackson airport
    "60666": [41.98, -87.90],  # Chicago O'Hare airport
    "20229": [38.89, -77.03],  # Washington, DC
    "15231": [40.49, -80.23],  # Pittsburgh airport
    "L2A3S": [42.91, -78.93],  # Fort Erie, ON (Peace Bridge)
}


def main(src, dest):
    table = dict(EXTRA)
    with open(src, newline="", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        header = [h.strip() for h in next(reader)]
        zip_i = header.index("GEOID")
        lat_i = header.index("INTPTLAT")
        lon_i = header.index("INTPTLONG")
        for row in reader:
            zip_code = row[zip_i].strip()
            if len(zip_code) != 5 or not zip_code.isdigit():
                continue
            table[zip_code] = [
                round(float(row[lat_i]), 2),
                round(float(row[lon_i]), 2),
            ]

    with open(dest, "w", encoding="utf-8") as f:
        json.dump(table, f, separators=(",", ":"), sort_keys=True)
    print(f"Wrote {len(table)} ZIPs to {dest}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
