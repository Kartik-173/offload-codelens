import React from 'react';

export const securityScanColumnList = [
  {
    field: 'Status',
    headerName: 'Status',
    width: 120,
    align: 'center',
  },
  {
    field: 'Severity',
    headerName: 'Severity',
    width: 120,
    align: 'center',
  },
  {
    field: 'ServiceName',
    headerName: 'Service Name',
    width: 150,
    align: 'center',
  },
  {
    field: 'Region',
    headerName: 'Region',
    width: 150,
    align: 'center',
  },
  {
    field: 'CheckID',
    headerName: 'Check ID',
    width: 220,
    align: 'center',
  },
  {
    field: 'CheckTitle',
    headerName: 'Check Title',
    width: 250,
    align: 'center',
  },
  {
    field: 'ResourceId',
    headerName: 'Resource ID',
    width: 400,
    align: 'center',
  },
  {
    field: 'ResourceTags',
    headerName: 'Resource Tags',
    width: 400,
    align: 'center',
    renderCell: (params) => {
      const tags = params.value;

      if (!tags || Object.keys(tags).length === 0) return 'N/A';

      return (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {Object.entries(tags).map(([key, val]) => (
            <div key={key}>
              <strong>{key}</strong>: {val}
            </div>
          ))}
        </div>
      );
    },
  },
  {
    field: 'StatusExtended',
    headerName: 'Status Extended',
    width: 350,
    align: 'center',
  },
  {
    field: 'Risk',
    headerName: 'Risk',
    width: 300,
    align: 'center',
  },
  {
    field: 'Recommendation',
    headerName: 'Recommendation',
    width: 300,
    align: 'center',
  },
  {
    field: 'Compliance',
    headerName: 'Compliance',
    width: 250,
    align: 'center',
  },
];
