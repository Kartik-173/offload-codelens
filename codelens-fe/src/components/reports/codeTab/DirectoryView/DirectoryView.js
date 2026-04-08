import React from "react";
import {
  Search as SearchIcon,
  TriangleAlert as WarningIcon,
  Folder as FolderIcon,
  File as FileIcon,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "../../../ui/card";
import { Badge } from "../../../ui/badge";

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

  const metricColumns = [
    { key: "lines", label: "Lines" },
    { key: "security", label: "Security" },
    { key: "reliability", label: "Reliability" },
    { key: "maintainability", label: "Maintainability" },
    { key: "securityHotspots", label: "Hotspots" },
    { key: "coverage", label: "Coverage" },
    { key: "duplications", label: "Duplication" },
  ];

  return (
    <Box className="space-y-4">
      <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <WarningIcon className="h-4 w-4" />
        The last analysis includes warnings. Review flagged files before release.
      </div>

      <Card className="border-slate-200">
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 text-left font-semibold">Name</th>
                  {metricColumns.map((column) => (
                    <th key={column.key} className="px-3 py-3 text-right font-semibold">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredNodes.map((node) => (
                  <tr
                    key={node.path}
                    className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-cyan-50/50"
                    onClick={() =>
                      node.type === "DIR" ? onFolderClick(node.name) : onFileClick(node)
                    }
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        {node.type === "DIR" ? (
                          <FolderIcon className="h-4 w-4 text-amber-600" />
                        ) : (
                          <FileIcon className="h-4 w-4 text-blue-600" />
                        )}
                        <Typography component="span" className="font-medium text-slate-800">
                          {node.name}
                        </Typography>
                        {node.type === "DIR" && (
                          <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </td>

                    {metricColumns.map((column) => (
                      <td key={column.key} className="px-3 py-3 text-right text-slate-700">
                        <Badge variant="outline" className="border-slate-200 bg-white font-normal text-slate-700">
                          {node.metrics?.[column.key] ?? "-"}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredNodes.length === 0 && (
              <div className="border-t border-slate-100 px-4 py-12 text-center">
                <p className="text-sm font-medium text-slate-700">No matches in this folder.</p>
                <p className="mt-1 text-xs text-slate-500">Try a shorter keyword or navigate to a different directory.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DirectoryView;
