import { useState, useEffect, useContext } from "react";
import {
  getColumnKindList,
  ColumnListProps,
  ColumnKindType,
} from "@47stats/api";
import { Spinner } from "flowbite-react";
import { IPrevious } from "../../previous";
import { ChoroplethContext } from "../../../../provider";

export type ItemListProps = ColumnListProps &
  IPrevious & {
    search?: boolean;
    onSelect?: (item: ColumnListProps) => void;
  };

/**
 * 指標種別のリストを表示します。
 * @param {ItemListProps} props
 * @returns
 */
export const ItemList = (props: ItemListProps) => {
  const { column } = useContext(ChoroplethContext);
  const [columnList, setColumnList] = useState<ColumnKindType[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [active, setActive] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getColumnKindList({
          database: props.database,
          version: props.version,
          store: props.store,
          class: props.class,
          keyword: props.keyword,
        });
        setColumnList(data);

        // localStorageから復元されたcolumnがある場合、該当するkindをactiveに設定
        if (column && column.length > 0) {
          // columnの最初の要素からkindを取得（同じkindの時系列データが複数あるため）
          const selectedKind = column[0].kind;
          setActive(selectedKind);
        }
      } catch (e) {
        console.error(e);
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      setColumnList([]);
    };
  }, [
    props.database,
    props.version,
    props.store,
    props.class,
    props.keyword,
    column,
  ]);

  const handlerClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    const columnItem = columnList.find(
      (it) => it.kind === event.currentTarget.getAttribute("data-key"),
    );
    if (props.onSelect && columnItem) {
      props.onSelect(Object.assign({}, columnItem, props));
      setActive(columnItem.kind);
    }
  };

  const handlerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const key = event.currentTarget.getAttribute("data-key") || "";
      const columnItem = columnList.find((it) => it.kind === key);
      if (props.onSelect && columnItem) {
        props.onSelect(Object.assign({}, columnItem, props));
        setActive(columnItem.kind);
      }
    }
  };

  function renderer(item: ColumnKindType) {
    if (item.unit) {
      return `${item.name}(${item.unit})`;
    } else {
      return `${item.name}`;
    }
  }

  return (
    <>
      {isLoading ? (
        <p className="mt-4 text-center font-normal text-gray-500 dark:text-gray-400 sm:text-xs">
          <Spinner aria-label="データを取得中" size="sm" /> データを取得中・・・
        </p>
      ) : error ? (
        <p className="mt-4 text-center font-normal text-red-600 dark:text-red-400 sm:text-xs">
          {error}
        </p>
      ) : columnList.length <= 0 ? (
        <p className="mt-4 text-center font-normal text-gray-500 dark:text-gray-400 sm:text-xs">
          データは空です
        </p>
      ) : (
        columnList.map((columnItem) => (
          <div
            key={columnItem.kind}
            className={`items-body-content ${active == columnItem.kind ? "rounded-2xl border border-[#0B5AA2] bg-gray-200 dark:bg-gray-600" : ""}`}
            role="button"
            tabIndex={0}
            onKeyDown={handlerKeyDown}
            onClick={handlerClick}
            data-key={columnItem.kind}
          >
            <span className="pt-1 text-gray-800 dark:text-gray-200">
              {renderer(columnItem)}
            </span>
          </div>
        ))
      )}
    </>
  );
};
