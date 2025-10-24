import axios from "axios";

// 获取仓库更新日志
export const updateLog = () => {
  return axios.request({
    baseURL: "https://api.github.com",
    withCredentials: false,
    url: "/repos/tlyanyu/MuPlayer/releases",
    params: { noCookie: true },
  });
};
