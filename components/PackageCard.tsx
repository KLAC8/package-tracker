'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package as PackageType } from '@/types';
import { formatDate, getStatusColor, getStatusIcon } from '@/lib/utils';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Trash2, 
  RefreshCw, 
  Bell, 
  BellOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface PackageCardProps {
  package: PackageType;
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

export default function PackageCard({ package: pkg, onDelete, onUpdate }: PackageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackingNumbers: [pkg.trackingNumber]
        }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to refresh package:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const response = await fetch(`/api/packages/${pkg._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationEnabled: !pkg.notificationEnabled
        }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      onDelete(pkg._id!);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">{getStatusIcon(pkg.status)}</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {pkg.trackingNumber}
              </span>
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                <span className="capitalize">{pkg.carrier}</span>
              </div>
              {pkg.description && (
                <span className="text-sm text-gray-600">{pkg.description}</span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(pkg.status)}>
              {pkg.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleNotifications}
                title={pkg.notificationEnabled ? 'Disable notifications' : 'Enable notifications'}
              >
                {pkg.notificationEnabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
                title="Refresh tracking"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                title="Delete package"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Latest Event */}
          {pkg.events && pkg.events.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-1 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {pkg.events[0].description}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{formatDate(pkg.events[0].date)}</span>
                    {pkg.events[0].location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {pkg.events[0].location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toggle Events History */}
          {pkg.events && pkg.events.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full"
            >
              <span>
                {isExpanded ? 'Hide' : 'Show'} tracking history ({pkg.events.length - 1} more)
              </span>
              {isExpanded ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          )}

          {/* Events History */}
          {isExpanded && pkg.events && pkg.events.length > 1 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pkg.events.slice(1).map((event, index) => (
                <div key={index} className="p-2 border-l-2 border-gray-200 pl-4">
                  <p className="text-sm">{event.description}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{formatDate(event.date)}</span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Package Info */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            <div className="flex justify-between">
              <span>Added: {formatDate(pkg.createdAt)}</span>
              <span>Updated: {formatDate(pkg.updatedAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}