import { ElectronAPI } from "@electron-toolkit/preload";

// 定义自定义 API 类型
export interface API {
  getApiBackend: () => Promise<string>;
  setApiBackend: (url: string) => void;
  reloadServer: () => Promise<{ success: boolean; error?: string }>;
  pathToFileURL: (path: string) => string;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: API;
  }
}
