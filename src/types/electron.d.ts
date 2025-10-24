export interface ElectronAPI {
  getApiBackend: () => Promise<string>;
  setApiBackend: (url: string) => void;
  reloadServer: () => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export {};
