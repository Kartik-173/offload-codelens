import React from 'react';

// Simplified DataGridTable using native HTML table instead of MUI DataGrid
const DataGridTable = (props) => {
  const columns = props.columns ?? [];
  const rows = props.rows ?? [];
  const hideExport = props.hideExport ?? false;

  const generateExportFileName = () => {
    const path = window.location.pathname;
    const splitPath = path.split('/');
    return `CodeLens_AwsScan_${splitPath[splitPath.length - 1]?.toUpperCase()}`;
  };

  const exportCSV = () => {
    const headers = columns.map(col => col.headerName || col.field).join(',');
    const rowsData = rows.map(row => 
      columns.map(col => {
        const val = row[col.field];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    ).join('\n');
    
    const csv = [headers, rowsData].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generateExportFileName()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full rounded-lg border bg-white shadow-sm">
      {!hideExport && (
        <div className="flex justify-end border-b p-2">
          <button
            onClick={exportCSV}
            className="rounded border px-3 py-1 text-sm hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              {columns.map((col) => (
                <th key={col.field} className="px-4 py-2 text-left font-semibold">
                  {col.headerName || col.field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  No Data Found
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {columns.map((col) => (
                    <td key={col.field} className="px-4 py-2">
                      {col.renderCell 
                        ? col.renderCell({ value: row[col.field], row })
                        : row[col.field]
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <div className="border-t p-2 text-xs text-slate-500">
          {rows.length} rows
        </div>
      )}
    </div>
  );
};

export default DataGridTable;
