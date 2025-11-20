declare module '@beam/storage' {
    export interface DeviceState {
      deviceId: string;
      state?: string;
      is_on?: boolean;
      meter_id?: string;
      relay_id?: string;
      measurement_factor?: number;
    }
  
    export interface StorageAdapter {
      deviceState: {
        findOne(query: { id: string }): Promise<DeviceState>;
      };
      eventLog: {
        create(event: any): Promise<void> | void;
      };
    }
  
    export function getStorageAdapter(uri: string, db: string): StorageAdapter;
  }
  