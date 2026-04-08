import React, { useState } from "react";
import { Loader2, FileArchive, UploadCloud } from "lucide-react";
import RepoApiService from "../services/RepoApiService";
import { useToast } from "../components/common/ToastProvider";
import { ENV } from '../config/env';

const UploadZip = () => {
  const { success, error } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const organization = ENV.ORGANIZATION_NAME;

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith(".zip")) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
      error("Please select a valid ZIP file");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      error("Please select a ZIP file to upload");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      error("User ID not found. Please log in again.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("userId", userId);
    if (organization) {
      formData.append("organization", organization);
    }

    try {
      const result = await RepoApiService.triggerZipScan(formData);

      const startedProjectKey = result?.data?.projectKey;
      if (startedProjectKey) {
        try {
          localStorage.setItem('activeScanProjectKey', startedProjectKey);
        } catch (_) {}
      }

      success(
        result.data?.message ||
          "ZIP scan started successfully. Your repository is being analyzed."
      );

      setSelectedFile(null);
      event.target.reset();

      if (startedProjectKey) {
        setTimeout(() => {
          window.location.assign(`/report-list?activeProjectKey=${encodeURIComponent(startedProjectKey)}`);
        }, 600);
      }
    } catch (err) {
      error(
        err.response?.data?.message ||
          "Failed to upload ZIP file. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-zip p-6">
      <div className="upload-card bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <h2 className="upload-title text-2xl font-bold text-slate-900 mb-2">
          Upload Repository ZIP
        </h2>
        <p className="upload-subtitle text-slate-600 mb-6">
          Upload your repository as a ZIP file for scanning and analysis.
        </p>

        <hr className="upload-divider border-slate-200 my-6" />

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-6">
            <label className="form-label block text-sm font-medium text-slate-700 mb-2">
              Repository ZIP File
            </label>
            <div className="file-upload">
              <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                id="zip-file"
                disabled={isUploading}
                className="hidden"
              />
              <label
                htmlFor="zip-file"
                className="file-upload-label block w-full cursor-pointer"
              >
                {selectedFile ? (
                  <div className="file-selected flex items-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <FileArchive className="file-icon h-8 w-8 text-blue-500" />
                    <span className="text-slate-900 font-medium">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div className="file-placeholder flex flex-col items-center gap-3 p-8 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <UploadCloud className="upload-icon h-12 w-12 text-slate-400" />
                    <span className="text-slate-600">Click to choose a ZIP file</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="upload-button w-full px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="h-5 w-5" />
                Upload Repository
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadZip;
