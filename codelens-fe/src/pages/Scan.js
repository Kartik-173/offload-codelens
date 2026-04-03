import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab } from '@mui/material';
import AwsScan from './AwsScan';
import AzureScan from './AzureScan';

const Scan = () => {
  const [tab, setTab] = useState(() => {
    const search = new URLSearchParams(window.location.search);
    const t = (search.get('tab') || 'aws').toLowerCase();
    return t === 'azure' ? 'azure' : 'aws';
  });

  return (
    <Box className="scan-page">
      <Paper className="scan-card" elevation={3}>
        <Box className="scan-tabs">
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              const url = new URL(window.location.href);
              url.searchParams.set('tab', v);
              window.history.replaceState({}, '', url);
            }}
            aria-label="cloud provider tabs"
          >
            <Tab label="AWS" value="aws" />
            <Tab label="Azure" value="azure" />
          </Tabs>
        </Box>

        {tab === 'aws' ? <AwsScan /> : <AzureScan />}
      </Paper>
    </Box>
  );
};

export default Scan;
