import React from 'react';
import Paper from '@mui/material/Paper';
import {
  DataGrid,
  GridFooterContainer,
  GridPagination,
  GridToolbar,
} from '@mui/x-data-grid';
import { Box, styled, Typography } from '@mui/material';

// Simplified DataGridTable adapted from finops_frontend for terraform-f
const DataGridTable = (props) => {
  const columns = props.columns ?? [];
  const rows = props.rows ?? [];
  const headerBgColor = props.headerBgColor ?? '#203B5A';
  const evenRowBgColor = props.evenRowBgColor ?? '#E6EAED';
  const oddRowColor = props.oddRowColor ?? '#000';
  const evenRowColor = props.evenRowColor ?? '#000';
  const iconColor = props.actionIconColor ?? '#2793F2';
  const hideExport = props.hideExport ?? false;

  const StyledDataGrid = styled(DataGrid)(() => ({
    '&.MuiDataGrid-root': {
      backgroundColor: props.bgColor ?? '#F6FBFF',
    },
    '& .MuiDataGrid-row:nth-of-type(odd)': {
      color: oddRowColor,
    },
    '& .MuiDataGrid-row:nth-of-type(even)': {
      backgroundColor: evenRowBgColor,
      color: evenRowColor,
    },
    '& .MuiButton-text': {
      color: '#000',
    },
    '& .MuiButton-text .MuiSvgIcon-root': {
      color: iconColor,
    },
    '& .MuiDataGrid-toolbarContainer': {
      alignSelf: 'end',
    },
    '& .MuiDataGrid-columnHeader': {
      backgroundColor: headerBgColor,
      color: '#fff',
      fontWeight: 600,
    },
  }));

  const generateExportFileName = () => {
    const path = window.location.pathname;
    const splitPath = path.split('/');
    return `CodeLens_AwsScan_${splitPath[splitPath.length - 1]?.toUpperCase()}`;
  };

  const CustomFooterComponent = (footerProps) => (
    <GridFooterContainer>
      <div>{footerProps.customFooterEl}</div>
      <GridPagination />
    </GridFooterContainer>
  );

  const NoRowsOverlay = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
      }}
    >
      <Typography variant="h6" color="textSecondary">
        No Data Found
      </Typography>
    </Box>
  );

  return (
    <Paper sx={{ width: '100%' }}>
      <div style={{ minWidth: 'auto' }}>
        <StyledDataGrid
          slots={{
            toolbar: GridToolbar,
            noRowsOverlay: props.subscribeOverlayComponent ?? NoRowsOverlay,
            footer: CustomFooterComponent,
          }}
          className="optimization-data-grid"
          columns={columns}
          rows={rows}
          slotProps={{
            toolbar: {
              csvOptions: {
                fileName: generateExportFileName(),
                disableToolbarButton: hideExport,
              },
              printOptions: { disableToolbarButton: hideExport },
            },
            footer: { customFooterEl: props.customFooterEl },
          }}
          initialState={{
            columns: {
              columnVisibilityModel: props.columnVisibilityModel,
            },
          }}
        />
      </div>
    </Paper>
  );
};

export default DataGridTable;
