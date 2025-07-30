'use client';

import React, { useState, useEffect } from 'react';
import { Package } from '@/types';
import PackageCard from './PackageCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Search } from 'lucide-react';

interface PackageListProps {
  packages: Package[];
  onUpdate: () => void;
}

export default function PackageList({ packages, onUpdate }: PackageListProps) {
  const [filteredPackages, setFilteredPackages] = useState<Package[]>(packages);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update filtered packages when packages or filters change
  useEffect(() => {
    let filtered = packages;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(pkg =>
        pkg.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pkg => pkg.status === statusFilter);
    }

    // Carrier filter
    if (carrierFilter !== 'all') {
      filtered = filtered.filter(pkg => pkg.carrier === carrierFilter);
    }

    setFilteredPackages(filtered);
  }, [packages, searchTerm, statusFilter, carrierFilter]);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackingNumbers: packages.map(pkg => pkg.trackingNumber)
        }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to refresh packages:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    try {
      const response = await fetch(`/api/packages/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to delete package:', error);
    }
  };

  const uniqueCarriers = [...new Set(packages.map(pkg => pkg.carrier))];
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'exception', label: 'Exception' },
    { value: 'expired', label: 'Expired' }
  ];

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Carrier Filter */}
          <Select value={carrierFilter} onValueChange={setCarrierFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Carriers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {uniqueCarriers.map(carrier => (
                <SelectItem key={carrier} value={carrier}>
                  {carrier.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Refresh All Button */}
        <Button
          onClick={handleRefreshAll}
          disabled={isRefreshing || packages.length === 0}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh All'}
        </Button>
      </div>

      {/* Package Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredPackages.length} of {packages.length} packages
      </div>

      {/* Package List */}
      {filteredPackages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {packages.length === 0 ? 'No packages yet' : 'No packages match your filters'}
          </h3>
          <p className="text-gray-600">
            {packages.length === 0 
              ? 'Add your first package to start tracking'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg._id}
              package={pkg}
              onDelete={handleDeletePackage}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}