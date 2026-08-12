import { useState, useEffect } from "react";
import {
  getColumnClass,
  ColumnClassType,
  ColumnClassProps,
} from "@47stats/api";
import { Spinner } from "flowbite-react";
import { IPrevious } from "../../previous";

export type ClassListProps = ColumnClassProps &
  IPrevious & {
    onSelect?: (item: ColumnClassType) => void;
  };

/**
 * 指標分類のリストを表示します。
 * @params {ClassListProps} props
 * @returns
 */
export const ClassList = (props: ClassListProps) => {
  const [columnList, setColumnList] = useState<ColumnClassType[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getColumnClass({
          database: props.database,
          version: props.version,
          store: props.store,
          class: props.class,
        });
        setColumnList(data);
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
  }, [props.database, props.version, props.store, props.class]);

  const handlerClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    const columnItem = columnList.find(
      (it) => it.class === event.currentTarget.getAttribute("data-key"),
    );
    if (props.onSelect && columnItem) {
      props.onSelect(columnItem);
    }
  };

  const handlerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const key = event.currentTarget.getAttribute("data-key") || "";
      const columnItem = columnList.find((it) => it.class === key);
      if (props.onSelect && columnItem) {
        props.onSelect(columnItem);
      }
    }
  };

  return (
    <>
      {isLoading ? (
        <p className="mt-4 text-center font-normal text-gray-500 dark:text-gray-300 sm:text-xs">
          <Spinner aria-label="データを取得中" size="sm" /> データを取得中・・・
        </p>
      ) : error ? (
        <p className="mt-4 text-center font-normal text-red-600 dark:text-red-400 sm:text-xs">
          {error}
        </p>
      ) : columnList.length <= 0 ? (
        <p className="mt-4 text-center font-normal text-gray-500 dark:text-gray-300 sm:text-xs">
          データは空です
        </p>
      ) : (
        columnList.map((columnItem) => (
          <div
            key={columnItem.class}
            className="items-body-content"
            role="button"
            tabIndex={0}
            onKeyDown={handlerKeyDown}
            onClick={handlerClick}
            data-key={columnItem.class}
          >
            {columnItem.name.indexOf("@latest") >= 0 ? (
              <span className="pt-1 text-gray-800 dark:text-gray-200">
                {columnItem.name.replace("@latest", "")}
                <span className="ml-1 inline-block rounded bg-blue-500 px-1 text-xs font-semibold text-white">
                  最新
                </span>
              </span>
            ) : (
              <span className="pt-1 text-gray-800 dark:text-gray-200">
                {columnItem.name}
              </span>
            )}
            <svg
              className="size-6 text-gray-800 dark:text-gray-200"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m10 16 4-4-4-4"
              />
            </svg>
          </div>
        ))
      )}
    </>
  );
};
