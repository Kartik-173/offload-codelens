import React from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const SeverityChip = ({ severity }) => (
  <Chip
    label={severity}
    size="small"
    className={`severity-chip ${severity.toLowerCase()}`}
  />
);

const columns = [
  {
    field: "rule_id",
    headerName: "Rule",
    flex: 1.8,
    renderCell: ({ value }) => (
      <Tooltip title={value}>
        <Typography className="rule-cell" noWrap>
          {value}
        </Typography>
      </Tooltip>
    )
  },
  {
    field: "severity",
    headerName: "Severity",
    width: 130,
    align: "center",
    headerAlign: "center",
    renderCell: ({ value }) => <SeverityChip severity={value} />
  },
  {
    field: "file_path",
    headerName: "File",
    flex: 1.2,
    renderCell: ({ value }) => (
      <Typography className="file-cell" noWrap>
        {value}
      </Typography>
    )
  },
  {
    field: "line_start",
    headerName: "Line",
    width: 90,
    align: "center",
    headerAlign: "center"
  },
  {
    field: "category",
    headerName: "Category",
    width: 130
  },
  {
    field: "cwe",
    headerName: "CWE",
    width: 120,
    valueGetter: (v) => v || "-",
    align: "center",
    headerAlign: "center"
  }
];

const FindingsTable = ({ rows, onRowClick }) => {
  return (
    <Box className={`findings-table ${rows.length === 0 ? "is-empty" : ""}`}>
      <DataGrid
        rows={rows}
        getRowId={(row) => row.finding_id}
        columns={columns}
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } }
        }}
        disableRowSelectionOnClick
        disableColumnMenu
        onRowClick={(params) => onRowClick(params.row)}
        rowHeight={56}
        localeText={{ noRowsLabel: "No findings detected 🎉" }}
      />
    </Box>
  );
};

export default FindingsTable;
