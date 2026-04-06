import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card } from "../components/ui/card";

import AwsAccountsManager from "../components/credentials/AwsAccountsManager";
import AzureAccountsManager from "../components/credentials/AzureAccountsManager.js";

const Credentials = () => {
  const [tab, setTab] = useState(() => {
    const search = new URLSearchParams(window.location.search);
    const t = (search.get("tab") || "aws").toLowerCase();
    return t === "azure" ? "azure" : "aws";
  });

  return (
    <div className="credentials-page p-6">
      <Card className="credentials-card p-6 shadow-lg">
        <div className="credentials-tabs mb-6">
          <Tabs
            value={tab}
            onValueChange={setTab}
            className="credentials-tabs-wrapper"
          >
            <TabsList>
              <TabsTrigger value="aws">☁️ AWS</TabsTrigger>
              <TabsTrigger value="azure">🔷 Azure</TabsTrigger>
            </TabsList>

            <TabsContent value="aws">
              <AwsAccountsManager />
            </TabsContent>

            <TabsContent value="azure">
              <AzureAccountsManager />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default Credentials;
