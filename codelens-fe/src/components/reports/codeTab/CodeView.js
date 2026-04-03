import React, { useState, useMemo } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Breadcrumbs,
  Link,
} from "@mui/material";
import { ContentCopy as CopyIcon } from "@mui/icons-material";
import DirectoryView from "./DirectoryView/DirectoryView";
import FileView from "./fileView/FileView";
import RepoApiService from "../../../services/RepoApiService.js";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";

const CodeView = ({ loading, reportDetails }) => {
  const [viewMode, setViewMode] = useState("directory");
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ Always use projectKey as root breadcrumb
  const rootName = useMemo(() => {
    return reportDetails?.data?.projectKey || "repository";
  }, [reportDetails]);

  const [breadcrumbPath, setBreadcrumbPath] = useState([rootName]);

  const handleFolderClick = (folderName) => {
    setBreadcrumbPath((prev) => [...prev, folderName]);
    setViewMode("directory");
  };

  const handleFileClick = async (file) => {
    setCurrentFile(file);
    setViewMode("file");

    // Build path dynamically including root
    const normalizedPath = [rootName, ...file.path.split("/")];
    setBreadcrumbPath(normalizedPath);

    try {
      const projectKey = reportDetails?.data?.projectKey;
      const res = await RepoApiService.fetchLines(projectKey, file.path);

      setFileContent({
        metrics: file.metrics,
        sources: res.sources || [],
      });
    } catch (err) {
      console.error("Error fetching file content", err);
      setFileContent({ metrics: file.metrics, sources: [] });
    }
  };

  const handleBreadcrumbClick = (index) => {
    const newPath = breadcrumbPath.slice(0, index + 1);
    setBreadcrumbPath(newPath);
    setViewMode("directory");
    setCurrentFile(null);
    setFileContent(null);
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(breadcrumbPath.join("/"));
  };

  if (loading) {
    return (
      <Box className="code-tab-wrapper">
        <Box className="code-tab-container">
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        </Box>
      </Box>
    );
  }

  if (!reportDetails) {
    return (
      <Box className="code-tab-wrapper">
        <Box className="code-tab-container">
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="h6" color="textSecondary">
              No report details available
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="code-tab-wrapper">
      {/* ✅ Breadcrumb */}
      <Box className="breadcrumb-container">
        <Breadcrumbs separator="›" aria-label="breadcrumb">
          {breadcrumbPath.map((crumb, idx) => {
            const isFile = crumb.includes(".");
            return (
              <Link
                key={idx}
                className="breadcrumb-item"
                onClick={() => handleBreadcrumbClick(idx)}
              >
                {isFile ? (
                  <InsertDriveFileOutlinedIcon className="breadcrumb-icon file" />
                ) : (
                  <FolderOutlinedIcon className="breadcrumb-icon folder" />
                )}
                {crumb}
              </Link>
            );
          })}
        </Breadcrumbs>
        {/* <CopyIcon
          fontSize="small"
          onClick={handleCopyPath}
          style={{ cursor: "pointer" }}
        /> */}
      </Box>

      {/* ✅ Directory or File View */}
      {viewMode === "directory" ? (
        <DirectoryView
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onFolderClick={handleFolderClick}
          onFileClick={handleFileClick}
          codeTree={reportDetails.codeTree}
          currentPath={breadcrumbPath.slice(1)}
        />
      ) : (
        <FileView
          currentFile={currentFile}
          fileContent={fileContent}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}
    </Box>
  );
};

export default CodeView;
