
import sys
import math
import pandas as pd


def load_snapshots(paths):
    """Load weekly inventory CSVs and tag each as a snapshot."""
    snapshots = []
    for idx, path in enumerate(paths):
        df = pd.read_csv(path)
        df = df.copy()
        df["snapshot"] = idx  # 0 = oldest, increasing with time
        snapshots.append(df)
    if not snapshots:
        raise ValueError("No CSV files provided.")
    return pd.concat(snapshots, ignore_index=True)


def compute_usage(concat_df):
    """Compute average weekly usage per item based on inventory changes."""
    # Pivot so each column is a snapshot's quantity for that item
    pivot_qty = concat_df.pivot_table(
        index="Item",
        columns="snapshot",
        values="Quantity",
        aggfunc="first"
    ).sort_index(axis=1)

    # If an item is missing in a later file, assume its quantity stayed the same as last seen.
    # If missing in the first snapshot, assume it started at 0.
    pivot_qty = pivot_qty.ffill(axis=1).fillna(0)

    # Differences between weeks: negative = used, positive = restocked
    diffs = pivot_qty.diff(axis=1)

    # Usage is only the drops in inventory (negative diffs)
    usage_per_period = -diffs.clip(upper=0)
    total_usage = usage_per_period.sum(axis=1)

    num_periods = pivot_qty.shape[1] - 1
    if num_periods <= 0:
        avg_weekly_usage = total_usage
    else:
        avg_weekly_usage = total_usage / num_periods

    current_qty = pivot_qty.iloc[:, -1]

    result = pd.DataFrame({
        "Item": pivot_qty.index,
        "Current_Quantity": current_qty,
        "Avg_Weekly_Usage": avg_weekly_usage
    }).set_index("Item")

    return result


def attach_metadata(result_df, latest_snapshot_df):
    """Add non-numeric metadata (Category, Unit) from the latest snapshot."""
    meta_cols = [c for c in ["Category", "Unit"] if c in latest_snapshot_df.columns]
    meta = latest_snapshot_df.set_index("Item")[meta_cols]
    combined = result_df.join(meta, how="left")
    combined = combined.reset_index()
    cols = ["Item"] + meta_cols + ["Current_Quantity", "Avg_Weekly_Usage"]
    return combined[cols]


def compute_reorder(df):
    """Determine how much to order for next week.

    Simple rule:
    - Estimate next week's usage as Avg_Weekly_Usage.
    - If current stock is less than that, order enough to cover one week's usage.
    """
    df = df.copy()
    df["Avg_Weekly_Usage"] = df["Avg_Weekly_Usage"].fillna(0)

    def calc(row):
        needed = 2 * row["Avg_Weekly_Usage"] - row["Current_Quantity"]
        if needed <= 0:
            return 0
        return int(math.ceil(needed))

    df["Recommended_Order_Quantity"] = df.apply(calc, axis=1)
    return df


def main(args):
    if len(args) < 5:
        print("Usage: python forecast_orders.py week1.csv week2.csv week3.csv week4.csv")
        sys.exit(1)

    csv_paths = args[1:]
    concat_df = load_snapshots(csv_paths)

    usage_df = compute_usage(concat_df)

    # Use the latest snapshot (highest snapshot index) for metadata like Category & Unit
    latest_idx = concat_df["snapshot"].max()
    latest_snapshot = concat_df.loc[concat_df["snapshot"] == latest_idx]

    summary = attach_metadata(usage_df, latest_snapshot)
    summary = compute_reorder(summary)
    summary = summary.sort_values("Item")

    out_file = "next_week_orders.csv"
    summary.to_csv(out_file, index=False)

    print(f"Saved order recommendations to {out_file}")
    print()
    print(summary.to_string(index=False))


if __name__ == "__main__":
    main(sys.argv)
