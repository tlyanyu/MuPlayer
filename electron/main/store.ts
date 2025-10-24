import Store from "electron-store";
import { screen } from "electron";
import log from "./logger";

log.info("🌱 Store init");

export interface StoreType {
  window: {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
  lyric: {
    fontSize: number;
    mainColor: string;
    shadowColor: string;
    // 窗口位置
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  proxy: string;
  // 后端 API 地址配置
  apiBackend: string;
}

// 初始化仓库
export const initStore = () => {
  return new Store<StoreType>({
    defaults: {
      window: {
        width: 1280,
        height: 800,
      },
      lyric: {
        fontSize: 30,
        mainColor: "#fff",
        shadowColor: "rgba(0, 0, 0, 0.5)",
        x: screen.getPrimaryDisplay().workAreaSize.width / 2 - 400,
        y: screen.getPrimaryDisplay().workAreaSize.height - 90,
        width: 800,
        height: 180,
      },
      proxy: "",
      // 后端 API 默认地址
      apiBackend: "http://localhost:3000",
    },
  });
};
