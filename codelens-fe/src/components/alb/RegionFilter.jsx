import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Autocomplete,
  TextField,
  Chip,
} from '@mui/material';

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
    <Box>
      {/* Region Summary Cards */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          ALBs by Region ({albs.length} total)
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(regionCounts).map(([region, count]) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={region}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: filterRegion === region ? 2 : 1,
                  borderColor: filterRegion === region ? 'primary.main' : 'grey.300',
                  '&:hover': { boxShadow: 2 }
                }}
                onClick={() => onFilterChange(filterRegion === region ? 'all' : region)}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="primary">
                    {count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {region}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {count === 1 ? 'ALB' : 'ALBs'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Region Search and Filter */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6">
          Load Balancers ({filteredAlbs.length} of {albs.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Region Search */}
          <Autocomplete
            size="small"
            options={availableRegions}
            value={filterRegion}
            onChange={(event, newValue) => {
              onFilterChange(newValue || 'all');
            }}
            renderInput={(params) => (
              <TextField {...params} label="Search Region" size="small" sx={{ minWidth: 150 }} />
            )}
            sx={{ minWidth: 150 }}
          />
          
          {/* Quick Region Filters */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {Object.entries(regionCounts).slice(0, 3).map(([region, count]) => (
              <Chip
                key={region}
                label={`${region} (${count})`}
                clickable
                color={filterRegion === region ? 'primary' : 'default'}
                onClick={() => onFilterChange(filterRegion === region ? 'all' : region)}
                size="small"
                variant={filterRegion === region ? 'filled' : 'outlined'}
              />
            ))}
            {availableRegions.length > 4 && (
              <Chip
                label="More..."
                clickable
                color={filterRegion !== 'all' ? 'secondary' : 'default'}
                onClick={() => onFilterChange('all')}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RegionFilter;
