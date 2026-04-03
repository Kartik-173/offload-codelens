import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Tooltip,
  IconButton,
  Divider,
} from "@mui/material";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import SettingsIcon from "@mui/icons-material/Settings";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import TimerIcon from "@mui/icons-material/Timer";
import HttpIcon from "@mui/icons-material/Http";
import LabelIcon from "@mui/icons-material/Label";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CodeIcon from "@mui/icons-material/Code";

import ApiLoadTestService from "../../services/ApiLoadTestService";
import { useRunApiTestForm } from "../../hooks/useRunApiTestForm";
import {
  METHOD_OPTIONS,
  RATE_OPTIONS,
  DURATION_OPTIONS,
  getEffectiveRate,
  getEffectiveDuration,
  buildHeaders,
} from "../../utils/Helpers";

export default function RunApiTestModal({ open, onClose, onSuccess, onError }) {
  const {
    form,
    setForm,
    errors,
    submitting,
    setSubmitting,
    change,
    validate,
    reset,
    clearError,
  } = useRunApiTestForm();

  const updateHeader = (idx, field, value) => {
    const next = [...form.headers];
    next[idx][field] = value;
    setForm({ ...form, headers: next });
  };

  const addHeader = () =>
    setForm({ ...form, headers: [...form.headers, { key: "", value: "" }] });

  const removeHeader = (idx) =>
    setForm({
      ...form,
      headers: form.headers.filter((_, i) => i !== idx),
    });

  const handleRun = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await ApiLoadTestService.triggerLoadTest({
        url: form.url,
        method: form.method,
        rate: getEffectiveRate(form),
        duration: getEffectiveDuration(form),
        scanName: form.scanName || "vegeta-scan",
        headers: buildHeaders(form),
        body: form.body,
        userId: localStorage.getItem("userId"),
      });

      reset();
      onSuccess("Load test started");
      onClose();
      setTimeout(() => window.location.reload(), 500);
    } catch {
      onError("Failed to start test");
    } finally {
      setSubmitting(false);
    }
  };

  const Info = ({ text }) => (
    <Tooltip title={text} arrow>
      <InfoOutlinedIcon className="info-icon" />
    </Tooltip>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" className="api-modal">
      <DialogTitle className="api-title">
        <div className="api-title-row">
          <div className="api-title-left">
            <div className="api-title-icon">
              <PlayArrowIcon />
            </div>
            <div className="api-title-text">
              <div className="api-title-main">Run Vegeta Scan</div>
              <div className="api-title-sub">
                Configure request, auth, and payload
              </div>
            </div>
          </div>
          <IconButton size="small" className="api-close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent className="api-content">
        <div className="api-layout">
          <div className="api-col">
            <section className="api-section">
              <div className="api-section-head">
                <h4 className="api-label">
                  <LinkIcon /> Target URL{" "}
                  <Info text="API endpoint you want to stress test" />
                </h4>
              </div>
              <TextField
                fullWidth
                required
                size="small"
                name="url"
                value={form.url}
                onChange={change}
                error={Boolean(errors.url)}
                helperText={errors.url}
                placeholder="https://api.example.com/v1/resource"
              />
            </section>

            <section className="api-section">
              <div className="api-section-head">
                <h4 className="api-label">
                  <SettingsIcon /> Test Configuration
                </h4>
              </div>

              <div className="api-grid">
                <div>
                  <label className="api-sub">
                    <HttpIcon /> Method
                  </label>
                  <TextField
                    select
                    size="small"
                    name="method"
                    value={form.method}
                    onChange={change}
                    fullWidth
                  >
                    {METHOD_OPTIONS.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>

                <div>
                  <label className="api-sub">
                    <FlashOnIcon /> Rate
                  </label>
                  <TextField
                    select
                    size="small"
                    name="rate"
                    value={form.rateMode === "custom" ? "custom" : String(form.rate)}
                    onChange={change}
                    fullWidth
                  >
                    {RATE_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                    <MenuItem value="custom">Custom…</MenuItem>
                  </TextField>

                  {form.rateMode === "custom" && (
                    <TextField
                      size="small"
                      fullWidth
                      margin="dense"
                      name="customRate"
                      label="Custom Rate (req/sec)"
                      value={form.customRate}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setForm({ ...form, customRate: v });
                        clearError("customRate");
                      }}
                      error={Boolean(errors.customRate)}
                      helperText={errors.customRate}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                      placeholder="66"
                    />
                  )}
                </div>

                <div>
                  <label className="api-sub">
                    <TimerIcon /> Duration
                  </label>
                  <TextField
                    select
                    size="small"
                    name="duration"
                    value={
                      form.durationMode === "custom" ? "custom" : form.duration
                    }
                    onChange={change}
                    fullWidth
                  >
                    {DURATION_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                    <MenuItem value="custom">Custom…</MenuItem>
                  </TextField>

                  {form.durationMode === "custom" && (
                    <TextField
                      size="small"
                      fullWidth
                      margin="dense"
                      name="customDurationSeconds"
                      label="Custom Duration (seconds)"
                      value={form.customDurationSeconds}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setForm({ ...form, customDurationSeconds: v });
                        clearError("customDurationSeconds");
                      }}
                      error={Boolean(errors.customDurationSeconds)}
                      helperText={errors.customDurationSeconds}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                      placeholder="45"
                    />
                  )}
                </div>
              </div>
            </section>

            <section className="api-section">
              <div className="api-section-head">
                <h4 className="api-label">
                  <SettingsIcon /> Authentication
                </h4>
              </div>

              <TextField
                select
                size="small"
                fullWidth
                name="authType"
                value={form.authType}
                onChange={change}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="bearer">Bearer Token</MenuItem>
                <MenuItem value="basic">Basic Auth</MenuItem>
              </TextField>

              {form.authType === "bearer" && (
                <TextField
                  size="small"
                  fullWidth
                  margin="dense"
                  name="token"
                  label="Token"
                  value={form.token}
                  onChange={change}
                  error={Boolean(errors.token)}
                  helperText={errors.token}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
              )}

              {form.authType === "basic" && (
                <div className="api-auth-grid">
                  <TextField
                    size="small"
                    fullWidth
                    margin="dense"
                    label="Username"
                    name="username"
                    value={form.username}
                    onChange={change}
                    error={Boolean(errors.username)}
                    helperText={errors.username}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    margin="dense"
                    label="Password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={change}
                    error={Boolean(errors.password)}
                    helperText={errors.password}
                  />
                </div>
              )}
            </section>
          </div>

          <div className="api-col">
            <section className="api-section">
              <div className="api-section-head api-section-head-row">
                <h4 className="api-label">
                  <SettingsIcon /> Request Headers
                </h4>
                <Button size="small" startIcon={<AddIcon />} onClick={addHeader}>
                  Add
                </Button>
              </div>

              {form.headers.map((h, idx) => (
                <div key={idx} className="api-row">
                  <TextField
                    size="small"
                    label="Key"
                    value={h.key}
                    onChange={(e) =>
                      updateHeader(idx, "key", e.target.value)
                    }
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Value"
                    value={h.value}
                    onChange={(e) =>
                      updateHeader(idx, "value", e.target.value)
                    }
                    fullWidth
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeHeader(idx)}
                    disabled={form.headers.length <= 1}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
              ))}

              <Divider className="api-divider" />
              <div className="api-hint">
                Tip: Add <code>Authorization</code> only if you chose{" "}
                <b>None</b> above.
              </div>
            </section>

            <section className="api-section">
              <div className="api-section-head">
                <h4 className="api-label">
                  <CodeIcon /> Request Body
                </h4>
              </div>
              <TextField
                fullWidth
                multiline
                minRows={6}
                size="small"
                name="body"
                value={form.body}
                onChange={change}
                error={Boolean(errors.body)}
                helperText={errors.body}
                placeholder='{"example":"value"}'
              />
            </section>

            <section className="api-section">
              <div className="api-section-head">
                <h4 className="api-label">
                  <LabelIcon /> Scan Name
                </h4>
              </div>
              <TextField
                size="small"
                fullWidth
                name="scanName"
                value={form.scanName}
                onChange={change}
                placeholder="vegeta-scan"
              />
            </section>
          </div>
        </div>
      </DialogContent>

      <DialogActions className="api-actions">
        <Button size="small" className="api-cancel" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button size="small" className="api-submit" onClick={handleRun} disabled={submitting}>
          {submitting ? "Running…" : "Run Test"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
