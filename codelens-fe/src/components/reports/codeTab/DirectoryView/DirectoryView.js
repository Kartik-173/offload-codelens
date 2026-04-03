import React from "react";
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from "@mui/material";
import {
  Search as SearchIcon,
  Warning as WarningIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";

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
      <Alert
        variant="outlined"
        severity="warning"
        icon={<WarningIcon />}
        className="code-tab-warning-banner"
        onClose={() => {}}
      >
        The last analysis has warnings. See details
      </Alert>

      <TextField
        fullWidth
        placeholder="Search for files..."
        variant="outlined"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="code-tab-search-bar"
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon className="search-icon" />
            </InputAdornment>
          ),
        }}
      />

      {/* Table */}
      <Paper className="code-tab-table-container">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow className="code-tab-table-header">
              <TableCell className="code-tab-name-column">Name</TableCell>
              <TableCell align="right">Lines of Code</TableCell>
              <TableCell align="right">Security</TableCell>
              <TableCell align="right">Reliability</TableCell>
              <TableCell align="right">Maintainability</TableCell>
              <TableCell align="right">Security Hotspots</TableCell>
              <TableCell align="right">Coverage</TableCell>
              <TableCell align="right">Duplications</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredNodes.map((node) => (
              <TableRow
                key={node.path}
                hover
                style={{ cursor: "pointer" }}
                onClick={() =>
                  node.type === "DIR" ? onFolderClick(node.name) : onFileClick(node)
                }
              >
                <TableCell className="tree-node-name">
                  {node.type === "DIR" ? (
                    <FolderIcon className="folder-icon" fontSize="small" />
                  ) : (
                    <FileIcon className="file-icon" fontSize="small" />
                  )}
                  <Typography component="span">{node.name}</Typography>
                </TableCell>

                <TableCell align="right">{node.metrics?.lines ?? "-"}</TableCell>
                <TableCell align="right">{node.metrics?.security ?? "-"}</TableCell>
                <TableCell align="right">{node.metrics?.reliability ?? "-"}</TableCell>
                <TableCell align="right">{node.metrics?.maintainability ?? "-"}</TableCell>
                <TableCell align="right">{node.metrics?.securityHotspots ?? "-"}</TableCell>
                <TableCell align="right">{node.metrics?.coverage ?? "-"}</TableCell>
                <TableCell align="right">{node.metrics?.duplications ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default DirectoryView;
