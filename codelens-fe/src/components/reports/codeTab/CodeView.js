import React, { useState, useMemo } from "react";
import { Folder, FileText } from "lucide-react";
import DirectoryView from "./DirectoryView/DirectoryView";
import FileView from "./fileView/FileView";
import RepoApiService from "../../../services/RepoApiService.js";

const Box = ({ children, className = "", ...rest }) => (
  <div className={className} {...rest}>{children}</div>
);

const Typography = ({ children, className = "", ...rest }) => (
  <p className={className} {...rest}>{children}</p>
);

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

  if (loading) {
    return (
      <Box className="code-tab-wrapper">
        <Box className="code-tab-container">
          <Box className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          </Box>
        </Box>
      </Box>
    );
  }

  if (!reportDetails) {
    return (
      <Box className="code-tab-wrapper">
        <Box className="code-tab-container">
          <Box className="flex h-full items-center justify-center">
            <Typography className="text-base text-slate-500">
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
        <div className="flex flex-wrap items-center gap-1" aria-label="breadcrumb">
          {breadcrumbPath.map((crumb, idx) => {
            const isFile = crumb.includes(".");
            return (
              <button
                key={idx}
                type="button"
                className="breadcrumb-item"
                onClick={() => handleBreadcrumbClick(idx)}
              >
                {isFile ? (
                  <FileText className="breadcrumb-icon file" />
                ) : (
                  <Folder className="breadcrumb-icon folder" />
                )}
                {crumb}
              </button>
            );
          })}
        </div>
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
