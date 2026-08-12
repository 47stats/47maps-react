import { useContext } from "react";
import { Checkbox, Button } from "flowbite-react";
import { HiX } from "react-icons/hi";
import { getDatalistCount } from "@47stats/api";
import type { Polygon, MultiPolygon } from "geojson";
import { MarketareaContext } from "../../../contexts";
import { ChoroplethContext } from "../../../provider";

export const MarketAreaChecklist = () => {
  const { items, toggleItem, removeItem } = useContext(MarketareaContext);
  const { database, version, store, maxSelection, setErrorMessage } =
    useContext(ChoroplethContext);

  const buildPolygonFilter = (targetItems: typeof items) => {
    const checkedWithGeometry = targetItems.filter(
      (item) => item.checked && item.geometry,
    );
    if (checkedWithGeometry.length === 0) {
      return undefined;
    }

    const coordinates: MultiPolygon["coordinates"] = [];
    checkedWithGeometry.forEach((item) => {
      const geometry = item.geometry as Polygon | MultiPolygon;
      if (geometry.type === "Polygon") {
        coordinates.push(geometry.coordinates);
      } else {
        coordinates.push(...geometry.coordinates);
      }
    });

    return JSON.stringify({ type: "MultiPolygon", coordinates });
  };

  const handleCheckboxChange = async (id: string) => {
    const nextItems = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item,
    );

    const toggledItem = nextItems.find((item) => item.id === id);
    if (!toggledItem) {
      return;
    }

    if (store === "ASAHIRU" && toggledItem.checked && maxSelection > 0) {
      const polygon = buildPolygonFilter(nextItems);
      if (polygon) {
        try {
          const count = await getDatalistCount({
            database,
            version,
            store,
            polygon,
          });

          if (count > maxSelection) {
            setErrorMessage(
              `エリアの最大選択数(${maxSelection}件)に達しているため、これ以上エリアを追加できません`,
            );
            return;
          }
        } catch (error) {
          // 件数チェックに失敗した場合はチェック状態を変更しない
          console.error("Datalist count check failed:", error);
          const message =
            error instanceof Error ? error.message : String(error);
          setErrorMessage(`エリア件数の確認に失敗しました: ${message}`);
          return;
        }
      }
    }

    toggleItem(id);
  };

  const handleRemove = (id: string) => {
    removeItem(id);
  };

  return (
    <>
      {items.length <= 0 ? (
        <p className="mt-4 text-center font-normal text-gray-500 dark:text-gray-400 sm:text-xs">
          商圏が登録されていません
        </p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2 border-b border-gray-200 py-2 dark:border-gray-700"
          >
            <Checkbox
              className="mt-1"
              color={"default"}
              checked={item.checked}
              onChange={() => handleCheckboxChange(item.id)}
            />
            <div className="flex-1">
              <div className="text-sm text-gray-800 dark:text-gray-200">
                {item.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {item.type === "trading" ? "円商圏" : "到達圏"}
              </div>
            </div>
            <Button
              size="xs"
              color="gray"
              onClick={() => handleRemove(item.id)}
              className="ml-auto"
            >
              <HiX className="size-4" />
            </Button>
          </div>
        ))
      )}
    </>
  );
};
