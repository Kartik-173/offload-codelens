import React, { useState, useEffect, useCallback } from "react";
import { Box, CircularProgress } from "@mui/material";
import HotspotList from "./HotspotList";
import HotspotDetails from "./HotspotDetails/HotspotDetails.js";

const SecurityHotspotView = ({ loading, reportDetails }) => {
  const [selectedTab, setSelectedTab] = useState("TO_REVIEW");
  const [selectedHotspotKey, setSelectedHotspotKey] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Safe access
  const hotspots = reportDetails?.hotspots?.items || [];
  const hotspotDetails = reportDetails?.hotspots?.details || {};

  // 🔹 Normalizer: always return merged hotspot
  const normalizeHotspot = useCallback(
    (hotspot) => {
      if (!hotspot) return null;
      const detailed = hotspotDetails[hotspot.key];
      return detailed ? { ...hotspot, ...detailed } : hotspot;
    },
    [hotspotDetails]
  );

  // Filter by status
  const filteredHotspots = hotspots.filter(
    (h) => h.status === selectedTab
  );

  // Group by vulnerabilityProbability + category
  const grouped = filteredHotspots.reduce((acc, h) => {
    if (!acc[h.vulnerabilityProbability]) {
      acc[h.vulnerabilityProbability] = {};
    }
    if (!acc[h.vulnerabilityProbability][h.securityCategory]) {
      acc[h.vulnerabilityProbability][h.securityCategory] = [];
    }
    acc[h.vulnerabilityProbability][h.securityCategory].push(h);
    return acc;
  }, {});

  // Auto-select first hotspot on tab change
  useEffect(() => {
    if (filteredHotspots.length > 0) {
      const firstPriority = Object.keys(grouped)[0];
      const firstCategory = Object.keys(grouped[firstPriority])[0];
      const firstHotspot = grouped[firstPriority][firstCategory][0];

      setExpandedCategories({ [`${firstPriority}-${firstCategory}`]: true });
      setSelectedHotspotKey(firstHotspot.key);
      setSelectedHotspot(normalizeHotspot(firstHotspot));
    } else {
      setSelectedHotspotKey(null);
      setSelectedHotspot(null);
    }
  }, [selectedTab, reportDetails, normalizeHotspot]);

  // Handle tab change (status filter)
  const handleTabChange = (_, value) => {
    setSelectedTab(value);
    setSelectedHotspotKey(null);
    setSelectedHotspot(null);
    setExpandedCategories({});
  };

  if (loading) {
    return (
      <Box className="hotspot-container" display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="hotspot-container">
      <HotspotList
        selectedTab={selectedTab}
        handleTabChange={handleTabChange}
        grouped={grouped}
        expandedCategories={expandedCategories}
        toggleCategory={(priority, category) => {
          const key = `${priority}-${category}`;
          setExpandedCategories((prev) => ({
            ...prev,
            [key]: !prev[key],
          }));
        }}
        filteredHotspots={filteredHotspots}
        selectedHotspotKey={selectedHotspotKey}
        setSelectedHotspotKey={setSelectedHotspotKey}
        setSelectedHotspot={(h) => setSelectedHotspot(normalizeHotspot(h))}
      />

      <HotspotDetails
        selectedHotspot={selectedHotspot}
        hotspotSource={selectedHotspot?.component || {}}
      />
    </Box>
  );
};

export default SecurityHotspotView;
