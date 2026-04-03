import React, { useState } from "react";
import { Box, TextField, Button, CircularProgress } from "@mui/material";
import ApiLoadTestService from "../../services/ApiLoadTestService";

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
        <TextField label="API URL" fullWidth size="small" value={form.url} onChange={handleChange("url")} />
        <TextField label="Scan Name" fullWidth size="small" value={form.scanName} onChange={handleChange("scanName")} />
        <TextField label="Method" size="small" value={form.method} onChange={handleChange("method")} />
        <TextField label="Rate (req/sec)" size="small" type="number" value={form.rate} onChange={handleChange("rate")} />
        <TextField label="Duration (10s, 20s)" size="small" value={form.duration} onChange={handleChange("duration")} />
      </Box>

      <Button variant="contained" onClick={handleSubmit} disabled={loading}>
        {loading ? <CircularProgress size={20} /> : "Run Vegeta Scan"}
      </Button>
    </Box>
  );
};

export default ApiLoadTestForm;
