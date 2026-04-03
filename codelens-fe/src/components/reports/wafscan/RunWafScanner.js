import React, { useState } from "react";
import WafScanApiService from "../../../services/WafScanApiService";

const RunWafScanner = ({ onScanComplete }) => {
  const [targetUrl, setTargetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const extractScanName = (url) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, "").split(".")[0];
    } catch {
      return "";
    }
  };

  const handleRunScan = async () => {
    if (!targetUrl || loading) return;

    const scanName = extractScanName(targetUrl);
    if (!scanName) return;

    try {
      setLoading(true);

      await WafScanApiService.startScan({
        targetUrl,
        scanName,
        userId: localStorage.getItem("userId"),
      });

      setTargetUrl("");

      if (onScanComplete) {
        await onScanComplete();
      }
    } catch (error) {
      console.error("Failed to start WAF scan", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="waf-run-container">
      <input
        type="text"
        placeholder="https://example.com"
        value={targetUrl}
        onChange={(e) => setTargetUrl(e.target.value)}
        disabled={loading}
      />

      <button onClick={handleRunScan} disabled={loading}>
        {loading ? "Scanning…" : "Run WAF Scan"}
      </button>
    </div>
  );
};

export default RunWafScanner;
