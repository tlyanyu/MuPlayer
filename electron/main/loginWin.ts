import { BrowserWindow, session } from "electron";
import icon from "../../public/icons/favicon.png?asset";
import { join } from "path";

const openLoginWin = async (mainWin: BrowserWindow) => {
  let loginTimer: NodeJS.Timeout;
  const loginSession = session.fromPartition("persist:login");
  // 清除 Cookie
  await loginSession.clearStorageData({
    storages: ["cookies", "localstorage"],
  });
  const loginWin = new BrowserWindow({
    parent: mainWin,
    title: "登录网易云音乐（ 若遇到无响应请关闭后重试 ）",
    width: 1280,
    height: 800,
    center: true,
    autoHideMenuBar: true,
    icon,
    // resizable: false,
    // movable: false,
    // minimizable: false,
    // maximizable: false,
    webPreferences: {
      session: loginSession,
      sandbox: false,
      webSecurity: false,
      preload: join(__dirname, "../preload/index.mjs"),
    },
  });

  // 打开网易云
  loginWin.loadURL("https://music.163.com/#/login/");

  // 阻止新窗口创建
  loginWin.webContents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });

  // 检查是否登录
  const checkLogin = async () => {
    try {
      loginWin.webContents.executeJavaScript(
        "document.title = '登录网易云音乐（ 若遇到无响应请关闭后重试 ）'",
      );
      // 是否登录？判断 MUSIC_U
      const MUSIC_U = await loginSession.cookies.get({
        name: "MUSIC_U",
      });
      if (MUSIC_U && MUSIC_U?.length > 0) {
        if (loginTimer) clearInterval(loginTimer);
        const value = `MUSIC_U=${MUSIC_U[0].value};`;
        // 发送回主进程
        mainWin?.webContents.send("send-cookies", value);
        loginWin.destroy();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 循环检查
  loginWin.webContents.once("did-finish-load", () => {
    loginWin.show();
    loginTimer = setInterval(checkLogin, 1000);
    loginWin.on("closed", () => {
      clearInterval(loginTimer);
    });
  });
};

export default openLoginWin;
