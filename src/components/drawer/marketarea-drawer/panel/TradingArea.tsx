import {
  useState,
  useEffect,
  CSSProperties,
  useCallback,
  useContext,
  useId,
} from "react";
import { Label, Alert } from "flowbite-react";
import { useMap } from "react-map-gl/mapbox";
import type { MapMouseEvent } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import type { Polygon } from "geojson";
import { MarketAreaChecklist } from "../";
import { useWindowSize } from "../../../../hooks";
import { TradingField } from "./TradingField";
import { MarketareaContext, MarketareaItem } from "../../../../contexts";
import { LAYER_ID } from "../../../../mapbox/choropleth";
import { useConfig } from "../../../../contexts/ConfigContext";

interface TradingAreaProps {
  drawerVisible: boolean;
  isActive: boolean;
}

export const TradingArea = ({ drawerVisible, isActive }: TradingAreaProps) => {
  const { map } = useMap();
  const config = useConfig();
  const {
    tradingSettings,
    addItem,
    updateItemCenter,
    updateItemGeometry,
    items,
  } = useContext(MarketareaContext);
  const inputId = useId();

  // マーカーとレイヤーを管理するMap
  const markersRef = useState(() => new Map<string, mapboxgl.Marker>())[0];
  const layersRef = useState(() => new Set<string>())[0];
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  /**
   * 円のGeoJSONを生成
   */
  const createCircle = useCallback(
    (center: [number, number], radiusInKm: number, points = 64) => {
      const coords = {
        latitude: center[1],
        longitude: center[0],
      };

      const km = radiusInKm;
      const ret = [];
      const distanceX =
        km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
      const distanceY = km / 110.574;

      for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        ret.push([coords.longitude + x, coords.latitude + y]);
      }
      ret.push(ret[0]);

      return {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "Polygon" as const,
          coordinates: [ret],
        },
      };
    },
    [],
  );

  /**
   * 商圏をマップに描画する関数
   */
  const drawTradingArea = useCallback(
    (item: MarketareaItem) => {
      if (!map || item.type !== "trading") return;
      const mapGL = map.getMap();

      const { id, center, settings, checked } = item;
      const { radius, color } = settings as { radius: number; color: string };

      // 既に存在する場合はスキップ
      if (markersRef.has(id)) return;

      const sourceId = `trading-source-${id}`;
      const layerId = `trading-layer-${id}`;

      // 円のGeoJSONを生成
      const circle = createCircle([center.lng, center.lat], radius / 1000);

      // ソースとレイヤーを追加
      if (!mapGL.getSource(sourceId)) {
        mapGL.addSource(sourceId, {
          type: "geojson",
          data: circle,
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
        markerEl.style.display = drawerVisible && checked ? "block" : "none";

      // マーカーとレイヤーを登録
      markersRef.set(id, marker);
      layersRef.add(layerId);
      layersRef.add(`${layerId}-outline`);

      // マーカーのドラッグ終了時に円の位置を更新
      marker.on("dragend", () => {
        const newLngLat = marker.getLngLat();
        const newCenter = { lng: newLngLat.lng, lat: newLngLat.lat };
        updateItemCenter(id, newCenter);

        const newCircle = createCircle(
          [newCenter.lng, newCenter.lat],
          radius / 1000,
        );
        updateItemGeometry(id, newCircle.geometry as Polygon);
        const source = mapGL.getSource(sourceId) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(newCircle);
        }
      });
    },
    [
      map,
      markersRef,
      layersRef,
      updateItemCenter,
      updateItemGeometry,
      createCircle,
      drawerVisible,
    ],
  );

  // localStorageから復元された商圏をマップに描画
  useEffect(() => {
    if (!map) return;
    const mapGL = map.getMap();

    const drawItems = () => {
      items
        .filter((i) => i.type === "trading")
        .forEach((item) => {
          drawTradingArea(item);
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
  }, [map, items, drawTradingArea]);

  /**
   * 円商圏登録用のマップクリックハンドラー
   */
  const onMapClick = useCallback(
    (event: MapMouseEvent) => {
      const {
        lngLat: { lng, lat },
      } = event;
      if (!map) return;

      // 上限以上の場合は追加を拒否
      if (items.length >= config.marketareaMaxItems) {
        setAlertMessage(`商圏の登録上限は${config.marketareaMaxItems}件です。`);
        return;
      }

      const id = `trading_${Date.now()}`;
      const name = `円商圏 ${tradingSettings.radius}m`;

      const circle = createCircle([lng, lat], tradingSettings.radius / 1000);
      const newItem: MarketareaItem = {
        id,
        type: "trading",
        name,
        center: { lng, lat },
        settings: tradingSettings,
        checked: true,
        geometry: circle.geometry as Polygon,
      };

      // アイテムをリストに追加（描画はuseEffectで自動的に行われる）
      addItem(newItem);
    },
    [
      map,
      tradingSettings,
      addItem,
      createCircle,
      config.marketareaMaxItems,
      items.length,
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
      if (item.type !== "trading") return;

      const marker = markersRef.get(item.id);
      const layerId = `trading-layer-${item.id}`;
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
      items.filter((item) => item.type === "trading").map((item) => item.id),
    );
    markersRef.forEach((marker, id) => {
      if (!currentItemIds.has(id)) {
        // マーカーを削除
        marker.remove();
        markersRef.delete(id);

        // レイヤーとソースを削除
        const layerId = `trading-layer-${id}`;
        const outlineLayerId = `${layerId}-outline`;
        const sourceId = `trading-source-${id}`;

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
    height: `${height - 280}px`,
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
        半径をセットしてマップをクリックしてください。
      </p>
      <div className="mx-auto max-w-sm">
        <div className="flex items-center gap-2">
          <div>
            <Label
              htmlFor={inputId}
              className="mr-3 text-sm font-medium text-gray-500 dark:text-gray-50"
            >
              商圏(m):
            </Label>
          </div>
          <TradingField inputId={inputId} />
        </div>
      </div>

      <div className="mt-4 overflow-y-auto p-4" style={style}>
        <MarketAreaChecklist />
      </div>
    </>
  );
};
