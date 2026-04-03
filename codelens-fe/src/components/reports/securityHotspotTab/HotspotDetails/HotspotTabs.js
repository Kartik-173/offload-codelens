import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, CircularProgress, Typography } from "@mui/material";
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
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        className="hotspot-summary-tabs"
      >
        <Tab value="risk" label="Where is the risk?" />
        <Tab value="desc" label="What's the risk?" />
        <Tab value="assess" label="Assess the risk" />
        <Tab value="fix" label="How can I fix it?" />
        <Tab value="activity" label="Activity" />
      </Tabs>

      <Box className="hotspot-summary-content">
        {activeTab === "risk" && (
          <>
            {loading ? (
              <Box className="hotspot-loader">
                <CircularProgress size={24} />
              </Box>
            ) : error ? (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
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
      </Box>
    </>
  );
};

export default HotspotTabs;
