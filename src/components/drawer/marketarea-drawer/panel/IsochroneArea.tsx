import {
  useState,
  useEffect,
  CSSProperties,
  useContext,
  useCallback,
  useId,
} from "react";
import { Label, Alert } from "flowbite-react";
import { useMap } from "react-map-gl/mapbox";
import type { MapMouseEvent } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import type { Polygon, MultiPolygon } from "geojson";
import { MarketAreaChecklist } from "../";
import { useWindowSize } from "../../../../hooks";
import { Optionsfield, OptionType } from "../../../ui/options-field";
import { TradingField } from "./TradingField";
import {
  MarketareaContext,
  MarketareaItem,
  IsochroneSettings,
} from "../../../../contexts";
import { useConfig } from "../../../../contexts/ConfigContext";
import { ChoroplethContext } from "../../../../provider";
import { LAYER_ID } from "../../../../mapbox/choropleth";

interface IsochroneAreaProps {
  drawerVisible: boolean;
  isActive: boolean;
}

export const IsochroneArea = ({
  drawerVisible,
  isActive,
}: IsochroneAreaProps) => {
  const { map } = useMap();
  const {
    isochroneSettings,
    setIsochroneSettings,
    addItem,
    updateItemCenter,
    updateItemGeometry,
    items,
  } = useContext(MarketareaContext);
  const { setErrorMessage } = useContext(ChoroplethContext);
  const config = useConfig();
  const inputId = useId();

  // マーカーとレイヤーを管理するMap
  const markersRef = useState(() => new Map<string, mapboxgl.Marker>())[0];
  const layersRef = useState(() => new Set<string>())[0];
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  /**
   * 到達圏をマップに描画する関数
   */
  const drawIsochroneArea = useCallback(
    async (item: MarketareaItem) => {
      if (!map || item.type !== "isochrone") return;
      const mapGL = map.getMap();

      const { id, center, settings, checked } = item;
      const { travelMode, contourType, range, color } =
        settings as IsochroneSettings;

      // 既に存在する場合はスキップ
      if (markersRef.has(id)) return;

      const sourceId = `isochrone-source-${id}`;
      const layerId = `isochrone-layer-${id}`;

      try {
        // Mapbox Isochrone APIを呼び出し
        const profile =
          travelMode === "walking"
            ? "walking"
            : travelMode === "cycling"
              ? "cycling"
              : "driving";

        const contours =
          contourType === "minutes"
            ? `contours_minutes=${range}`
            : `contours_meters=${range}`;

        const url = `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${center.lng},${center.lat}?${contours}&polygons=true&denoise=0.5&generalize=50&access_token=${config.mapboxAccessToken}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Isochrone API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          // ソースとレイヤーを追加
          if (!mapGL.getSource(sourceId)) {
            mapGL.addSource(sourceId, {
              type: "geojson",
              data: data,
            });
          }

          if (!mapGL.getLayer(layerId)) {
            mapGL.addLayer({
              id: layerId,
              type: "fill",
              source: sourceId,
              paint: {
                "fill-color": color,
                "fill-opacity": 0.01,
              },
              layout: {
                visibility: checked ? "visible" : "none",
              },
            });
          }

          if (!mapGL.getLayer(`${layerId}-outline`)) {
            mapGL.addLayer({
              id: `${layerId}-outline`,
              type: "line",
              source: sourceId,
              paint: {
                "line-color": color,
                "line-width": 1,
              },
              layout: {
                visibility: checked ? "visible" : "none",
              },
            });
          }

          // 遅延描画でも初回から正しい表示状態になるよう、作成時に表示条件を反映
          const marker = new mapboxgl.Marker({ draggable: true })
            .setLngLat([center.lng, center.lat])
            .addTo(mapGL);

          const markerEl = marker.getElement();
          if (markerEl)
            markerEl.style.display =
              drawerVisible && checked ? "block" : "none";

          // マーカーとレイヤーを登録
          markersRef.set(id, marker);
          layersRef.add(layerId);
          layersRef.add(`${layerId}-outline`);

          // マーカーのドラッグ終了時に到達圏を再計算
          marker.on("dragend", async () => {
            const newLngLat = marker.getLngLat();
            const newCenter = { lng: newLngLat.lng, lat: newLngLat.lat };
            updateItemCenter(id, newCenter);

            try {
              const url = `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${newCenter.lng},${newCenter.lat}?${contours}&polygons=true&denoise=0.5&generalize=50&access_token=${config.mapboxAccessToken}`;
              const response = await fetch(url);
              if (!response.ok)
                throw new Error(`Isochrone API error: ${response.status}`);

              const newData = await response.json();
              const source = mapGL.getSource(
                sourceId,
              ) as mapboxgl.GeoJSONSource;
              if (source && newData.features && newData.features.length > 0) {
                source.setData(newData);
                updateItemGeometry(
                  id,
                  newData.features[0].geometry as Polygon | MultiPolygon,
                );
              }
            } catch (error) {
              console.error("Failed to update isochrone:", error);
              const message =
                error instanceof Error ? error.message : String(error);
              setErrorMessage(`到達圏の更新に失敗しました: ${message}`);
            }
          });
        }
      } catch (error) {
        console.error("Failed to draw isochrone area:", error);
        const message = error instanceof Error ? error.message : String(error);
        setErrorMessage(`到達圏の描画に失敗しました: ${message}`);
      }
    },
    [
      map,
      markersRef,
      layersRef,
      updateItemCenter,
      updateItemGeometry,
      config.mapboxAccessToken,
      setErrorMessage,
      drawerVisible,
    ],
  );

  // localStorageから復元された商圏をマップに描画
  useEffect(() => {
    if (!map) return;
    const mapGL = map.getMap();

    const drawItems = () => {
      items
        .filter((i) => i.type === "isochrone")
        .forEach((item) => {
          drawIsochroneArea(item);
        });
    };

    // スタイル読み込み前はidleイベント(スタイル・ソースの処理完了時に発火)を待つ
    if (mapGL.isStyleLoaded()) {
      drawItems();
      return;
    }
    mapGL.once("idle", drawItems);
    return () => {
      mapGL.off("idle", drawItems);
    };
  }, [map, items, drawIsochroneArea]);

  const travelModes: OptionType[] = [
    { property: "walking", name: "徒歩" },
    { property: "cycling", name: "自転車" },
    { property: "driving", name: "車" },
  ];
  const contourTypes: OptionType[] = [
    { property: "minutes", name: "時間" },
    { property: "meters", name: "距離" },
  ];

  const [travelActive, setTravelActive] = useState<string>(
    isochroneSettings.travelMode,
  );
  const [contourActive, setContourActive] = useState<string>(
    isochroneSettings.contourType,
  );

  // 設定が変更されたらContextを更新
  useEffect(() => {
    const newTravelMode = travelActive as "walking" | "cycling" | "driving";
    const newContourType = contourActive as "minutes" | "meters";

    if (
      isochroneSettings.travelMode !== newTravelMode ||
      isochroneSettings.contourType !== newContourType
    ) {
      setIsochroneSettings({
        ...isochroneSettings,
        travelMode: newTravelMode,
        contourType: newContourType,
        range: isochroneSettings.ranges[newContourType],
      });
    }
  }, [travelActive, contourActive, isochroneSettings, setIsochroneSettings]);

  /**
   * 到達圏登録用のマップクリックハンドラー
   */
  const onMapClick = useCallback(
    async (event: MapMouseEvent) => {
      const {
        lngLat: { lng, lat },
      } = event;
      if (!map) return;

      // 上限以上の場合は追加を拒否
      if (items.length >= config.marketareaMaxItems) {
        setAlertMessage(`商圏の登録上限は${config.marketareaMaxItems}件です。`);
        return;
      }

      try {
        // Mapbox Isochrone APIを呼び出し
        const profile =
          isochroneSettings.travelMode === "walking"
            ? "walking"
            : isochroneSettings.travelMode === "cycling"
              ? "cycling"
              : "driving";

        const contours =
          isochroneSettings.contourType === "minutes"
            ? `contours_minutes=${isochroneSettings.range}`
            : `contours_meters=${isochroneSettings.range}`;

        const url = `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${lng},${lat}?${contours}&polygons=true&access_token=${config.mapboxAccessToken}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Isochrone API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const id = `isochrone_${Date.now()}`;
          const name = `到達圏 ${isochroneSettings.range}${isochroneSettings.contourType === "minutes" ? "分" : "m"}`;

          const newItem: MarketareaItem = {
            id,
            type: "isochrone",
            name,
            center: { lng, lat },
            settings: isochroneSettings,
            checked: true,
            geometry: data.features[0].geometry as Polygon | MultiPolygon,
          };

          // アイテムをリストに追加（描画はuseEffectで自動的に行われる）
          addItem(newItem);
        }
      } catch (error) {
        console.error("Failed to fetch isochrone:", error);
        const message = error instanceof Error ? error.message : String(error);
        setErrorMessage(`到達圏の取得に失敗しました: ${message}`);
      }
    },
    [
      map,
      isochroneSettings,
      addItem,
      config.mapboxAccessToken,
      config.marketareaMaxItems,
      items.length,
      setErrorMessage,
    ],
  );

  // Drawerが表示されていて、かつタブがアクティブな時のみマップクリックイベントを登録
  useEffect(() => {
    if (!map || !drawerVisible || !isActive) return;

    map.on("click", onMapClick);

    return () => {
      map.off("click", onMapClick);
    };
  }, [map, drawerVisible, isActive, onMapClick]);

  // itemsのチェック状態変更を監視して表示を切り替え
  useEffect(() => {
    if (!map) return;
    const mapGL = map.getMap();

    items.forEach((item) => {
      if (item.type !== "isochrone") return;

      const marker = markersRef.get(item.id);
      const layerId = `isochrone-layer-${item.id}`;
      const outlineLayerId = `${layerId}-outline`;

      // マーカーの表示切替（drawerVisibleがfalseの時は常に非表示）
      if (marker) {
        const element = marker.getElement();
        if (element) {
          element.style.display =
            drawerVisible && item.checked ? "block" : "none";
        }
      }

      // レイヤーの表示切替
      if (mapGL.getLayer(layerId)) {
        mapGL.setLayoutProperty(
          layerId,
          "visibility",
          item.checked ? "visible" : "none",
        );
      }
      if (mapGL.getLayer(outlineLayerId)) {
        mapGL.setLayoutProperty(
          outlineLayerId,
          "visibility",
          item.checked ? "visible" : "none",
        );
      }
    });

    // 削除されたアイテムを検出してマップから削除
    const currentItemIds = new Set(
      items.filter((item) => item.type === "isochrone").map((item) => item.id),
    );
    markersRef.forEach((marker, id) => {
      if (!currentItemIds.has(id)) {
        // マーカーを削除
        marker.remove();
        markersRef.delete(id);

        // レイヤーとソースを削除
        const layerId = `isochrone-layer-${id}`;
        const outlineLayerId = `${layerId}-outline`;
        const sourceId = `isochrone-source-${id}`;

        if (mapGL.getLayer(outlineLayerId)) {
          mapGL.removeLayer(outlineLayerId);
          layersRef.delete(outlineLayerId);
        }
        if (mapGL.getLayer(layerId)) {
          mapGL.removeLayer(layerId);
          layersRef.delete(layerId);
        }
        if (mapGL.getSource(sourceId)) {
          mapGL.removeSource(sourceId);
        }
      }
    });
  }, [map, drawerVisible, items, markersRef, layersRef]);

  // 主題図レイヤーが追加されたら商圏レイヤーを最上位に再配置
  useEffect(() => {
    if (!map) return;
    const mapGL = map.getMap();

    const checkAndReorder = () => {
      // 主題図レイヤーが存在するかチェック
      const hasChoroplethLayers =
        mapGL.getLayer(LAYER_ID.FILL) ||
        mapGL.getLayer(LAYER_ID.LINE) ||
        mapGL.getLayer(LAYER_ID.EXTR);

      if (hasChoroplethLayers) {
        // 商圏レイヤーを最上位に移動
        layersRef.forEach((layerId) => {
          if (mapGL.getLayer(layerId)) {
            mapGL.moveLayer(layerId);
          }
        });
      }
    };

    // 初回チェック
    checkAndReorder();

    // マップのsourcedataイベントを監視（主題図レイヤーが追加されたとき）
    const handleSourceData = () => {
      checkAndReorder();
    };

    mapGL.on("sourcedata", handleSourceData);

    return () => {
      mapGL.off("sourcedata", handleSourceData);
    };
  }, [map, layersRef]);

  // ウインドウリサイズ
  const [, height] = useWindowSize();
  const style: CSSProperties = {
    height: `${height - 340}px`,
  };

  return (
    <>
      {alertMessage && (
        <div className="mb-4">
          <Alert color="warning" onDismiss={() => setAlertMessage(null)}>
            <span className="font-medium">注意:</span> {alertMessage}
          </Alert>
        </div>
      )}
      <p className="pb-2 text-gray-500 dark:text-gray-50">
        商圏を登録します。
        <br />
        範囲をセットしてマップをクリックしてください。
      </p>
      <div className="m-auto max-w-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="block">
            <Label className="mr-3 text-sm font-medium text-gray-500 dark:text-gray-50">
              交通手段:
            </Label>
            <Optionsfield
              options={travelModes}
              property={travelActive}
              name="travelMode"
              changeState={(i: number) =>
                setTravelActive(travelModes[i].property)
              }
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="block">
            <Label className="mr-3 text-sm font-medium text-gray-500 dark:text-gray-50">
              移動種別:
            </Label>
            <Optionsfield
              options={contourTypes}
              property={contourActive}
              name="contourType"
              changeState={(i: number) =>
                setContourActive(contourTypes[i].property)
              }
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div>
            <Label
              htmlFor={inputId}
              className="mr-3 text-sm font-medium text-gray-500 dark:text-gray-50"
            >
              商圏({contourActive === "minutes" ? "分" : "ｍ"}):
            </Label>
          </div>

          <TradingField
            inputId={inputId}
            travelMode={travelActive as "walking" | "cycling" | "driving"}
            contourType={contourActive as "minutes" | "meters"}
          />
        </div>
      </div>

      <div className="mt-4 overflow-y-auto p-4" style={style}>
        <MarketAreaChecklist />
      </div>
    </>
  );
};
