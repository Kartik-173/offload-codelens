import React, { useState } from "react";
import RepoApiService from "../services/RepoApiService";
import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../components/common/SnackbarNotification";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { ENV } from '../config/env';

const UploadZip = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbarStatus, setSnackbarStatus] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const organization = ENV.ORGANIZATION_NAME;

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith(".zip")) {
      setSelectedFile(file);
      setSnackbarStatus("");
      setSnackbarMessage("");
    } else {
      setSelectedFile(null);
      setSnackbarStatus("error");
      setSnackbarMessage("Please select a valid ZIP file");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setSnackbarStatus("error");
      setSnackbarMessage("Please select a ZIP file to upload");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setSnackbarStatus("error");
      setSnackbarMessage("User ID not found. Please log in again.");
      return;
    }

    setIsUploading(true);
    setSnackbarStatus("");
    setSnackbarMessage("");

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

      setSnackbarStatus("success");
      setSnackbarMessage(
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
    } catch (error) {
      setSnackbarStatus("error");
      setSnackbarMessage(
        error.response?.data?.message ||
          "Failed to upload ZIP file. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box className="upload-zip">
      <Card className="upload-card">
        <CardContent>
          <Typography variant="h5" className="upload-title">
            Upload Repository ZIP
          </Typography>
          <Typography variant="body2" className="upload-subtitle">
            Upload your repository as a ZIP file for scanning and analysis.
          </Typography>

          <Divider className="upload-divider" />

          <form onSubmit={handleSubmit}>
            <Box className="form-group">
              <label className="form-label">Repository ZIP File</label>
              <Box className="file-upload">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  id="zip-file"
                  disabled={isUploading}
                />
                <label htmlFor="zip-file" className="file-upload-label">
                  {selectedFile ? (
                    <Box className="file-selected">
                      <InsertDriveFileIcon className="file-icon" />
                      <span>{selectedFile.name}</span>
                    </Box>
                  ) : (
                    <Box className="file-placeholder">
                      <CloudUploadIcon className="upload-icon" />
                      <span>Click to choose a ZIP file</span>
                    </Box>
                  )}
                </label>
              </Box>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              className="upload-button"
              disabled={isUploading || !selectedFile}
              startIcon={
                isUploading ? <CircularProgress size={20} /> : <CloudUploadIcon />
              }
            >
              {isUploading ? "Uploading..." : "Upload Repository"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {snackbarStatus && (
        <SnackbarNotification
          initialOpen={true}
          duration={5000}
          message={snackbarMessage}
          actionButtonName={"Ok"}
          theme={
            snackbarStatus === "success"
              ? SNACKBAR_THEME.GREEN
              : SNACKBAR_THEME.RED
          }
          yPosition={"top"}
          xPosition={"center"}
        />
      )}
    </Box>
  );
};

export default UploadZip;
