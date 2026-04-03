import React, { useState } from "react";
import { Box, Paper, Tabs, Tab } from "@mui/material";

import AwsAccountsManager from "../components/credentials/AwsAccountsManager";
import AzureAccountsManager from "../components/credentials/AzureAccountsManager.js";

const Credentials = () => {
  const [tab, setTab] = useState(() => {
    const search = new URLSearchParams(window.location.search);
    const t = (search.get("tab") || "aws").toLowerCase();
    return t === "azure" ? "azure" : "aws";
  });

  return (
    <Box className="credentials-page">
      <Paper className="credentials-card" elevation={3}>
        <Box className="credentials-tabs">
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              const url = new URL(window.location.href);
              url.searchParams.set("tab", v);
              window.history.replaceState({}, "", url);
            }}
          >
            <Tab label="AWS" value="aws" />
            <Tab label="Azure" value="azure" />
          </Tabs>
        </Box>

        {tab === "aws" ? <AwsAccountsManager /> : <AzureAccountsManager />}
      </Paper>
    </Box>
  );
};

export default Credentials;
