import { Platform } from "@/services/apiConfig";

/** 地区选项 */
interface AreaOption {
  name: string;        // 显示名称
  key?: string;        // 新碟使用(网易云): "ALL"|"ZH"|"EA"|"JP"|"KR"
  num?: number;        // 新歌使用(网易云): 0|7|96|8|16
  value: number;       // 统一的索引值,用于UI选中状态
}

/** 适配器配置 */
interface AlbumAdapterConfig {
  areas: AreaOption[];  // 地区选项数组
}

export class AlbumAdapter {
  /**
   * 获取平台的地区配置
   * @param platform 目标平台
   * @param type 类型: "album"|"song",用于区分新碟和新歌配置
   * @returns 地区配置
   */
  static getConfig(platform: Platform, type: "album" | "song" = "album"): AlbumAdapterConfig {
    if (platform === Platform.QQMUSIC) {
      if (type === "song") {
        // QQ音乐新歌: 6个地区选项(最新/内地/港台/欧美/韩国/日本)
        return {
          areas: [
            { name: "最新", value: 0 },
            { name: "内地", value: 1 },
            { name: "港台", value: 2 },
            { name: "欧美", value: 3 },
            { name: "韩国", value: 4 },
            { name: "日本", value: 5 },
          ],
        };
      }

      // QQ音乐新碟: 5个地区(无"全部"选项)
      return {
        areas: [
          { name: "内地", value: 0 },
          { name: "港台", value: 1 },
          { name: "欧美", value: 2 },
          { name: "韩国", value: 3 },
          { name: "日本", value: 4 },
        ],
      };
    }

    // 网易云: 5个地区(含"全部"选项)
    // 双重映射设计: key用于新碟API, num用于新歌API
    return {
      areas: [
        { name: "全部", key: "ALL", num: 0, value: 0 },
        { name: "华语", key: "ZH", num: 7, value: 1 },
        { name: "欧美", key: "EA", num: 96, value: 2 },
        { name: "日本", key: "JP", num: 8, value: 3 },
        { name: "韩国", key: "KR", num: 16, value: 4 },
      ],
    };
  }

  /**
   * 将UI参数转换为API参数
   * @param platform 目标平台
   * @param areaIndex UI选中的地区索引(0-4 或 0-5)
   * @param offset 偏移量
   * @param limit 返回数量
   * @param type 类型: "album"|"song"
   * @returns API参数
   */
  static toApiParams(
    platform: Platform,
    areaIndex: number,
    offset: number = 0,
    limit: number = 20,
    type: "album" | "song" = "album"
  ) {
    if (platform === Platform.QQMUSIC) {
      return this.toQQMusicParams(areaIndex, offset, limit, type);
    }
    return this.toNeteaseParams(areaIndex, offset, limit, type);
  }

  /**
   * 网易云参数映射
   *
   * 新碟API参数:
   * - cat: "ALL"|"ZH"|"EA"|"JP"|"KR"
   * - limit: 返回数量
   * - offset: 偏移量
   *
   * 新歌API参数:
   * - type: 0(全部)|7(华语)|96(欧美)|8(日本)|16(韩国)
   */
  private static toNeteaseParams(
    areaIndex: number,
    offset: number,
    limit: number,
    type: "album" | "song"
  ) {
    const config = this.getConfig(Platform.NETEASE);
    const area = config.areas[areaIndex];

    if (type === "song") {
      // 新歌使用num字段
      return {
        cat: "ALL" as const,
        type: (area?.num ?? 0) as 0 | 7 | 8 | 16 | 96,
        limit,
        offset,
        extraParams: undefined,
      };
    }

    // 新碟使用key字段
    return {
      cat: (area?.key ?? "ALL") as "ALL" | "ZH" | "EA" | "JP" | "KR",
      type: 0 as const,
      limit,
      offset,
      extraParams: undefined,
    };
  }

  /**
   * QQ音乐参数映射
   *
   *
   * 新碟地区索引映射:
   * 0: 内地 → area=1
   * 1: 港台 → area=2
   * 2: 欧美 → area=3
   * 3: 韩国 → area=4
   * 4: 日本 → area=5
   *
   * 新歌地区索引映射:
   * 0: 最新 → type=5
   * 1: 内地 → type=1
   * 2: 港台 → type=6
   * 3: 欧美 → type=2
   * 4: 韩国 → type=4
   * 5: 日本 → type=3
   *
   * 分页参数(仅新碟):
   * - start: offset(偏移量) ⚠️ 注意: start才是offset
   * - sin: 固定为0 ⚠️ 注意: sin一直是0
   * - num: limit(返回数量)
   */
  private static toQQMusicParams(
    areaIndex: number,
    offset: number,
    limit: number,
    type: "album" | "song"
  ) {
    if (type === "song") {
      // 新歌参数映射
      const typeMap = [5, 1, 6, 2, 4, 3];

      return {
        cat: "ALL" as const,
        type: 0 as const,  // 占位符,实际使用 extraParams.type
        limit,
        offset,
        extraParams: {
          type: typeMap[areaIndex] ?? 5,
        },
      };
    }

    // 新碟参数映射
    const areaMap = [1, 2, 3, 4, 5];

    return {
      cat: "ALL" as const,
      type: 0 as const,
      limit,
      offset,
      extraParams: {
        area: areaMap[areaIndex] ?? 1,
        start: offset,  // start 是 offset
        sin: 0,         // sin 固定为 0
        num: limit,
      },
    };
  }
}
