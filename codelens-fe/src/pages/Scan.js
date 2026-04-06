import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card } from "../components/ui/card";
import AwsScan from './AwsScan';
import AzureScan from './AzureScan';

const Scan = () => {
  const [tab, setTab] = useState(() => {
    const search = new URLSearchParams(window.location.search);
    const t = (search.get('tab') || 'aws').toLowerCase();
    return t === 'azure' ? 'azure' : 'aws';
  });

  return (
    <div className="scan-page p-6">
      <Card className="scan-card shadow-lg p-6">
        <div className="scan-tabs mb-6">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v);
              const url = new URL(window.location.href);
              url.searchParams.set('tab', v);
              window.history.replaceState({}, '', url);
            }}
            aria-label="cloud provider tabs"
          >
            <TabsList>
              <TabsTrigger value="aws">☁️ AWS</TabsTrigger>
              <TabsTrigger value="azure">🔷 Azure</TabsTrigger>
            </TabsList>

            <TabsContent value="aws">
              <AwsScan />
            </TabsContent>

            <TabsContent value="azure">
              <AzureScan />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default Scan;
