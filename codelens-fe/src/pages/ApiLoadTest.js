import React, { useEffect, useState } from "react";
import ReportSelector from "../components/reports/ReportSelector";
import { useToast } from "../components/common/ToastProvider";
import { Gauge, Play } from "lucide-react";

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

  const hasReports = selectorItems.length > 0;

  return (
    <div className="space-y-4 px-4 pb-6 pt-1 md:px-6">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 bg-sky-100 text-sky-700">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Vegeta Scan Dashboard</h2>
              <p className="mt-1 text-sm text-slate-600">
                Trigger API load tests and inspect summary/performance metrics from saved runs.
              </p>
            </div>
          </div>
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
            Reports: <strong className="ml-1 text-slate-800">{selectorItems.length}</strong>
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-xl">
            <ReportSelector
              reports={selectorItems}
              selected={selectedKey}
              onChange={setSelectedKey}
              loading={loading}
            />
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            onClick={() => setOpenRunModal(true)}
            disabled={loading}
          >
            <Play className="h-4 w-4" />
            Run Vegeta Scan
          </button>
        </div>

        <ApiLoadTestDashboard report={report} loading={loadingReport} />
      </div>

      {!loading && !hasReports && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
          No previous scan reports found. Start by running a new Vegeta Scan.
        </div>
      )}

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
