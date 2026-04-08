// App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import FormPage from "./pages/FormPage";
import ScanRepo from "./pages/ScanRepo.js";
import Home from "./pages/Home.js";
import UploadZip from "./pages/UploadZip.js";
import ReportList from "./pages/ReportList.js";
import Credentials from "./pages/Credentials.js";
import Scan from "./pages/Scan.js";
import ApiTLoadest from "./pages/ApiLoadTest.js";
import WafScan from "./pages/WafScan.js";
import SidebarLayout from "./pages/SidebarLayout.js";
import GitHubConnections from "./pages/GitHubConnections.js";
import BitBucketConnections from "./pages/BitBucketConnections.js";
import ProtectedRoute from "./components/common/ProtectedRoute"; 
import { ToastProvider } from "./components/common/ToastProvider"; 

function App() {
  return (
    <ToastProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/"
          element={
             <ProtectedRoute>
              <SidebarLayout />
            </ProtectedRoute> 
          }
        >
          <Route index element={<Navigate to="home" />} />
          <Route path="home" element={<Home />} />
          <Route path="credentials" element={<Credentials />} />
          <Route path="scan-repo" element={<ScanRepo />} />
          <Route path="upload-zip" element={<UploadZip />} />
          <Route path="report-list" element={<ReportList />} />
          <Route path="security-scan" element={<Scan />} />
          <Route path="github-connections" element={<GitHubConnections />} />
          <Route path="bitbucket-connections" element={<BitBucketConnections />} />
          <Route path="vegeta-scan" element={<ApiTLoadest />} />
          <Route path="waf-scan" element={<WafScan />} />
        </Route>

        <Route path="/form" element={<FormPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
