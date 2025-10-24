import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { pathToFileURL } from "url";

// 自定义 API
const api = {
  // 获取后端 API 地址
  getApiBackend: () => ipcRenderer.invoke("get-api-backend"),
  // 设置后端 API 地址
  setApiBackend: (url: string) => ipcRenderer.send("set-api-backend", url),
  // 重载服务器
  reloadServer: () => ipcRenderer.invoke("reload-server"),
  // 跨平台文件路径转 URL
  pathToFileURL: (path: string) => pathToFileURL(path).href,
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI;
  // @ts-expect-error (define in dts)
  window.api = api;
}
