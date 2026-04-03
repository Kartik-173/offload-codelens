import React, { useState } from 'react';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Cancel as CancelIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { AWS_REGIONS } from '../../utils/Helpers';

const RegionSelector = ({
  selectedRegions,
  onRegionsChange,
  onClearRegions,
  onSelectAllRegions,
  loading,
}) => {
  const [regionSearchQuery, setRegionSearchQuery] = useState('');

  // Filter regions based on search query
  const filteredRegions = AWS_REGIONS.filter(region => 
    regionSearchQuery === '' || 
    region.label.toLowerCase().includes(regionSearchQuery.toLowerCase()) ||
    region.value.toLowerCase().includes(regionSearchQuery.toLowerCase()) ||
    region.group?.toLowerCase().includes(regionSearchQuery.toLowerCase())
  );

  // Handle individual region removal from chip
  const handleRemoveRegion = (regionToRemove) => {
    const newRegions = selectedRegions.filter(region => region !== regionToRemove);
    onRegionsChange(newRegions);
  };

  // Handle select all toggle
  const handleToggleSelectAll = () => {
    if (selectedRegions.length === AWS_REGIONS.length) {
      onClearRegions();
    } else {
      onSelectAllRegions();
    }
  };

  // Get region display text
  const getRegionDisplayText = () => {
    if (selectedRegions.length === 0) return 'No Regions Selected';
    if (selectedRegions.length === 1) return selectedRegions[0];
    return `${selectedRegions.length} Regions`;
  };

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={12} md={6}>
        <FormControl size="small" sx={{ minWidth: 350 }}>
          <InputLabel>Select AWS Regions</InputLabel>
          <Select
            multiple
            value={selectedRegions}
            label="Select AWS Regions"
            onChange={(e) => {
              const value = e.target.value;
              onRegionsChange(typeof value === 'string' ? value.split(',') : value);
            }}
            onOpen={() => setRegionSearchQuery('')}
            onClose={() => setRegionSearchQuery('')}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={AWS_REGIONS.find(r => r.value === value)?.label || value}
                    size="small"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    deleteIcon={<CancelIcon onMouseDown={(e) => e.stopPropagation()} />}
                    onDelete={() => handleRemoveRegion(value)}
                  />
                ))}
                {selected.length > 0 && (
                  <Chip
                    label={`${selected.length}/${AWS_REGIONS.length}`}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      backgroundColor: '#e3f2fd', 
                      color: '#1976d2',
                      borderColor: '#1976d2',
                      fontSize: '11px',
                      height: '20px'
                    }}
                  />
                )}
              </Box>
            )}
            MenuProps={{
              disableAutoFocusItem: true,
              MenuListProps: {
                autoFocusItem: false,
              },
              PaperProps: {
                style: {
                  maxHeight: 400,
                  backgroundColor: '#ffffff',
                  border: '1px solid #ddd',
                },
              },
              sx: {
                '& .MuiMenuItem-root': {
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                  },
                },
              },
            }}
          >
            {/* Search Input */}
            <Box
              sx={{
                padding: 1,
                borderBottom: '1px solid #eee',
                backgroundColor: '#ffffff',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <TextField
                size="small"
                placeholder="Search regions..."
                value={regionSearchQuery}
                onChange={(e) => setRegionSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: '#666' }} />,
                }}
              />
            </Box>
            
            {/* Region Options */}
            {filteredRegions.map((region) => (
              <MenuItem key={region.value} value={region.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LanguageIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">
                      {region.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {region.value}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
            
            {filteredRegions.length === 0 && (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  No regions found
                </Typography>
              </MenuItem>
            )}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Select all AWS regions">
            <Button
              variant="outlined"
              size="small"
              onClick={onSelectAllRegions}
              disabled={loading || selectedRegions.length === AWS_REGIONS.length}
              sx={{ minWidth: 'auto' }}
            >
              Select All
            </Button>
          </Tooltip>
          <Tooltip title="Deselect all regions">
            <Button
              variant="outlined"
              size="small"
              onClick={onClearRegions}
              disabled={loading || selectedRegions.length === 0}
              sx={{ minWidth: 'auto' }}
            >
              Deselect All
            </Button>
          </Tooltip>
        </Box>
      </Grid>
    </Grid>
  );
};

export default RegionSelector;
