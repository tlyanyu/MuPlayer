import { Platform } from "@/services/apiConfig";

/** 筛选选项 */
interface FilterOption {
  name: string;
  value: number | string;
}

/** 筛选维度 */
interface FilterDimension {
  key: string;           // 维度标识: area/type/genre/initial
  name: string;          // 显示名称: 地区/类型/流派/字母
  options: FilterOption[];
}

/** 适配器配置 */
interface AdapterConfig {
  filters: FilterDimension[];  // 筛选维度数组
}

export class ArtistAdapter {
  /**
   * 获取平台的筛选配置
   * @param platform 目标平台
   * @returns 筛选配置(包含所有维度)
   */
  static getConfig(platform: Platform): AdapterConfig {
    // 字母索引(所有平台通用)
    const initialOptions: FilterOption[] = [
      { name: "热门", value: -1 },
      ...Array.from({ length: 26 }, (_, i) => ({
        name: String.fromCharCode(65 + i),
        value: String.fromCharCode(65 + i),
      })),
      { name: "#", value: 0 },
    ];

    if (platform === Platform.QQMUSIC) {
      // QQ音乐: 4维筛选
      return {
        filters: [
          {
            key: "area",
            name: "地区",
            options: [
              { name: "全部", value: 0 },
              { name: "内地", value: 1 },
              { name: "港台", value: 2 },
              { name: "欧美", value: 3 },
              { name: "日本", value: 4 },
              { name: "韩国", value: 5 },
            ],
          },
          {
            key: "type",
            name: "类型",
            options: [
              { name: "全部", value: 0 },
              { name: "男", value: 1 },
              { name: "女", value: 2 },
              { name: "组合", value: 3 },
            ],
          },
          {
            key: "genre",
            name: "流派",
            options: [
              { name: "全部", value: 0 },
              { name: "流行", value: 1 },
              { name: "摇滚", value: 2 },
              { name: "民谣", value: 3 },
              { name: "电子", value: 4 },
              { name: "嘻哈", value: 5 },
              { name: "R&B", value: 6 },
              { name: "轻音乐", value: 7 },
              { name: "民歌", value: 8 },
              { name: "古典", value: 9 },
              { name: "蓝调", value: 10 },
              { name: "乡村", value: 11 },
            ],
          },
          {
            key: "initial",
            name: "字母",
            options: initialOptions,
          },
        ],
      };
    }

    // 网易云: 3维筛选
    return {
      filters: [
        {
          key: "area",
          name: "地区",
          options: [
            { name: "全部", value: 0 },
            { name: "华语", value: 1 },
            { name: "欧美", value: 2 },
            { name: "日本", value: 3 },
            { name: "韩国", value: 4 },
          ],
        },
        {
          key: "type",
          name: "类型",
          options: [
            { name: "全部", value: 0 },
            { name: "男", value: 1 },
            { name: "女", value: 2 },
            { name: "组合", value: 3 },
          ],
        },
        {
          key: "initial",
          name: "字母",
          options: initialOptions,
        },
      ],
    };
  }

  /**
   * 将UI参数转换为API参数
   * @param platform 目标平台
   * @param selections UI选中的值 { area: 0, type: 1, genre: 2, initial: 'A' }
   * @returns API参数
   */
  static toApiParams(
    platform: Platform,
    selections: Record<string, number | string>
  ) {
    if (platform === Platform.QQMUSIC) {
      return this.toQQMusicParams(selections);
    }
    return this.toNeteaseParams(selections);
  }

  /**
   * 网易云参数映射
   *
   * 地区索引映射：
   * 0: 全部 → area=-1
   * 1: 华语 → area=7
   * 2: 欧美 → area=96
   * 3: 日本 → area=8
   * 4: 韩国 → area=16
   *
   * 类型索引映射：
   * 0: 全部 → type=-1
   * 1: 男   → type=1
   * 2: 女   → type=2
   * 3: 组合 → type=3
   */
  private static toNeteaseParams(selections: Record<string, number | string>) {
    const areaMap = [-1, 7, 96, 8, 16];
    const typeMap = [-1, 1, 2, 3];

    return {
      type: typeMap[selections.type as number] ?? -1,
      area: areaMap[selections.area as number] ?? -1,
      initial: selections.initial, // 网易云直接使用
      extraParams: undefined,
    };
  }

  /**
   * QQ音乐参数映射
   *
   * 地区索引映射：
   * 0: 全部 → area=-100
   * 1: 内地 → area=200
   * 2: 港台 → area=2
   * 3: 欧美 → area=5
   * 4: 日本 → area=4
   * 5: 韩国 → area=3
   *
   * 性别索引映射（QQ音乐使用sex字段）：
   * 0: 全部 → sex=-100
   * 1: 男   → sex=0
   * 2: 女   → sex=1
   * 3: 组合 → sex=2
   *
   * 流派索引映射：
   * 0: 全部 → genre=-100
   * 1: 流行 → genre=1
   * 2: 摇滚 → genre=2
   * 3: 民谣 → genre=3
   * 4: 电子 → genre=4
   * 5: 嘻哈 → genre=6
   * 6: R&B  → genre=8
   * 7: 轻音乐 → genre=9
   * 8: 民歌 → genre=10
   * 9: 古典 → genre=14
   * 10: 蓝调 → genre=20
   * 11: 乡村 → genre=25
   *
   * 字母索引映射：
   * -1 (热门) → index=-100
   * 'A'-'Z'  → index=1-26
   * 0 (#)    → index=27
   */
  private static toQQMusicParams(selections: Record<string, number | string>) {
    const areaMap = [-100, 200, 2, 5, 4, 3];
    const sexMap = [-100, 0, 1, 2];
    const genreMap = [-100, 1, 2, 3, 4, 6, 8, 9, 10, 14, 20, 25];

    return {
      type: sexMap[selections.type as number] ?? -100,
      area: areaMap[selections.area as number] ?? -100,
      initial: this.mapInitialForQQMusic(selections.initial),
      extraParams: {
        genre: genreMap[selections.genre as number] ?? -100,
      },
    };
  }

  /**
   * QQ音乐字母索引映射
   *
   * 网易云 → QQ音乐：
   * -1 (热门) → -100
   * 'A'-'Z'   → 1-26
   * 0 (#)     → 27
   */
  private static mapInitialForQQMusic(initial: number | string): number | string {
    if (initial === -1) return -100; // 热门
    if (initial === 0) return 27; // #
    // A-Z: 转换为数字1-26
    if (typeof initial === "string") {
      const charCode = initial.charCodeAt(0);
      if (charCode >= 65 && charCode <= 90) {
        // A-Z
        return charCode - 64; // A=1, B=2, ..., Z=26
      }
    }
    return initial;
  }
}
