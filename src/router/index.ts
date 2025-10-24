import { createRouter, createWebHashHistory, Router } from "vue-router";
import { openUserLogin } from "@/utils/modal";
import { isElectron } from "@/utils/helper";
import { isLogin } from "@/utils/auth";
import { ensureDataLoaded } from "@/utils/init";
import routes from "./routes";

// 基础配置
const router: Router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  // 保留滚动
  // scrollBehavior(to, _, savedPosition) {
  //   if (savedPosition) {
  //     return new Promise((resolve) => {
  //       setTimeout(() => {
  //         resolve(savedPosition);
  //       }, 300);
  //     });
  //   } else if (to.hash) {
  //     return {
  //       el: to.hash,
  //       behavior: "smooth",
  //     };
  //   } else {
  //     return { top: 0, left: 0, behavior: "smooth" };
  //   }
  // },
});

// 前置守卫
router.beforeEach(async (to, from, next) => {
  // console.log("前置守卫", to, from);
  // 进度条
  if (!isElectron && to.path !== from.path) {
    window.$loadingBar.start();
  }
  
  // 需要登录的路由：先确保数据已加载
  if (to.meta.needLogin) {
    await ensureDataLoaded();
    
    // 再检查登录状态
    if (!isLogin()) {
      if (!isElectron) window.$loadingBar.error();
      window.$message.warning("请登录后使用");
      openUserLogin();
      return;
    }
  }
  
  // 需要客户端
  if (to.meta.needApp && !isElectron) {
    window.$message.warning("该功能为客户端独占功能");
    next("/403");
    return;
  }
  
  next();
});

// 后置守卫
router.afterEach(() => {
  // 进度条
  window.$loadingBar.finish();
});

export default router;
