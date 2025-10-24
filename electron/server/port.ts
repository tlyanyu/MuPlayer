import getPort from "get-port";

// 默认端口
let webPort: number;
let servePort: number;

const getSafePort = async () => {
  if (webPort && servePort) return { webPort, servePort };
  webPort = await getPort({ port: 14558 });
  servePort = await getPort({ port: 25884 });
  return { webPort, servePort };
};

export default getSafePort;
