import React from "react";
import {
  Play,
  X,
  Link,
  Settings,
  Zap,
  Timer,
  Globe,
  Tag,
  Info,
  Plus,
  Trash2,
  Code,
} from "lucide-react";

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

const Divider = () => <hr className="my-4 border-slate-200" />;

const InfoTooltip = ({ text }) => (
  <span title={text} className="ml-1 inline-flex cursor-help text-slate-400">
    <Info size={14} />
  </span>
);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-h-[90vh] max-w-5xl overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-sky-200 bg-sky-100 p-2 text-sky-700">
                <Play size={20} />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">Run Vegeta Scan</div>
              <div className="text-sm text-slate-500">Configure request, auth, and payload</div>
            </div>
          </div>
          <button className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-4">
              <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="mb-2">
                  <h4 className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                    <Link size={16} /> Target URL{" "}
                    <InfoTooltip text="API endpoint you want to stress test" />
                  </h4>
                </div>
                <input
                  type="text"
                  name="url"
                  value={form.url}
                  onChange={change}
                  placeholder="https://api.example.com/v1/resource"
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none ${errors.url ? "border-red-500" : "border-slate-300"}`}
                />
                {errors.url && <p className="mt-1 text-xs text-red-500">{errors.url}</p>}
              </section>

              <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="mb-2">
                  <h4 className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                    <Settings size={16} /> Test Configuration
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-xs text-slate-600">
                      <Globe size={14} /> Method
                    </label>
                    <select
                      name="method"
                      value={form.method}
                      onChange={change}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                    >
                      {METHOD_OPTIONS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-1 text-xs text-slate-600">
                      <Zap size={14} /> Rate
                    </label>
                    <select
                      name="rate"
                      value={form.rateMode === "custom" ? "custom" : String(form.rate)}
                      onChange={change}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                    >
                      {RATE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>
                    {form.rateMode === "custom" && (
                      <input
                        type="text"
                        name="customRate"
                        placeholder="Custom Rate (req/sec)"
                        value={form.customRate}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          setForm({ ...form, customRate: v });
                          clearError("customRate");
                        }}
                        className={`mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none ${errors.customRate ? "border-red-500" : "border-slate-300"}`}
                      />
                    )}
                    {errors.customRate && <p className="mt-1 text-xs text-red-500">{errors.customRate}</p>}
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-1 text-xs text-slate-600">
                      <Timer size={14} /> Duration
                    </label>
                    <select
                      name="duration"
                      value={form.durationMode === "custom" ? "custom" : form.duration}
                      onChange={change}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                    >
                      {DURATION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>
                    {form.durationMode === "custom" && (
                      <input
                        type="text"
                        name="customDurationSeconds"
                        placeholder="Custom Duration (seconds)"
                        value={form.customDurationSeconds}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          setForm({ ...form, customDurationSeconds: v });
                          clearError("customDurationSeconds");
                        }}
                        className={`mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none ${errors.customDurationSeconds ? "border-red-500" : "border-slate-300"}`}
                      />
                    )}
                    {errors.customDurationSeconds && <p className="mt-1 text-xs text-red-500">{errors.customDurationSeconds}</p>}
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="mb-2">
                  <h4 className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                    <Settings size={16} /> Authentication
                  </h4>
                </div>

                <select
                  name="authType"
                  value={form.authType}
                  onChange={change}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="none">None</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                </select>

                {form.authType === "bearer" && (
                  <input
                    type="text"
                    name="token"
                    placeholder="Token"
                    value={form.token}
                    onChange={change}
                    className={`mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none ${errors.token ? "border-red-500" : "border-slate-300"}`}
                  />
                )}
                {errors.token && <p className="mt-1 text-xs text-red-500">{errors.token}</p>}

                {form.authType === "basic" && (
                  <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={form.username}
                      onChange={change}
                      className={`rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none ${errors.username ? "border-red-500" : "border-slate-300"}`}
                    />
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={form.password}
                      onChange={change}
                      className={`rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none ${errors.password ? "border-red-500" : "border-slate-300"}`}
                    />
                  </div>
                )}
                {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </section>
            </div>

            <div className="space-y-4">
              <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                    <Settings size={16} /> Request Headers
                  </h4>
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    onClick={addHeader}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                {form.headers.map((h, idx) => (
                  <div key={idx} className="mb-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={h.key}
                      onChange={(e) => updateHeader(idx, "key", e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={h.value}
                      onChange={(e) => updateHeader(idx, "value", e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      className="rounded p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                      onClick={() => removeHeader(idx)}
                      disabled={form.headers.length <= 1}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <Divider />
                <div className="text-xs text-slate-500">
                  Tip: Add <code>Authorization</code> only if you chose <b>None</b> above.
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="mb-2">
                  <h4 className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                    <Code size={16} /> Request Body
                  </h4>
                </div>
                <textarea
                  name="body"
                  rows={6}
                  value={form.body}
                  onChange={change}
                  placeholder='{"example":"value"}'
                  className={`w-full rounded-lg border bg-white px-3 py-2 font-mono text-sm shadow-sm focus:outline-none ${errors.body ? "border-red-500" : "border-slate-300"}`}
                />
                {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body}</p>}
              </section>

              <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="mb-2">
                  <h4 className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                    <Tag size={16} /> Scan Name
                  </h4>
                </div>
                <input
                  type="text"
                  name="scanName"
                  value={form.scanName}
                  onChange={change}
                  placeholder="vegeta-scan"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                />
              </section>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              onClick={handleRun}
              disabled={submitting}
            >
              {submitting ? "Running..." : "Run Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
