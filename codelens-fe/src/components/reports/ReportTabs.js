import React from "react";
import { Tabs, Tab } from "@mui/material";

/**
 * @param {number} value - selected tab index
 * @param {function} onChange - setter
 * @param {Array<{ label: string }>} tabs - dynamic tab config
 */
const ReportTabs = ({ value, onChange, tabs }) => {
  return (
    <div className="report-tabs-wrapper">
      <Tabs
        value={value}
        onChange={(e, newValue) => onChange(newValue)}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
      >
        {tabs.map((tab, index) => (
          <Tab key={index} label={tab.label} />
        ))}
      </Tabs>
    </div>
  );
};

export default ReportTabs;
