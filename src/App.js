import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./App.css";

function App() {
  const [weekFiles, setWeekFiles] = useState([null, null, null, null]);
  const [salesPlanFile, setSalesPlanFile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    fetch("/api/predictions")
      .then((res) => {
        if (!res.ok) throw new Error("Predictions not available yet");
        return res.json();
      })
      .then((data) => setPredictions(Array.isArray(data) ? data : []))
      .catch((err) => console.info("Predictions not ready:", err.message));
  }, []);

  const handleFileChange = (index, file) => {
    setWeekFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOrders([]);
    setLoading(true);

    // Ensure all 4 weeks are present
    if (weekFiles.some((f) => !f)) {
      setError("Please upload all 4 weekly CSV files.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      weekFiles.forEach((file, idx) => {
        formData.append(`week${idx + 1}`, file);
      });
      if (salesPlanFile) {
        formData.append("sales_plan", salesPlanFile);
      }

      const res = await fetch("/api/run-forecast", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Server error (${res.status}): ${text || "Unable to run forecast"}`
        );
      }

      const data = await res.json();
      setOrders(data);
      // Also drive the chart with the latest response
      setPredictions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while running forecast.");
    } finally {
      setLoading(false);
    }
  };

  const renderTable = () => {
    if (!orders || orders.length === 0) return null;

    // Use keys from the first row as columns
    const columns = Object.keys(orders[0]);

    return (
      <div className="table-wrapper">
        <h2>Next Week Order Recommendations</h2>
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col.replace(/_/g, " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col}>
                    {typeof row[col] === "number"
                      ? row[col].toFixed(
                          col === "Avg_Weekly_Usage" ? 2 : 0
                        )
                      : row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">
          A copy of this data is also saved as{" "}
          <code>backend/data/next_week_orders.csv</code>.
        </p>
      </div>
    );
  };

  const renderChart = () => {
    if (!Array.isArray(predictions) || predictions.length === 0) return null;

    const hasForecastedDemand = predictions.some(
      (row) =>
        row &&
        typeof row.Forecasted_Ingredient_Demand === "number" &&
        !Number.isNaN(row.Forecasted_Ingredient_Demand)
    );

    return (
      <div className="chart-wrapper">
        <h2>Predicted Inventory Needs</h2>
        <LineChart width={800} height={400} data={predictions}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="Item" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Predicted_Quantity" stroke="#8884d8" />
          {hasForecastedDemand && (
            <Line
              type="monotone"
              dataKey="Forecasted_Ingredient_Demand"
              stroke="#ef4444"
            />
          )}
        </LineChart>
      </div>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Restaurant Inventory Forecast</h1>
        <p>
          Upload 4 weeks of inventory CSVs to generate next week's order
          recommendations.
        </p>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="upload-form">
          {[1, 2, 3, 4].map((weekIdx) => (
            <div className="file-input-group" key={weekIdx}>
              <label htmlFor={`week${weekIdx}`}>
                Week {weekIdx} Inventory CSV
              </label>
              <input
                id={`week${weekIdx}`}
                type="file"
                accept=".csv"
                onChange={(e) =>
                  handleFileChange(weekIdx - 1, e.target.files[0] || null)
                }
              />
              {weekFiles[weekIdx - 1] && (
                <span className="file-name">
                  Selected: {weekFiles[weekIdx - 1].name}
                </span>
              )}
            </div>
          ))}

          <button type="submit" disabled={loading}>
            {loading ? "Running forecast..." : "Run Forecast"}
          </button>
          <div className="file-input-group">
            <label htmlFor="salesPlan">Sales Plan CSV (optional)</label>
            <input
              id="salesPlan"
              type="file"
              accept=".csv"
              onChange={(e) => setSalesPlanFile(e.target.files[0] || null)}
            />
            {salesPlanFile && (
              <span className="file-name">Selected: {salesPlanFile.name}</span>
            )}
            <p className="hint">
              Format: Dish,Qty[,Multiplier]. Uses recipes.csv to compute ingredient demand.
            </p>
          </div>
        </form>

        {error && <div className="error-message">{error}</div>}

        {renderTable()}

        {renderChart()}
      </main>
    </div>
  );
}

export default App;
