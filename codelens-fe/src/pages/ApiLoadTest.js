import React, { useEffect, useState } from "react";
import ReportSelector from "../components/reports/ReportSelector";
import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../components/common/SnackbarNotification";

import ApiLoadTestDashboard from "../components/apiLoadTest/ApiLoadTestDashboard";
import RunApiTestModal from "../components/apiLoadTest/RunApiTestModal";

import { useApiLoadTestList } from "../hooks/useApiLoadTestList";
import { useApiLoadTest } from "../hooks/useApiLoadTest";

const ApiLoadTest = () => {
  const [snackbar, setSnackbar] = useState(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [openRunModal, setOpenRunModal] = useState(false);

  const showError = (msg) =>
    setSnackbar({
      id: Date.now(),
      type: "error",
      msg,
    });

  const showSuccess = (msg) =>
    setSnackbar({
      id: Date.now(),
      type: "success",
      msg,
    });

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

      {snackbar && (
        <SnackbarNotification
          key={snackbar.id}
          initialOpen={true}
          message={snackbar.msg}
          theme={
            snackbar.type === "error"
              ? SNACKBAR_THEME.RED
              : SNACKBAR_THEME.GREEN
          }
          yPosition="top"
          xPosition="center"
          onCloseHandler={() => setSnackbar(null)}
        />
      )}
    </div>
  );
};

export default ApiLoadTest;
