import { fileURLToPath } from "url";

const LOCALHOST_HOSTNAMES = new Set(["", "localhost"]);

export function buildFileURLFromLocal(requestUrl: string, platform: NodeJS.Platform = process.platform): URL {
  const requestURL = new URL(requestUrl);
  const fileURL = new URL("file://");

  if (platform === "win32") {
    const host = requestURL.host;
    const pathname = requestURL.pathname;
    const isDriveLetterHost = /^[a-zA-Z]$/.test(host) && !pathname.includes(":");

    if (isDriveLetterHost) {
      const drive = host.toUpperCase();
      fileURL.host = "";
      fileURL.pathname = `/${drive}:${pathname}`;
    } else {
      const isLocalHost = LOCALHOST_HOSTNAMES.has(host.toLowerCase());
      fileURL.host = isLocalHost ? "" : host;
      fileURL.pathname = pathname;
    }
  } else {
    const host = requestURL.host;
    const shouldIncludeHost = host && !LOCALHOST_HOSTNAMES.has(host.toLowerCase());
    const pathname = shouldIncludeHost ? `/${host}${requestURL.pathname}` : requestURL.pathname;

    fileURL.host = "";
    fileURL.pathname = pathname;
  }

  return fileURL;
}

export function localURLToFilePath(requestUrl: string): string {
  return fileURLToPath(buildFileURLFromLocal(requestUrl));
}
