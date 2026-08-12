import { useState, useEffect, useCallback } from "react";
import MapGL, {
  useMap,
  NavigationControl,
  /*FullscreenControl,*/ ScaleControl,
  Layer,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

import { styles } from "./controls/styles";

import { buildingLayer } from "./layers/building-layer";
import PitchControl from "./controls/pitch-control";
import StylesControl from "./controls/styles-control";
import GeocoderControl from "./controls/geocoder-control";
import "./style.css";

import { ColumnInfoType } from "@47stats/api";
import { ChoroplethMap } from "./choropleth";
import { PopupInfo } from "./popup";
import { HoverInfo, HoverInfoType } from "./tooltips";

// BBox
import { ChoroplethContext } from "../provider/index.js";
import { useContext } from "react";
import { bbox } from "@turf/turf";
import { FeatureCollection } from "geojson";

import { useConfig } from "../contexts/ConfigContext";

export /*default*/ function Map() {
  const mapboxAccessToken = useConfig().mapboxAccessToken;

  const { map } = useMap();

  //マップスタイル
  const mapboxStyle = styles[0].uri;

  const [columnInfo, setColumnInfo] = useState<ColumnInfoType>();
  const [hoverInfo, setHoverInfo] = useState<HoverInfoType>();

  //日本語化
  useEffect(() => {
    if (map) {
      const language = new MapboxLanguage({
        defaultLanguage: "ja",
      });
      map.addControl(language);
    }
  }, [map]);

  // BBox: ChoroplethMapから受け取ったポリゴンデータを使用
  const {
    isMapClickSelection,
    setIsMapClickSelection,
    popupInfo,
    setPopupInfo,
    database,
    store,
    column,
  } = useContext(ChoroplethContext);

  const handleGeojsonUpdate = useCallback(
    (geojson: FeatureCollection | undefined) => {
      // マップクリックによる選択の場合はズームしない
      if (isMapClickSelection) {
        setIsMapClickSelection(false); // フラグをリセット
        return;
      }

      // 通常の選択（AreaListView等）の場合のみズーム
      if (map && geojson) {
        const result = bbox(geojson);
        const currentPitch = map.getPitch();
        const currentBearing = map.getBearing();
        map.fitBounds(result as [number, number, number, number], {
          padding: 30,
          pitch: currentPitch,
          bearing: currentBearing,
        });
      }
    },
    [map, isMapClickSelection, setIsMapClickSelection],
  );

  // 元のBBox処理は削除（重複実行を防ぐため）
  /*
    const { database, store, area } = useContext(ChoroplethContext);
    const bboxAbortRef = useRef<AbortController | null>(null);
    useEffect(() => {
        let cancelled = false;
        if (bboxAbortRef.current) bboxAbortRef.current.abort();
        bboxAbortRef.current = new AbortController();
        if (map && area.length > 0) {
            (async () => {
                const polygon = await getDatamapPolygon({
                    database: database,
                    store: store,
                    area: area,
                    simplify: true, //ポリゴン簡易化
                });
                if (cancelled || bboxAbortRef.current?.signal.aborted) return;
                const result = bbox(polygon);
                map.fitBounds(result as [number, number, number, number], { padding: 30 });
            })();
        }
        return () => { cancelled = true; bboxAbortRef.current?.abort(); };
    }, [database, store, area, map]);
    */

  const onChangeStyle = (_e: MouseEvent, style: string) => {
    if (style.indexOf("traffic") >= 0 || style.indexOf("navigation") >= 0) {
      if (map && map?.getZoom() < 6) {
        map.setZoom(6);
      }
    }
  };

  const [isPitch, setPitch] = useState(false);
  const [building, setBuilding] = useState<"visible" | "none">("none");
  const handlerPitch = (toggle: number) => {
    setPitch(toggle === 0);
    setBuilding(toggle === 0 ? "visible" : "none");
  };

  // const [cursor, setCursor] = useState<string>('auto');
  // const onMouseEnter = useCallback(() => setCursor('pointer'), []);
  // const onMouseLeave = useCallback(() => setCursor('auto'), []);

  const onHover = useCallback((event: mapboxgl.MapLayerMouseEvent) => {
    const {
      features,
      point: { x, y },
    } = event;
    const hoveredFeature = features && features[0];
    // prettier-ignore
    setHoverInfo(hoveredFeature && { feature: hoveredFeature, x, y });
  }, []);

  return (
    <div className="prose">
      <MapGL
        id="map"
        mapLib={import("mapbox-gl")}
        initialViewState={{
          longitude: 139.774375,
          latitude: 35.68442,
          zoom: 4,
        }}
        style={{ width: "100vw", height: "100vh" }}
        mapStyle={mapboxStyle}
        mapboxAccessToken={mapboxAccessToken}
        interactiveLayerIds={["m47-line", "m47-fill", "m47-extrusion"]}
        // onMouseEnter={onMouseEnter}
        // onMouseLeave={onMouseLeave}
        // cursor={cursor}
        onMouseMove={onHover}
      >
        <GeocoderControl
          mapboxAccessToken={mapboxAccessToken}
          position="top-right"
          placeholder="住所検索"
          /*
                    language="ja"
                    countries="JP"
                    types="country,region,place,locality,neighborhood,poi"*/
        />
        {/* <FullscreenControl /> */}
        <NavigationControl />
        <PitchControl position="top-right" onToggle={handlerPitch} />
        <StylesControl
          styles={styles}
          eventListeners={{
            onChange: onChangeStyle,
          }}
        />
        <ScaleControl />

        <ChoroplethMap
          pitch={isPitch}
          onChangeSeries={(e) => setColumnInfo(e)}
          onGeojsonUpdate={handleGeojsonUpdate}
        />
        <Layer {...buildingLayer} layout={{ visibility: building }} />
        <HoverInfo hoverInfo={hoverInfo} columnInfo={columnInfo} />
        {column.length > 1 && Object.keys(popupInfo).length !== 0 && (
          <PopupInfo
            info={popupInfo}
            database={database}
            store={store}
            column={column}
            onClose={() => setPopupInfo({})}
          />
        )}
      </MapGL>
    </div>
  );
}
