import React from "react";
import {
  Search as SearchIcon,
  TriangleAlert as WarningIcon,
  Folder as FolderIcon,
  File as FileIcon,
} from "lucide-react";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "", component = "p" }) => {
  const Tag = component;
  return <Tag className={className}>{children}</Tag>;
};

const DirectoryView = ({
  searchQuery,
  setSearchQuery,
  onFolderClick,
  onFileClick,
  codeTree,
  currentPath,
}) => {
  let currentLevel = codeTree;
  for (const part of currentPath) {
    const next = currentLevel.find((n) => n.name === part && n.children);
    currentLevel = next ? next.children : [];
  }

  const filteredNodes = currentLevel.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box className="directory-view-container">
      <div className="code-tab-warning-banner">
        <WarningIcon className="h-4 w-4" />
        The last analysis has warnings. See details
      </div>

      <div className="relative">
        <SearchIcon className="search-icon pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search for files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="code-tab-search-bar h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
        />
      </div>

      <div className="code-tab-table-container overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="code-tab-table-header">
              <th className="code-tab-name-column px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-right">Lines of Code</th>
              <th className="px-3 py-2 text-right">Security</th>
              <th className="px-3 py-2 text-right">Reliability</th>
              <th className="px-3 py-2 text-right">Maintainability</th>
              <th className="px-3 py-2 text-right">Security Hotspots</th>
              <th className="px-3 py-2 text-right">Coverage</th>
              <th className="px-3 py-2 text-right">Duplications</th>
            </tr>
          </thead>

          <tbody>
            {filteredNodes.map((node) => (
              <tr
                key={node.path}
                className="cursor-pointer border-t hover:bg-slate-50"
                onClick={() =>
                  node.type === "DIR" ? onFolderClick(node.name) : onFileClick(node)
                }
              >
                <td className="tree-node-name px-3 py-2">
                  {node.type === "DIR" ? (
                    <FolderIcon className="folder-icon h-4 w-4" />
                  ) : (
                    <FileIcon className="file-icon h-4 w-4" />
                  )}
                  <Typography component="span">{node.name}</Typography>
                </td>

                <td className="px-3 py-2 text-right">{node.metrics?.lines ?? "-"}</td>
                <td className="px-3 py-2 text-right">{node.metrics?.security ?? "-"}</td>
                <td className="px-3 py-2 text-right">{node.metrics?.reliability ?? "-"}</td>
                <td className="px-3 py-2 text-right">{node.metrics?.maintainability ?? "-"}</td>
                <td className="px-3 py-2 text-right">{node.metrics?.securityHotspots ?? "-"}</td>
                <td className="px-3 py-2 text-right">{node.metrics?.coverage ?? "-"}</td>
                <td className="px-3 py-2 text-right">{node.metrics?.duplications ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Box>
  );
};

export default DirectoryView;
