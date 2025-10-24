import { apiClient } from "@/services/apiClient";

/**
 * 生成二维码 key
 */
export const qrKey = () => {
  return apiClient.get(
    "/login/qr/key",
    {
      noCookie: true,
      timestamp: Date.now(),
    },
  );
};

/**
 * 生成二维码，未使用
 * @param key - 二维码 key
 * @param qrimg - 是否返回图片
 */
export const qrCreate = (key: string, qrimg: boolean = true) => {
  return apiClient.get(
    "/login/qr/create",
    {
      key,
      qrimg,
      noCookie: true,
      timestamp: Date.now(),
    },
  );
};

/**
 * 检查二维码状态
 * @param key - 二维码 key
 */
export const checkQr = (key: string) => {
  return apiClient.get(
    "/login/qr/check",
    {
      key,
      noCookie: true,
      timestamp: Date.now(),
    },
  );
};

/**
 * 手机号登录
 * @param phone - 手机号
 * @param captcha - 验证码
 * @param ctcode - 国家码
 */
export const loginPhone = (phone: number, captcha: number, ctcode: number = 86) => {
  return apiClient.get(
    "/login/cellphone",
    {
      phone,
      captcha,
      ctcode,
      noCookie: true,
      timestamp: Date.now(),
    },
  );
};

/**
 * 发送验证码
 * @param phone - 手机号
 * @param ctcode - 国家码
 */
export const sentCaptcha = (phone: number, ctcode: number = 86) => {
  return apiClient.get(
    "/captcha/sent",
    {
      phone,
      ctcode,
      noCookie: true,
      timestamp: Date.now(),
    },
  );
};

/**
 * 验证验证码是否正确
 * @param phone - 手机号
 * @param captcha - 验证码
 * @param ctcode - 国家码
 */
export const verifyCaptcha = (phone: number, captcha: number, ctcode: number = 86) => {
  return apiClient.get(
    "/captcha/verify",
    {
      phone,
      captcha,
      ctcode,
      timestamp: Date.now(),
    },
  );
};

/**
 * 获取登录状态，未使用
 */
export const getLoginState = () => {
  return apiClient.get(
    "/login/status",
    {
      timestamp: Date.now(),
    },
  );
};

/**
 * 刷新登录
 * @param cookies - 完整的 cookie 对象
 */
export const refreshLogin = (cookies: Record<string, string>) => {
  return apiClient.post(
    "/login/refresh",
    cookies,
    {
      timestamp: Date.now(),
    },
  );
};

/**
 * 退出登录，未使用
 */
export const logout = () => {
  return apiClient.get(
    "/logout",
    {
      timestamp: Date.now(),
    },
  );
};

/**
 * 国家码列表
 */
export const countryList = () => {
  return apiClient.get("/countries/code/list", {});
};
