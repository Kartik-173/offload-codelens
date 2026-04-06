import React, { useEffect, useState } from "react";
import RiskTab from "./tabs/RiskTab";
import DescTab from "./tabs/DescTab";
import AssessTab from "./tabs/AssessTab";
import FixTab from "./tabs/FixTab";
import ActivityTab from "./tabs/ActivityTab";
import RepoApiService from "../../../../services/RepoApiService";

const HotspotTabs = ({
  activeTab,
  setActiveTab,
  hotspot,
  filePath,
  handleCopyPath,
  handleEditorMount,
}) => {
  const [codeValue, setCodeValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Convert HTML code to plain text
  const htmlToPlain = (sources = []) =>
    sources
      .map((s) =>
        (s.code || "")
          .replace(/<span[^>]*>/g, "")
          .replace(/<\/span>/g, "")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
      )
      .join("\n");

  // Fetch file source when hotspot or active tab changes
  useEffect(() => {
    const fetchSource = async () => {
      if (!hotspot?.component?.key || activeTab !== "risk") return;

      setLoading(true);
      setError(null);

      try {
        const projectKey = hotspot.project?.key || hotspot.projectKey; // ✅ adjust depending on your API response
        const res = await RepoApiService.fetchLines(projectKey, filePath);

        setCodeValue(htmlToPlain(res.sources || []));
      } catch (err) {
        console.error("Error fetching source:", err);
        setError("Unable to load file content");
        setCodeValue("");
      } finally {
        setLoading(false);
      }
    };

    fetchSource();
  }, [hotspot, activeTab, filePath]);

  return (
    <>
      <div className="hotspot-summary-tabs flex flex-wrap gap-2 border-b pb-2">
        {[
          { value: "risk", label: "Where is the risk?" },
          { value: "desc", label: "What's the risk?" },
          { value: "assess", label: "Assess the risk" },
          { value: "fix", label: "How can I fix it?" },
          { value: "activity", label: "Activity" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              activeTab === tab.value
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="hotspot-summary-content">
        {activeTab === "risk" && (
          <>
            {loading ? (
              <div className="hotspot-loader flex items-center justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : (
              <RiskTab
                filePath={filePath}
                codeValue={codeValue}
                hotspot={hotspot}
                handleCopyPath={handleCopyPath}
                handleEditorMount={handleEditorMount}
              />
            )}
          </>
        )}

        {activeTab === "desc" && <DescTab hotspot={hotspot} />}
        {activeTab === "assess" && <AssessTab hotspot={hotspot} />}
        {activeTab === "fix" && <FixTab hotspot={hotspot} />}
        {activeTab === "activity" && <ActivityTab hotspot={hotspot} />}
      </div>
    </>
  );
};

export default HotspotTabs;
