import React, { useState } from "react";
import ApiLoadTestService from "../../services/ApiLoadTestService";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;

const ApiLoadTestForm = ({ userId, onSuccess, onError }) => {
  const [form, setForm] = useState({
    url: "",
    method: "GET",
    rate: 10,
    duration: "10s",
    scanName: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    const { url, scanName } = form;
    if (!url || !scanName) return onError("URL & Scan Name required");

    setLoading(true);
    try {
      await ApiLoadTestService.triggerLoadTest({ ...form, userId });
      onSuccess();
    } catch (err) {
      onError(err?.message || "Failed to trigger load test");
    }
    setLoading(false);
  };

  return (
    <Box className="api-load-test-form">
      <Box className="api-load-test-fields">
        <input className="h-9 rounded-md border border-input bg-background px-3 text-sm" placeholder="API URL" value={form.url} onChange={handleChange("url")} />
        <input className="h-9 rounded-md border border-input bg-background px-3 text-sm" placeholder="Scan Name" value={form.scanName} onChange={handleChange("scanName")} />
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.method} onChange={handleChange("method")}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input className="h-9 rounded-md border border-input bg-background px-3 text-sm" placeholder="Rate (req/sec)" type="number" value={form.rate} onChange={handleChange("rate")} />
        <input className="h-9 rounded-md border border-input bg-background px-3 text-sm" placeholder="Duration (10s, 20s)" value={form.duration} onChange={handleChange("duration")} />
      </Box>

      <button type="button" className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" onClick={handleSubmit} disabled={loading}>
        {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-white" /> : "Run Vegeta Scan"}
      </button>
    </Box>
  );
};

export default ApiLoadTestForm;
