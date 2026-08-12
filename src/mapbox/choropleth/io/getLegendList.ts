import { getFrequency, getRange, AreaInfoProps } from "@47stats/api";
import { LegendType } from "../../legend";
import colorbrewer from "../../../utils/colorbrewer";
import { getConfig } from "../../../config/AppConfig";

/**
 * 凡例リストを取得します
 */
export const getLegendList = async (
  params: AreaInfoProps & { polygon?: string },
  column: string,
  legend: LegendType[],
  condition: "FREQUENCY" | "RANGE" = "FREQUENCY",
) => {
  const config = getConfig();
  const ramp_name = localStorage.getItem("legend-ramp-name") || config.rampName;
  const num_classes =
    Number(localStorage.getItem("legend-num-classes")) || config.numClasses;

  // ランクを取得します
  const numClasses = legend.length <= 0 ? num_classes : legend.length;
  let rank;
  try {
    if (condition == "FREQUENCY") {
      // 等数
      rank = await getFrequency(
        Object.assign({}, params, {
          column: column,
          division: numClasses,
        }),
      );
    } else {
      // 等差
      rank = await getRange(
        Object.assign({}, params, {
          column: column,
          division: numClasses,
        }),
      );
    }
    // 値の大きい順（降順）に明示的にソート
    rank.sort((a: unknown, b: unknown) => {
      const aMin = ((a as Record<string, unknown>).min as number) || 0;
      const bMin = ((b as Record<string, unknown>).min as number) || 0;
      return bMin - aMin;
    });
  } catch (error) {
    console.error(`Failed to fetch ${condition.toLowerCase()} data:`, error);
    throw new Error(
      `データの取得に失敗しました (${condition}): ${error instanceof Error ? error.message : "不明なエラー"}`,
    );
  }

  // 凡例にカラーを設定
  const legendList: LegendType[] = [];
  if (legend.length <= 0) {
    const pallete: string[] = structuredClone(
      colorbrewer[ramp_name][numClasses],
    );
    pallete.reverse();
    for (let i: number = 0; i < numClasses; i++) {
      legendList.push(
        Object.assign(
          {
            min: 0,
            max: 0,
            count: 0,
            color: pallete[i],
          },
          rank[i],
        ),
      );
    }
  } else {
    legend.forEach((it, i) => {
      legendList.push(
        Object.assign(
          {
            min: 0,
            max: 0,
            count: 0,
            color: it.color,
          },
          rank[i],
        ),
      );
    });
  }

  return legendList;
};
