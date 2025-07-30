import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function getStatusColor(status: string): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_transit: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    exception: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800'
  };
  
  return colors[status as keyof typeof colors] || colors.pending;
}

export function getStatusIcon(status: string): string {
  const icons = {
    pending: '⏳',
    in_transit: '🚚',
    delivered: '✅',
    exception: '❌',
    expired: '⏰'
  };
  
  return icons[status as keyof typeof icons] || '📦';
}