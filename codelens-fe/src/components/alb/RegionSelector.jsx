import React, { useState } from 'react';
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Search,
  X,
  Globe,
  Check,
} from 'lucide-react';
import { AWS_REGIONS } from '../../utils/Helpers';

const RegionSelector = ({
  selectedRegions,
  onRegionsChange,
  onClearRegions,
  onSelectAllRegions,
  loading,
}) => {
  const [regionSearchQuery, setRegionSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
      <div className="md:col-span-6">
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Select AWS Regions</label>
          <div className="relative">
            <button
              type="button"
              className="w-full p-2 border rounded text-left bg-white flex flex-wrap gap-1 items-center min-h-[38px]"
              onClick={() => setIsOpen(!isOpen)}
            >
              {selectedRegions.length === 0 ? (
                <span className="text-slate-400">Select regions...</span>
              ) : (
                <>
                  {selectedRegions.map((value) => (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-0.5"
                    >
                      {AWS_REGIONS.find(r => r.value === value)?.label || value}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRegion(value);
                        }}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedRegions.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {selectedRegions.length}/{AWS_REGIONS.length}
                    </Badge>
                  )}
                </>
              )}
            </button>
            
            {isOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-96 overflow-auto">
                {/* Search Input */}
                <div className="p-2 border-b sticky top-0 bg-white">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search regions..."
                      value={regionSearchQuery}
                      onChange={(e) => setRegionSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                {/* Region Options */}
                <div className="py-1">
                  {filteredRegions.map((region) => (
                    <button
                      key={region.value}
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center gap-3"
                      onClick={() => {
                        const newSelection = selectedRegions.includes(region.value)
                          ? selectedRegions.filter(r => r !== region.value)
                          : [...selectedRegions, region.value];
                        onRegionsChange(newSelection);
                      }}
                    >
                      <Globe className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium">{region.label}</p>
                        <p className="text-xs text-slate-500">{region.value}</p>
                      </div>
                      {selectedRegions.includes(region.value) && (
                        <Check className="h-4 w-4 text-blue-500 ml-auto" />
                      )}
                    </button>
                  ))}
                  
                  {filteredRegions.length === 0 && (
                    <div className="px-4 py-2 text-sm text-slate-500">
                      No regions found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="md:col-span-6">
        <div className="flex gap-2 mt-1 flex-wrap">
          <button
            type="button"
            className="px-3 py-1.5 border rounded text-sm hover:bg-slate-50 disabled:opacity-50"
            onClick={onSelectAllRegions}
            disabled={loading || selectedRegions.length === AWS_REGIONS.length}
            title="Select all AWS regions"
          >
            Select All
          </button>
          <button
            type="button"
            className="px-3 py-1.5 border rounded text-sm hover:bg-slate-50 disabled:opacity-50"
            onClick={onClearRegions}
            disabled={loading || selectedRegions.length === 0}
            title="Deselect all regions"
          >
            Deselect All
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegionSelector;
