import React, { useEffect, useState } from "react";
import ReportSelector from "../components/reports/ReportSelector";
import { useToast } from "../components/common/ToastProvider";

import ApiLoadTestDashboard from "../components/apiLoadTest/ApiLoadTestDashboard";
import RunApiTestModal from "../components/apiLoadTest/RunApiTestModal";

import { useApiLoadTestList } from "../hooks/useApiLoadTestList";
import { useApiLoadTest } from "../hooks/useApiLoadTest";

const ApiLoadTest = () => {
  const { success, error } = useToast();
  const [selectedKey, setSelectedKey] = useState("");
  const [openRunModal, setOpenRunModal] = useState(false);

  const showError = (msg) => error(msg);
  const showSuccess = (msg) => success(msg);

  const { reportList, loading } = useApiLoadTestList(showError);

  useEffect(() => {
    if (!selectedKey && reportList.length > 0) {
      setSelectedKey(reportList[0].key);
    }
  }, [reportList, selectedKey]);

  const { report, loading: loadingReport } = useApiLoadTest(
    selectedKey,
    showError
  );

  const selectorItems = reportList.map((i) => ({
    Key: i.key,
    label: i.testFolder,
    projectKey: i.testFolder,
    userId: i.userId,
  }));

  return (
    <div className="repo-list-container">
      <div className="repo-select-section">

        <div className="repo-selector-action-row">
          <ReportSelector
            reports={selectorItems}
            selected={selectedKey}
            onChange={setSelectedKey}
          />

          <button
            className="run-api-test-btn"
            onClick={() => setOpenRunModal(true)}
          >
            Run Vegeta Scan
          </button>
        </div>

        <ApiLoadTestDashboard report={report} loading={loadingReport} />
      </div>

      <RunApiTestModal
        open={openRunModal}
        onClose={() => setOpenRunModal(false)}
        onSuccess={showSuccess}
        onError={showError}
      />
    </div>
  );
};

export default ApiLoadTest;
