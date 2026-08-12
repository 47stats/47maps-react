import React, { useState, CSSProperties, useEffect, useContext } from "react";
import {
  FaChartPie,
  FaChartLine,
  FaChartColumn,
  FaChartArea,
  FaPalette,
  FaRegPenToSquare,
} from "react-icons/fa6";
import { mapTypeMenu } from "../../../assets";
import { IconType } from "react-icons";
import { useWindowSize } from "../../../hooks";
import { ChoroplethContext } from "../../../provider";

export type MenuItemType = {
  name: string;
  description: string;
  icon: string; //react-icons/fa6
  database: string;
  class: string;
  mapType: string;
  maxSelection: number;
};

export type MenuListViewProps = {
  onSelect: (selectedItem: MenuItemType, checked: boolean) => void;
};

const Icons: { [index: string]: IconType } = {
  FaChartPie,
  FaChartLine,
  FaChartColumn,
  FaChartArea,
  FaPalette,
  FaRegPenToSquare,
};

export const MenuListView = (props: MenuListViewProps) => {
  const { store } = useContext(ChoroplethContext);
  const [menuList, setMenuList] = useState<MenuItemType[]>();
  // localStorageから復元されたstoreで初期化
  const [mapType, setMapType] = useState<string>(() => store || "");
  const [error, setError] = useState<string | null>(null);

  const [, height] = useWindowSize();
  const style: CSSProperties = {
    height: `${height - 140}px`,
  };

  useEffect(() => {
    try {
      setMenuList(mapTypeMenu as MenuItemType[]);
    } catch (err) {
      console.error(err);
      setMenuList([]);
      setError("メニューの取得に失敗しました");
    }
  }, []);

  const onItemClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation();
    const menuItem =
      menuList &&
      menuList.find(
        (it) => it.mapType === event.currentTarget.getAttribute("data-key"),
      );
    if (menuItem) {
      const checked = !(menuItem.mapType == mapType);
      props.onSelect(menuItem, checked);
      setMapType(checked ? menuItem.mapType : "");
    }
  };

  const onItemKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      // Enter/Space でクリック相当の動作
      const key = event.currentTarget.getAttribute("data-key") || "";
      const menuItem = menuList && menuList.find((it) => it.mapType === key);
      if (menuItem) {
        const checked = !(menuItem.mapType == mapType);
        props.onSelect(menuItem, checked);
        setMapType(checked ? menuItem.mapType : "");
      }
    }
  };

  return (
    <div className="overflow-y-auto p-4" style={style}>
      <p className="mx-6 mb-5 font-semibold text-cyan-700 dark:text-cyan-400">
        統計データを地図に表示します
      </p>
      {error ? (
        <p className="mx-6 -mt-3 mb-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {menuList &&
        menuList.map((menuItem) => (
          <div
            key={menuItem.mapType}
            className={`relative my-2 flex cursor-pointer gap-x-7 rounded-lg border p-2  hover:border-cyan-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700
 ${mapType != "" && mapType == menuItem.mapType ? "rounded-lg border border-cyan-900 bg-gray-200 dark:bg-slate-700" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={menuItem.name}
            aria-pressed={mapType != "" && mapType == menuItem.mapType}
            onClick={onItemClick}
            onKeyDown={onItemKeyDown}
            data-key={menuItem.mapType}
          >
            <div className="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white dark:bg-gray-600 dark:group-hover:bg-gray-600">
              {React.createElement(Icons[menuItem.icon], {
                className: "text-xl",
              })}
            </div>
            <div>
              <a
                href="#"
                className="font-semibold text-gray-900 dark:text-gray-200"
              >
                {menuItem.name}
              </a>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {menuItem.description}
              </p>
            </div>
          </div>
        ))}
    </div>
  );
};
