/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { TrackingResponse } from '@/types';

const API_BASE_URL = 'https://api.17track.net/track/v2.2';
const API_KEY = process.env.TRACK17_API_KEY!;

export class Track17API {
  private headers = {
    '17token': API_KEY,
    'Content-Type': 'application/json'
  };

  async registerPackage(trackingNumber: string, carrier?: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/register`,
        [{
          number: trackingNumber,
          carrier: carrier ? this.getCarrierCode(carrier) : undefined
        }],
        { headers: this.headers }
      );
      
      return response.data.code === 0;
    } catch (error) {
      console.error('Error registering package:', error);
      return false;
    }
  }

  async getTrackingInfo(trackingNumber: string): Promise<TrackingResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/gettrackinfo`,
        [{
          number: trackingNumber
        }],
        { headers: this.headers }
      );

      if (response.data.code === 0 && response.data.data.length > 0) {
        const trackData = response.data.data[0];
        
        return {
          success: true,
          data: {
            number: trackData.number,
            carrier: trackData.carrier,
            status: this.mapStatus(trackData.track.e),
            events: trackData.track.z?.map((event: any) => ({
              date: new Date(event.a),
              description: event.z,
              location: event.c,
              status: event.a
            })) || []
          }
        };
      }

      return { success: false, error: 'No tracking data found' };
    } catch (error) {
      console.error('Error getting tracking info:', error);
      return { success: false, error: 'API request failed' };
    }
  }

  private getCarrierCode(carrier: string): number {
    const carriers: { [key: string]: number } = {
      'temu': 2003,
      'shein': 2108,
      'aliexpress': 2031,
      'dhl': 7,
      'fedex': 8,
      'ups': 9,
      'usps': 36
    };
    
    return carriers[carrier.toLowerCase()] || 0;
  }

  private mapStatus(statusCode: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'pending',
      10: 'in_transit',
      30: 'in_transit',
      40: 'delivered',
      20: 'exception',
      50: 'expired'
    };
    
    return statusMap[statusCode] || 'pending';
  }
}

export const track17API = new Track17API();