import { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useMap, Source } from "react-map-gl/mapbox";
import { FeatureCollection } from "geojson";
import { Spinner, Alert } from "flowbite-react";

import { ChoroplethContext } from "../../provider";
import { ColumnInfoType, getDatamapPolygon, getMax } from "@47stats/api";
import { Legend, LegendType } from "../legend";
import { ControlPanel } from "../panels";

import { getLegendList } from "./io/getLegendList";
import { countLegendValues } from "./countLegendValues";
import { LayerComponent } from "./layers";
import { LAYER_ID } from "./";
import { useConfig } from "../../contexts/ConfigContext";

const LAYER_SOURCE_ID: string = "choropleth-map";
const GEO_COLUMN_ITEM: { [K: string]: string[] } = {
  PREF: ["CODE", "DNAME", "PREF"],
  CITY: ["CODE", "DNAME", "PREF", "PREFNAME", "CITY"],
  TOWN: ["CODE", "DNAME", "PREF", "PREFNAME", "CITY", "CITYNAME", "TOWN"],
  ASAHIRU: ["CODE", "DNAME", "PREF", "CITY"],
};

type ChoroplethMapProps = {
  pitch: boolean;
  onChangeSeries: (column: ColumnInfoType) => void;
  onGeojsonUpdate?: (geojson: FeatureCollection | undefined) => void;
};

/**
 * 階級図を表示します。
 * @param props
 * @returns
 */
export const ChoroplethMap = (props: ChoroplethMapProps) => {
  const {
    database,
    version,
    store,
    column,
    area,
    legendData,
    setLegendData,
    errorMessage,
    setErrorMessage,
    filterPolygon,
  } = useContext(ChoroplethContext);
  const { map } = useMap();
  const { extrudeHeightScale } = useConfig();

  //データ
  const [geojson, setGeojson] = useState<FeatureCollection>();
  const [geojsonVersion, setGeojsonVersion] = useState<number>(0);
  // legendはContextから取得し、LegendTypeとLegendDataItemは同じ構造
  const legend = legendData as LegendType[];
  const [columnItem, setColumnItem] = useState<ColumnInfoType>(column[0]);
  const [series, setSeries] = useState<number>(0);
  const [isAuto, setAuto] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(errorMessage);
  const [opacity, setOpacity] = useState<number>(70);

  // depsに含めると不要な再実行を招く値は、最新値をrefで参照する(useEffectEvent相当)。
  // - legend: 下のeffectが自身で更新するため、depsに含めるとフェッチが無限ループする
  // - props: 親からインライン関数が渡されるため、depsに含めると毎レンダー再実行される
  // - database/version/store/area: 凡例effectの再実行トリガーはseries/isAuto等に
  //   限定し、リクエスト値には実行時点の最新を使う(変更時の再取得はデータeffectが担う)
  const latestRef = useRef({
    database,
    version,
    store,
    area,
    legend,
    geojson,
    props,
  });
  useEffect(() => {
    latestRef.current = {
      database,
      version,
      store,
      area,
      legend,
      geojson,
      props,
    };
  });

  // Context経由のエラーメッセージを同期
  useEffect(() => {
    if (errorMessage) {
      setError(errorMessage);
      setErrorMessage(null);
    }
  }, [errorMessage, setErrorMessage]);

  /**
   * 凡例の表示が自動更新のとき、時点を切り替える度に凡例リストをロードします。
   */
  // AbortController: 凡例取得用
  const legendAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    let cancelled = false;
    // 既存のリクエストを中断
    if (legendAbortRef.current) legendAbortRef.current.abort();
    legendAbortRef.current = new AbortController();
    const { database, version, store, area, legend } = latestRef.current;
    const columnItem = column.find((it) => it.date1 === series);
    if (columnItem) {
      const isAsahiru = store === "ASAHIRU";
      const areaParam = isAsahiru ? undefined : area;
      const polygonParam = isAsahiru ? filterPolygon : undefined;
      const hasData = isAsahiru ? !!filterPolygon : area.length > 0;
      setColumnItem(columnItem);
      if (isAuto && hasData) {
        (async () => {
          try {
            //凡例リストを取得
            const legendList = await getLegendList(
              {
                database: database,
                version: version,
                store: store,
                area: areaParam,
                polygon: polygonParam,
              },
              columnItem.column,
              legend,
            );
            if (!cancelled && !legendAbortRef.current?.signal.aborted) {
              setLegendData(
                countLegendValues(
                  legendList,
                  latestRef.current.geojson,
                  columnItem.column,
                ),
              );
              setError(null); // 成功時はエラーをクリア
            }
          } catch (error) {
            if (!cancelled && !legendAbortRef.current?.signal.aborted) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "凡例データの取得に失敗しました";
              console.error("Legend loading failed:", error);
              setError(errorMessage);
            }
          }
        })();
      } else if (hasData) {
        setLegendData(
          countLegendValues(
            legend,
            latestRef.current.geojson,
            columnItem.column,
          ),
        );
      }

      //時点が変更されたことを親に通知
      latestRef.current.props.onChangeSeries?.(columnItem);
    }
    return () => {
      cancelled = true;
      legendAbortRef.current?.abort();
    };
  }, [column, series, isAuto, filterPolygon, setLegendData]);

  /**
   * 統計指標、エリア等に変化があったら、凡例、ポリゴンデータを再ロードします。
   */
  // AbortController: データ取得用
  const dataAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (dataAbortRef.current) dataAbortRef.current.abort();
    dataAbortRef.current = new AbortController();
    const isAsahiru = store === "ASAHIRU";
    const hasData = isAsahiru ? !!filterPolygon : area.length > 0;
    const areaParam = isAsahiru ? undefined : area;
    const polygonParam = isAsahiru ? filterPolygon : undefined;
    if (hasData) {
      setIsLoading(true);
      setError(null); // データ読み込み開始時にエラーをクリア
      if (column.length > 0) {
        const columnItem = isAsahiru ? column[column.length - 1] : column[0];
        setColumnItem(columnItem);
        (async () => {
          try {
            //凡例リストを取得
            const legendList = await getLegendList(
              {
                database: database,
                version: version,
                store: store,
                area: areaParam,
                polygon: polygonParam,
              },
              columnItem.column,
              latestRef.current.legend,
            );
            if (!cancelled && !dataAbortRef.current?.signal.aborted) {
              setLegendData([...legendList]);
              setSeries(columnItem.date1);
            }
          } catch (error) {
            if (!cancelled && !dataAbortRef.current?.signal.aborted) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "凡例データの取得に失敗しました";
              console.error("Legend loading failed:", error);
              setError(errorMessage);
            }
          }
        })();
      }

      (async () => {
        try {
          let maxValue = 0;
          //各指標から最大値を取得します
          //これは階級区分図の高さを表現するための計算に利用されます
          const cols: string[] = [];
          column.forEach((it) => cols.push(it.column));
          if (column.length > 0) {
            const max = await getMax({
              database: database,
              version: version,
              store: store,
              area: areaParam,
              polygon: polygonParam,
              column: cols,
            });
            for (const key in max) {
              maxValue = Math.max(maxValue, max[key]);
            }
          }

          //エリアで選択された地域のポリゴン（行政界、メッシュ）を取得します
          //colparamはプロパティ値として設定されます
          const colparam: string[] = [];
          colparam.push(...GEO_COLUMN_ITEM[store]);
          colparam.push(...cols);

          const polygon = await getDatamapPolygon({
            database: database,
            version: version,
            store: store,
            area: areaParam,
            polygon: polygonParam,
            column: colparam,
            simplify: true, //ポリゴン簡易化
          });

          if (column.length > 0) {
            //階級区分図の高さを算出し、プロパティに設定します
            // 設定の高さスケールを使用
            polygon.features.forEach((f) => {
              column.forEach((it) => {
                if (f.properties) {
                  const value = f.properties[it.column];
                  if (value !== null) {
                    const height =
                      maxValue > 0
                        ? (Number(value) / maxValue) * extrudeHeightScale
                        : 0;
                    f.properties["h_" + it.column] = height;
                  } else {
                    f.properties["h_" + it.column] = "";
                  }
                }
              });
            });
          }
          if (!cancelled && !dataAbortRef.current?.signal.aborted) {
            // 新しいオブジェクト参照を作成してReactの変更検知を確実にする
            setGeojson({ ...polygon, features: [...polygon.features] });
            setGeojsonVersion((prev) => prev + 1);
            setIsLoading(false);
            // 親コンポーネントにポリゴンデータを通知
            latestRef.current.props.onGeojsonUpdate?.(polygon);
          }
        } catch (error) {
          if (!cancelled && !dataAbortRef.current?.signal.aborted) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "マップデータの取得に失敗しました";
            console.error("Map data loading failed:", error);
            setError(errorMessage);
            setIsLoading(false);
          }
        }
      })();
    }
    return () => {
      cancelled = true;
      dataAbortRef.current?.abort();
      setGeojson(undefined);
      setIsLoading(false);
      // 親コンポーネントにクリーンアップを通知
      latestRef.current.props.onGeojsonUpdate?.(undefined);
    };
  }, [
    database,
    version,
    store,
    area,
    column,
    filterPolygon,
    extrudeHeightScale,
    setLegendData,
  ]);

  /**
   * 階級図レイヤーに不透明度を設定します
   * @param value 不透明度
   */
  const onChangeOpacity = useCallback(
    (value: number) => {
      setOpacity(value);
      if (map) {
        const opacityValue = value / 100;
        const mapGL = map.getMap();

        // マップが完全に読み込まれるまで待機
        if (!mapGL.isStyleLoaded()) {
          console.warn("Map style not loaded yet, skipping opacity change");
          return;
        }

        // 各レイヤーに対して安全に不透明度を設定
        try {
          const lineLayer = mapGL.getLayer(LAYER_ID.LINE);
          if (lineLayer && lineLayer.type === "line") {
            mapGL.setPaintProperty(LAYER_ID.LINE, "line-opacity", opacityValue);
          }
        } catch (error) {
          console.warn(`Failed to set opacity for line layer:`, error);
        }

        try {
          const fillLayer = mapGL.getLayer(LAYER_ID.FILL);
          if (fillLayer && fillLayer.type === "fill") {
            mapGL.setPaintProperty(LAYER_ID.FILL, "fill-opacity", opacityValue);
          }
        } catch (error) {
          console.warn(`Failed to set opacity for fill layer:`, error);
        }

        try {
          const extrusionLayer = mapGL.getLayer(LAYER_ID.EXTR);
          if (extrusionLayer && extrusionLayer.type === "fill-extrusion") {
            mapGL.setPaintProperty(
              LAYER_ID.EXTR,
              "fill-extrusion-opacity",
              opacityValue,
            );
          }
        } catch (error) {
          console.warn(`Failed to set opacity for extrusion layer:`, error);
        }
      }
    },
    [map],
  );

  /**
   * 凡例の階級値が編集されたとき、表示中のポリゴンの値を数え直して各階級のcountを更新します。
   * 地図レイヤーの色分け（値 >= min を降順で最初にマッチした階級）と同じ規則で数えます
   */
  const recountLegend = useCallback(
    (newLegend: LegendType[]): LegendType[] => {
      const col =
        column.find((it) => it.date1 === series)?.column ?? columnItem?.column;
      return countLegendValues(newLegend, geojson, col);
    },
    [geojson, column, series, columnItem],
  );

  /**
   * 凡例の自動更新を切り替えます
   * 自動更新がtrueの場合、時点スライダーを操作する度に凡例データをロードします
   */
  const onChangeAuto = useCallback(
    (value: boolean) => {
      const columnItem = column.find((it) => it.date1 === series);
      if (columnItem) {
        setColumnItem(columnItem);
      }
      setAuto(value);
    },
    [column, series],
  );

  return (
    <>
      {error && (
        <div className="fixed bottom-8 right-4 z-50 w-96 shadow-xl">
          <Alert color="failure" onDismiss={() => setError(null)}>
            <span>
              <span className="font-medium">エラー:</span> {error}
            </span>
          </Alert>
        </div>
      )}

      {isLoading && (
        <div className="spinner-overlay">
          <Spinner aria-label="データ読み込み中" size="xl" />
        </div>
      )}

      {geojson ? (
        <Source
          key={`source-${geojsonVersion}`}
          id={LAYER_SOURCE_ID}
          type="geojson"
          data={geojson}
        >
          <LayerComponent
            sourceId={LAYER_SOURCE_ID}
            legend={legend}
            column={column}
            series={series}
            isArea={area.length > 0 || !!filterPolygon}
            pitch={props.pitch}
            opacity={opacity}
          />
          {legend.length > 0 && columnItem && (
            <Legend
              legend={legend}
              store={store}
              column={columnItem}
              onChangeLegend={(newLegend: LegendType[]) =>
                setLegendData(recountLegend(newLegend))
              }
            />
          )}
          {column.length > 0 && (
            <ControlPanel
              store={store}
              column={column}
              series={series}
              opacity={opacity}
              onChangeSeries={(e) => setSeries(e)}
              onChangeOpacity={onChangeOpacity}
              onChangeAuto={onChangeAuto}
            />
          )}
        </Source>
      ) : (
        ""
      )}
    </>
  );
};
