import React from 'react';
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const RegionFilter = ({
  albs,
  filterRegion,
  onFilterChange,
}) => {
  // Get unique regions from fetched ALBs for filter dropdown
  const availableRegions = ['all', ...new Set(albs.map(alb => alb.region))];
  
  // Filter ALBs based on selected filter region
  const filteredAlbs = filterRegion === 'all' ? albs : albs.filter(alb => alb.region === filterRegion);

  // Region count summary
  const regionCounts = albs.reduce((acc, alb) => {
    acc[alb.region] = (acc[alb.region] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Region Summary Cards */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">
          ALBs by Region ({albs.length} total)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(regionCounts).map(([region, count]) => (
            <Card 
              key={region}
              className={`cursor-pointer p-4 text-center transition-shadow hover:shadow-md ${
                filterRegion === region 
                  ? 'border-2 border-blue-500' 
                  : 'border border-slate-200'
              }`}
              onClick={() => onFilterChange(filterRegion === region ? 'all' : region)}
            >
              <p className="text-2xl font-bold text-blue-600 mb-1">{count}</p>
              <p className="text-sm text-slate-600">{region}</p>
              <p className="text-xs text-slate-500">{count === 1 ? 'ALB' : 'ALBs'}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Region Search and Filter */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h3 className="text-lg font-semibold">
          Load Balancers ({filteredAlbs.length} of {albs.length})
        </h3>
        <div className="flex gap-2 items-center flex-wrap">
          {/* Quick Region Filters */}
          {Object.entries(regionCounts).slice(0, 3).map(([region, count]) => (
            <Badge
              key={region}
              className={`cursor-pointer ${
                filterRegion === region 
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => onFilterChange(filterRegion === region ? 'all' : region)}
            >
              {region} ({count})
            </Badge>
          ))}
          {availableRegions.length > 4 && (
            <Badge
              className="cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={() => onFilterChange('all')}
            >
              More...
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegionFilter;
