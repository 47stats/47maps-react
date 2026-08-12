import { useState, useEffect, useContext, useCallback } from "react";
import { Drawer } from "flowbite-react";
import { HiOutlineMap } from "react-icons/hi";
import { useMap } from "react-map-gl/mapbox";
import type { MapMouseEvent } from "mapbox-gl";
import { DrawerPropType } from "../base-drawer";

type ChoroplethDrawerProps = DrawerPropType & {
  onMarketareaOpen?: () => void;
};
import { ChoroplethTabs } from "./choropleth-tabs";
import { ChoroplethContext } from "../../../provider";
import { hitTest, getDatalistCount } from "@47stats/api";
import { LAYER_ID } from "../../../mapbox/choropleth";
import centroid from "@turf/centroid";

export const ChoroplethDrawer = (props: ChoroplethDrawerProps) => {
  const {
    database,
    store,
    area,
    setArea,
    setIsMapClickSelection,
    setPopupInfo,
    isMarketareaDrawerActive,
    maxSelection,
    setErrorMessage,
  } = useContext(ChoroplethContext);
  const { map } = useMap();
  const [activeTab, setActiveTab] = useState<number>(0);

  /**
   * PopupInfo表示専用ハンドラー（常時有効）
   * 商圏Drawerがアクティブな時は無効化
   */
  const onMapClickForPopup = useCallback(
    (event: MapMouseEvent) => {
      // 商圏Drawerがアクティブな場合はPopupを表示しない
      if (isMarketareaDrawerActive) return;

      const {
        lngLat: { lng, lat },
        point,
      } = event;
      if (!map) return;
      const mapGL = map.getMap();

      // 階級図レイヤーが存在するかチェック
      const existingLayers = [
        LAYER_ID.LINE,
        LAYER_ID.FILL,
        LAYER_ID.EXTR,
      ].filter((layerId) => mapGL.getLayer(layerId));

      if (existingLayers.length === 0) return; // 階級図なし→何もしない

      // クリック位置が階級図上かチェック
      const features = mapGL.queryRenderedFeatures(point, {
        layers: existingLayers,
      });

      if (!features || features.length === 0) return; // 階級図外→何もしない

      if (store === "ASAHIRU") {
        // Asahiruは市区町村コードがないため、クリック位置のジオメトリからcentroidを計算してPopupInfoに座標を渡す
        const featureCentroid = centroid(features[0]);
        const [centroidLng, centroidLat] = featureCentroid.geometry.coordinates;
        setPopupInfo(
          Object.assign(
            { lng, lat, cx: centroidLng, cy: centroidLat },
            features[0].properties,
          ),
        );
      } else {
        // それ以外はクリック位置の座標をそのままPopupInfoに渡す
        setPopupInfo(Object.assign({ lng, lat }, features[0].properties));
      }

      // エリア追加を防ぐため伝播を止める
      event.originalEvent?.preventDefault?.();
      event.originalEvent?.stopPropagation?.();
    },
    [map, store, setPopupInfo, isMarketareaDrawerActive],
  );

  /**
   * エリア追加専用ハンドラー（Drawer表示中のエリアタブのみ）
   * activeTab=0（メニュー）: クリック無効
   * activeTab=1（エリア）: 階級図外クリック→エリア追加
   * activeTab=2（統計）: クリック無効
   */
  const onMapClickForAreaAdd = useCallback(
    (event: MapMouseEvent) => {
      // メニュータブ（index = 0）と統計タブ（index = 2）ではクリック無効
      if (activeTab === 0 || activeTab === 2) {
        return;
      }

      const {
        lngLat: { lng, lat },
        point,
      } = event;
      if (!map) return;
      const mapGL = map.getMap();

      // 階級図レイヤーが存在するかチェック
      const existingLayers = [
        LAYER_ID.LINE,
        LAYER_ID.FILL,
        LAYER_ID.EXTR,
      ].filter((layerId) => mapGL.getLayer(layerId));

      // 階級図上のクリックかチェック
      if (existingLayers.length > 0) {
        const features = mapGL.queryRenderedFeatures(point, {
          layers: existingLayers,
        });
        if (features && features.length > 0) {
          // 階級図上→エリア追加しない（Popupのみ表示）
          return;
        }
      }

      // 階級図外の場所（未選択エリア）がクリックされた場合はhitTestを実行
      (async () => {
        try {
          const info = await hitTest({
            database: database,
            lon: lng,
            lat: lat,
          });

          // storeに応じて適切なエリアコードを取得
          let newAreaCode: string | null = null;

          if (
            store === "PREF" &&
            info.prefcode &&
            !area.includes(info.prefcode)
          ) {
            newAreaCode = info.prefcode;
          } else if (
            store === "CITY" &&
            info.citycode &&
            !area.includes(info.citycode)
          ) {
            newAreaCode = info.citycode;
          } else if (
            store === "TOWN" &&
            info.towncode &&
            !area.includes(info.towncode)
          ) {
            newAreaCode = info.citycode;
          }

          if (newAreaCode) {
            // maxSelectionによる制限チェック（0=無制限）
            if (maxSelection > 0) {
              const count = await getDatalistCount({
                database: database,
                store: store,
                area: area,
              });
              if (count >= maxSelection) {
                setErrorMessage(
                  `エリアの最大選択数(${maxSelection}件)に達しているため、これ以上エリアを追加できません`,
                );
                return;
              }
            }
            setIsMapClickSelection(true); // マップクリックによる選択フラグを設定
            setArea([...area, newAreaCode]);
          }
        } catch (error) {
          console.error("Hit test failed:", error);
          const message =
            error instanceof Error ? error.message : String(error);
          setErrorMessage(`クリック地点の情報取得に失敗しました: ${message}`);
        }
      })();
    },
    [
      map,
      database,
      store,
      area,
      setArea,
      setIsMapClickSelection,
      activeTab,
      maxSelection,
      setErrorMessage,
    ],
  );

  // PopupInfo表示ハンドラを常時登録
  useEffect(() => {
    if (!map) return;

    map.on("click", onMapClickForPopup);

    return () => {
      map.off("click", onMapClickForPopup);
    };
  }, [map, onMapClickForPopup]);

  // エリア追加ハンドラはDrawer表示中のみ登録
  useEffect(() => {
    if (!map || !props.visible) return;

    map.on("click", onMapClickForAreaAdd);

    return () => {
      map.off("click", onMapClickForAreaAdd);
    };
  }, [map, props.visible, onMapClickForAreaAdd]);

  return (
    <Drawer
      backdrop={false}
      open={props.visible}
      onClose={props.handleClose}
      className="w-[350px]"
    >
      <Drawer.Header title="階級図を見る" titleIcon={HiOutlineMap} />
      <Drawer.Items>
        <ChoroplethTabs
          onTabChange={setActiveTab}
          onMarketareaOpen={props.onMarketareaOpen}
        />
      </Drawer.Items>
    </Drawer>
  );
};
