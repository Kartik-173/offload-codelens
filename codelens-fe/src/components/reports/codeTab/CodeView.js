import React, { useState, useMemo } from "react";
import { Folder, FileText } from "lucide-react";
import DirectoryView from "./DirectoryView/DirectoryView";
import FileView from "./fileView/FileView";
import RepoApiService from "../../../services/RepoApiService.js";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";

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
      <Box className="code-tab-wrapper p-2">
        <Card className="border-slate-200">
          <CardContent className="flex min-h-[340px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!reportDetails) {
    return (
      <Box className="code-tab-wrapper p-2">
        <Card className="border-slate-200">
          <CardContent className="flex min-h-[340px] items-center justify-center">
            <Typography className="text-base text-slate-500">
              No report details available
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box className="code-tab-wrapper space-y-4 p-2">
      <Card className="overflow-hidden border-slate-200 bg-gradient-to-r from-slate-50 via-white to-cyan-50">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Code Explorer</h3>
              <p className="text-sm text-slate-600">
                Browse directories, inspect file-level metrics, and review source lines.
              </p>
            </div>
            <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700">
              {viewMode === "directory" ? "Directory Mode" : "File Mode"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2" aria-label="breadcrumb">
          {breadcrumbPath.map((crumb, idx) => {
            const isFile = crumb.includes(".");
            return (
              <React.Fragment key={idx}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => handleBreadcrumbClick(idx)}
                >
                  {isFile ? (
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                  ) : (
                    <Folder className="h-3.5 w-3.5 text-amber-600" />
                  )}
                  <span className="max-w-[220px] truncate">{crumb}</span>
                </button>
                {idx < breadcrumbPath.length - 1 && (
                  <span className="text-slate-300">/</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
        </CardContent>
      </Card>

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
