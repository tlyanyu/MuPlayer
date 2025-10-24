// 日志输出
import { join } from "path";
import { app } from "electron";
import { isDev } from "./utils";
import log from "electron-log";

const sanitizeLogArgs = (args: unknown[]): unknown[] => {
  if (process.platform !== "win32") return args;
  return args.map((item) => {
    if (typeof item !== "string") return item;
    return item.replace(/\p{Extended_Pictographic}/gu, "");
  });
};

// 绑定事件
Object.assign(console, log.functions);

// Windows 控制台默认非 UTF-8，剔除扩展表情避免乱码
if (process.platform === "win32") {
  ["log", "info", "warn", "error", "debug"].forEach((level) => {
    const original = console[level as keyof Console] as (...data: unknown[]) => void;
    console[level as keyof Console] = ((...args: unknown[]) =>
      original(...sanitizeLogArgs(args))) as any;
  });
}

// 日志配置
log.transports.file.level = "info";
log.transports.file.maxSize = 2 * 1024 * 1024; // 2M
if (log.transports.ipc) log.transports.ipc.level = false;

// 控制台输出
log.transports.console.useStyles = true;

// 文件输出
log.transports.file.format = "{y}-{m}-{d} {h}:{i}:{s}:{ms} {text}";

// 本地输出
if (!isDev) {
  log.transports.file.resolvePathFn = () =>
    join(app.getPath("documents"), "/MuPlayer/MuPlayer-log.txt");
} else {
  log.transports.file.level = false;
}

log.info("📃 logger initialized");

export default log;
