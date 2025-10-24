import { app, shell, BrowserWindow, BrowserWindowConstructorOptions, protocol } from "electron";
import { electronApp } from "@electron-toolkit/utils";
import { join } from "path";
import { release, type } from "os";
import { localURLToFilePath } from "./local-url";
import { isDev, isMac, appName } from "./utils";
import { unregisterShortcuts } from "./shortcut";
import { initTray, MainTray } from "./tray";
import { initThumbar, Thumbar } from "./thumbar";
import { type StoreType, initStore } from "./store";
import Store from "electron-store";
import initAppServer from "../server";
import initIpcMain from "./ipcMain";
import log from "./logger";
import fs from "fs";
// icon
import icon from "../../public/icons/favicon.png?asset";

// 屏蔽报错
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

// 模拟打包
Object.defineProperty(app, "isPackaged", {
  get() {
    return true;
  },
});

// 注册自定义协议：local://
// 必须在 app.ready 之前注册
protocol.registerSchemesAsPrivileged([
  {
    scheme: "local",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: false,
      stream: true,
    },
  },
]);

// 主进程
class MainProcess {
  // 窗口
  mainWindow: BrowserWindow | null = null;
  lyricWindow: BrowserWindow | null = null;
  loadingWindow: BrowserWindow | null = null;
  // store
  store: Store<StoreType> | null = null;
  // 应用服务器
  appServer: any = null;
  // 托盘
  mainTray: MainTray | null = null;
  // 工具栏
  thumbar: Thumbar | null = null;
  // 是否退出
  isQuit: boolean = false;
  constructor() {
    log.info("🚀 Main process startup");
    // 禁用 Windows 7 的 GPU 加速功能
    if (release().startsWith("6.1") && type() == "Windows_NT") app.disableHardwareAcceleration();
    // 单例锁
    if (!app.requestSingleInstanceLock()) {
      log.error("❌ There is already a program running and this process is terminated");
      app.quit();
      process.exit(0);
    } else this.showWindow();
    // 准备就绪
    app.on("ready", async () => {
      log.info("🚀 Application Process Startup");
      // 设置应用程序名称
      electronApp.setAppUserModelId("com.tlyanyu.muplayer");
      // 注册 local:// 协议处理器，支持 Range 请求
      protocol.handle("local", async (request) => {
        try {
          // ✅ 使用 Node.js 标准 API 转换 URL
          // 将 local:// 替换回 file://
          const filePath = localURLToFilePath(request.url);

          // 检查文件是否存在
          if (!fs.existsSync(filePath)) {
            log.error(`❌ File not found: ${filePath}`);
            return new Response('File not found', { status: 404 });
          }

          // 获取文件状态
          const stat = fs.statSync(filePath);
          const fileSize = stat.size;

          // 检查是否是 Range 请求
          const rangeHeader = request.headers.get('range');

          if (rangeHeader) {
            // 解析 Range 请求头
            const parts = rangeHeader.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            // 创建文件流
            const fileStream = fs.createReadStream(filePath, { start, end });

            // 返回 206 Partial Content 响应
            return new Response(fileStream as any, {
              status: 206,
              headers: {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize.toString(),
                'Content-Type': 'audio/*',
              },
            });
          } else {
            // 普通请求，返回完整文件
            const fileStream = fs.createReadStream(filePath);

            return new Response(fileStream as any, {
              status: 200,
              headers: {
                'Accept-Ranges': 'bytes',
                'Content-Length': fileSize.toString(),
                'Content-Type': 'audio/*',
              },
            });
          }
        } catch (error) {
          log.error(`❌ Failed to load local file: ${request.url}`, error);
          return new Response('Internal Server Error', { status: 500 });
        }
      });
      // 初始化 store
      this.store = initStore();
      // 启动主服务进程
      this.appServer = await initAppServer(this.store);
      // 启动进程
      this.createLoadingWindow();
      this.createMainWindow();
      this.createLyricsWindow();
      this.handleAppEvents();
      this.handleWindowEvents();
      // 注册其他服务
      this.mainTray = initTray(this.mainWindow!, this.lyricWindow!);
      this.thumbar = initThumbar(this.mainWindow!);
      // 注册主进程事件
      initIpcMain(
        this.mainWindow,
        this.lyricWindow,
        this.loadingWindow,
        this.mainTray,
        this.thumbar,
        this.store,
      );
    });
  }
  // 创建窗口
  createWindow(options: BrowserWindowConstructorOptions = {}): BrowserWindow {
    const defaultOptions: BrowserWindowConstructorOptions = {
      title: appName,
      width: 1280,
      height: 720,
      frame: false,
      center: true,
      // 图标
      icon,
      webPreferences: {
        preload: join(__dirname, "../preload/index.mjs"),
        // 🔒 安全配置
        // 禁用沙箱（兼容性：preload 脚本需要完整访问权限暴露 IPC API）
        sandbox: false,
        // 启用同源策略，防止跨域攻击
        webSecurity: true,
        // 禁止运行不安全的 HTTP 内容
        allowRunningInsecureContent: false,
        // 禁用拼写检查
        spellcheck: false,
        // 禁用 Node.js 集成，防止渲染进程直接访问系统资源
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        // 启用上下文隔离，将预加载脚本与渲染进程隔离
        contextIsolation: true,
      },
    };
    // 合并参数
    options = Object.assign(defaultOptions, options);
    // 创建窗口
    const win = new BrowserWindow(options);
    return win;
  }
  // 创建主窗口
  createMainWindow() {
    // 窗口配置项
    const options: BrowserWindowConstructorOptions = {
      width: this.store?.get("window").width,
      height: this.store?.get("window").height,
      minHeight: 800,
      minWidth: 1280,
      // 菜单栏
      titleBarStyle: "customButtonsOnHover",
      // 立即显示窗口
      show: false,
    };
    // 初始化窗口
    this.mainWindow = this.createWindow(options);

    // 渲染路径
    if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
      this.mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
      const port = Number(import.meta.env["VITE_SERVER_PORT"] || 25884);
      this.mainWindow.loadURL(`http://127.0.0.1:${port}`);
    }

    // 配置网络代理
    if (this.store?.get("proxy")) {
      this.mainWindow.webContents.session.setProxy({ proxyRules: this.store?.get("proxy") });
    }

    // 窗口打开处理程序
    this.mainWindow.webContents.setWindowOpenHandler((details) => {
      const { url } = details;
      if (url.startsWith("https://") || url.startsWith("http://")) {
        shell.openExternal(url);
      }
      return { action: "deny" };
    });
  }
  // 创建加载窗口
  createLoadingWindow() {
    // 初始化窗口
    this.loadingWindow = this.createWindow({
      width: 800,
      height: 560,
      maxWidth: 800,
      maxHeight: 560,
      resizable: false,
    });
    // 渲染路径
    this.loadingWindow.loadFile(join(__dirname, "../main/web/loading.html"));
  }
  // 创建桌面歌词窗口
  createLyricsWindow() {
    // 初始化窗口
    this.lyricWindow = this.createWindow({
      width: this.store?.get("lyric").width || 800,
      height: this.store?.get("lyric").height || 180,
      minWidth: 440,
      minHeight: 120,
      maxWidth: 1600,
      maxHeight: 300,
      // 窗口位置
      x: this.store?.get("lyric").x,
      y: this.store?.get("lyric").y,
      transparent: true,
      backgroundColor: "rgba(0, 0, 0, 0)",
      alwaysOnTop: true,
      resizable: true,
      movable: true,
      // 不在任务栏显示
      skipTaskbar: true,
      // 窗口不能最小化
      minimizable: false,
      // 窗口不能最大化
      maximizable: false,
      // 窗口不能进入全屏状态
      fullscreenable: false,
      show: false,
    });
    // 渲染路径
    this.lyricWindow.loadFile(join(__dirname, "../main/web/lyric.html"));
  }
  // 应用程序事件
  handleAppEvents() {
    // 窗口被关闭时
    app.on("window-all-closed", () => {
      if (!isMac) app.quit();
      this.mainWindow = null;
      this.loadingWindow = null;
    });

    // 应用被激活
    app.on("activate", () => {
      const allWindows = BrowserWindow.getAllWindows();
      if (allWindows.length) {
        allWindows[0].focus();
      } else {
        this.createMainWindow();
      }
    });

    // 新增 session
    app.on("second-instance", () => {
      this.showWindow();
    });

    // 自定义协议
    app.on("open-url", (_, url) => {
      console.log("Received custom protocol URL:", url);
    });

    // 将要退出
    app.on("will-quit", () => {
      // 注销全部快捷键
      unregisterShortcuts();
    });

    // 退出前
    app.on("before-quit", () => {
      this.isQuit = true;
    });
  }
  // 窗口事件
  handleWindowEvents() {
    this.mainWindow?.on("ready-to-show", () => {
      if (!this.mainWindow) return;
      this.thumbar = initThumbar(this.mainWindow);
    });
    this.mainWindow?.on("show", () => {
      // this.mainWindow?.webContents.send("lyricsScroll");
    });
    this.mainWindow?.on("focus", () => {
      this.saveBounds();
    });
    // 移动或缩放
    this.mainWindow?.on("resized", () => {
      // 若处于全屏则不保存
      if (this.mainWindow?.isFullScreen()) return;
      this.saveBounds();
    });
    this.mainWindow?.on("moved", () => {
      this.saveBounds();
    });

    // 歌词窗口缩放
    this.lyricWindow?.on("resized", () => {
      const bounds = this.lyricWindow?.getBounds();
      if (bounds) {
        const { width, height } = bounds;
        this.store?.set("lyric", { ...this.store?.get("lyric"), width, height });
      }
    });

    // 窗口关闭
    this.mainWindow?.on("close", (event) => {
      event.preventDefault();
      if (this.isQuit) {
        app.exit();
      } else {
        this.mainWindow?.hide();
      }
    });
  }
  // 更新窗口大小
  saveBounds() {
    if (this.mainWindow?.isFullScreen()) return;
    const bounds = this.mainWindow?.getBounds();
    if (bounds) this.store?.set("window", bounds);
  }
  // 显示窗口
  showWindow() {
    if (this.mainWindow) {
      this.mainWindow.show();
      if (this.mainWindow.isMinimized()) this.mainWindow.restore();
      this.mainWindow.focus();
    }
  }
  // 重启应用服务器
  async reloadServer() {
    try {
      log.info("🔄 Reloading app server...");
      // 关闭旧的服务器
      if (this.appServer) {
        await this.appServer.close();
        log.info("✅ Old server closed");
      }
      // 启动新的服务器（重新读取 store 配置）
      this.appServer = await initAppServer(this.store!);
      log.info("✅ Server reloaded successfully");
    } catch (error) {
      log.error("❌ Failed to reload server:", error);
      throw error;
    }
  }
}

export default new MainProcess();
