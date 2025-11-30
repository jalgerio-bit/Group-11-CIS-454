from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from forecast_Orders import (
    load_snapshots,
    compute_usage,
    attach_metadata,
    compute_reorder,
)

app = Flask(__name__)
CORS(app)  # helpful if you don't use the CRA proxy

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)


@app.route("/api/run-forecast", methods=["POST"])
def run_forecast():
    # Expect 4 uploaded files: week1, week2, week3, week4
    week_paths = []

    for i in range(1, 5):
        file = request.files.get(f"week{i}")
        if file is None or file.filename == "":
            return jsonify({"error": f"Missing file for week{i}"}), 400

        # Save as weekX_inventory.csv in the data folder
        filename = f"week{i}_inventory.csv"
        path = os.path.join(DATA_DIR, filename)
        file.save(path)
        week_paths.append(path)

    # Use your existing forecasting logic
    concat_df = load_snapshots(week_paths)
    usage_df = compute_usage(concat_df)
    latest_idx = concat_df["snapshot"].max()
    latest_snapshot = concat_df.loc[concat_df["snapshot"] == latest_idx]

    summary = attach_metadata(usage_df, latest_snapshot)
    summary = compute_reorder(summary)
    summary = summary.sort_values("Item")

    # Save next_week_orders.csv next to the weekly files
    out_path = os.path.join(DATA_DIR, "next_week_orders.csv")
    summary.to_csv(out_path, index=False)

    # Return JSON for the UI
    return jsonify(summary.to_dict(orient="records"))


if __name__ == "__main__":
    # Install deps first: pip install flask flask-cors pandas
    app.run(host="127.0.0.1", port=5000, debug=True)
