import { useState, useRef, useContext, useEffect } from "react";
import { Flowbite, Tabs, TabsRef, CustomFlowbiteTheme } from "flowbite-react";
import { HiMenu } from "react-icons/hi";

import {
  AreaListView,
  ColumnListView,
  MenuListView,
  MenuItemType,
} from "../../listview";
import { ChoroplethContext } from "../../../provider";
import { useConfig } from "../../../contexts/ConfigContext";
import { MarketareaContext } from "../../../contexts";
import { AsahiruArea } from "./asahiru-area/AsahiruArea";

const customTheme: CustomFlowbiteTheme = {
  tabs: {
    tablist: {
      tabitem: {
        base: "flex items-center justify-center rounded-t-lg p-4 text-sm font-medium first:ml-0 focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400 disabled:dark:text-gray-500",
      },
    },
  },
};

interface ChoroplethTabsProps {
  onTabChange?: (tab: number) => void;
  onMarketareaOpen?: () => void;
}

export const ChoroplethTabs = (props: ChoroplethTabsProps) => {
  const config = useConfig();

  const {
    database,
    store,
    setDatabase,
    setStore,
    setColumn,
    setColumnPath,
    setArea,
    setPopupInfo,
    setMaxSelection,
    setFilterPolygon,
  } = useContext(ChoroplethContext);
  const { items } = useContext(MarketareaContext);
  // localStorageから復元された値で初期化
  const [mapType, setMapType] = useState<string>(() => store || "");
  const [classId, setClassId] = useState<string>(config.classId);

  /**
   * メニューが選択されたら「統計」タブに切り替える
   */

  const tabsRef = useRef<TabsRef>(null);

  const handleTabChange = (tab: number) => {
    if (props.onTabChange) {
      props.onTabChange(tab);
    }
  };

  // localStorageから復元された場合、初期タブを設定
  useEffect(() => {
    if (store && tabsRef.current) {
      // データが復元されている場合は「統計」タブをアクティブに
      tabsRef.current.setActiveTab(1);
    }
  }, [store]);

  // ASAHIRU: 商圏アイテムのpolygonをChoroplethContextに同期
  useEffect(() => {
    if (store !== "ASAHIRU") {
      setFilterPolygon(undefined);
      return;
    }
    const checkedWithGeometry = items.filter((i) => i.checked && i.geometry);
    if (checkedWithGeometry.length === 0) {
      setFilterPolygon(undefined);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coordinates: any[] = [];
    for (const item of checkedWithGeometry) {
      const geom = item.geometry!;
      if (geom.type === "Polygon") {
        coordinates.push(geom.coordinates);
      } else {
        coordinates.push(...geom.coordinates);
      }
    }
    setFilterPolygon(JSON.stringify({ type: "MultiPolygon", coordinates }));
  }, [store, items, setFilterPolygon]);

  const handlerSelectedMenu = (
    selectedItem: MenuItemType,
    checked: boolean,
  ) => {
    //useState
    setMapType(checked ? selectedItem.mapType : "");
    setClassId(selectedItem.class);

    //useContext
    setDatabase(selectedItem.database);
    setStore(checked ? selectedItem.mapType : "");
    setColumn([]);
    setColumnPath([]); // 統計パスもクリア
    setArea([]);
    setPopupInfo({}); // グラフ情報もクリア
    setMaxSelection(selectedItem.maxSelection);

    if (checked) {
      if (selectedItem.mapType == "PREF") {
        tabsRef.current?.setActiveTab(2);
      } else {
        tabsRef.current?.setActiveTab(1);
      }
    }
  };

  /**
   * メニュー選択の度にコンポーネントを初期化する
   * key={mapType} ... 種別が変わったらコンポーネントを初期化します。
   */
  return (
    <Flowbite theme={{ theme: customTheme }}>
      <Tabs
        aria-label="Tabs with underline"
        style="underline"
        ref={tabsRef}
        onActiveTabChange={handleTabChange}
      >
        <Tabs.Item active title="1.メニュー" icon={HiMenu} className="p-3">
          <MenuListView onSelect={handlerSelectedMenu} />
        </Tabs.Item>

        <Tabs.Item title="2.エリア" className="p-3" disabled={mapType == ""}>
          {mapType == "ASAHIRU" ? (
            <AsahiruArea
              key={mapType}
              database={database}
              store={"PREF"}
              mapType={mapType || ""}
              onMarketareaOpen={props.onMarketareaOpen}
            />
          ) : (
            <AreaListView
              key={mapType}
              database={database}
              store={"PREF"}
              mapType={mapType || ""}
            />
          )}
        </Tabs.Item>

        <Tabs.Item title="3.統計" className="p-3" disabled={mapType == ""}>
          <ColumnListView
            key={mapType}
            database={database}
            store={mapType || ""}
            class={classId}
          />
        </Tabs.Item>
      </Tabs>
    </Flowbite>
  );
};
