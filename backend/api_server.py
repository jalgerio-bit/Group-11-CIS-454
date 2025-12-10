from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import pandas as pd
import math

from forecast_Orders import (
    load_snapshots,
    compute_usage,
    attach_metadata,
    compute_reorder,
    predict_future_usage,
    load_recipes,
    load_sales_plan,
    compute_ingredient_demand,
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

    # Optional: sales plan CSV uploaded with this request
    sales_plan_file = request.files.get("sales_plan")
    sales_plan_path = os.path.join(DATA_DIR, "sales_plan.csv")
    if sales_plan_file and sales_plan_file.filename:
        sales_plan_file.save(sales_plan_path)

    # Use your existing forecasting logic
    concat_df = load_snapshots(week_paths)
    usage_df = compute_usage(concat_df)
    latest_idx = concat_df["snapshot"].max()
    latest_snapshot = concat_df.loc[concat_df["snapshot"] == latest_idx]

    summary = attach_metadata(usage_df, latest_snapshot)
    summary = compute_reorder(summary)
    # Add model-based predictions so the frontend chart has data to display
    predictions = predict_future_usage(concat_df)
    summary = summary.merge(predictions, on="Item", how="left")

    # If recipes + sales plan are present, fold forecasted ingredient demand into the plan
    recipes_path = os.path.join(DATA_DIR, "recipes.csv")
    recipes_df = load_recipes(recipes_path)
    try:
        sales_df = load_sales_plan(sales_plan_path)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    demand_df = compute_ingredient_demand(recipes_df, sales_df)
    if not demand_df.empty:
        summary = summary.merge(demand_df, on="Item", how="left")
        summary["Forecasted_Ingredient_Demand"] = summary["Forecasted_Ingredient_Demand"].fillna(0)

        def adjust_reorder(row):
            demand_needed = max(row["Forecasted_Ingredient_Demand"] - row["Current_Quantity"], 0)
            return max(row["Recommended_Order_Quantity"], int(math.ceil(demand_needed)))

        summary["Recommended_Order_Quantity"] = summary.apply(adjust_reorder, axis=1)

    summary = summary.sort_values("Item")

    # Save next_week_orders.csv next to the weekly files
    out_path = os.path.join(DATA_DIR, "next_week_orders.csv")
    summary.to_csv(out_path, index=False)

    # Return JSON for the UI
    return jsonify(summary.to_dict(orient="records"))


@app.route("/api/visualizations/<filename>")
def get_visualization(filename):
    return send_from_directory(os.path.join(DATA_DIR, "visualizations"), filename)


@app.route("/api/predictions", methods=["GET"])
def get_predictions():
    predictions_path = os.path.join(DATA_DIR, "next_week_orders.csv")
    if not os.path.exists(predictions_path):
        return jsonify({"error": "Predictions not available"}), 404

    df = pd.read_csv(predictions_path)
    return jsonify(df.to_dict(orient="records"))


if __name__ == "__main__":
    # Install deps first: pip install flask flask-cors pandas
    app.run(host="127.0.0.1", port=5000, debug=True)
