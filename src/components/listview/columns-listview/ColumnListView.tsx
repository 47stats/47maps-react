import { useState, useEffect, CSSProperties, useContext } from "react";
import {
  BaseType,
  ColumnClassType,
  ColumnListProps,
  getColumnList,
} from "@47stats/api";
import Previous from "../previous/Previous";
import SearchBox from "../searchbox/SearchBox";
import "../ListView.css";
import { ClassList, ItemList } from "./listview";
import { useWindowSize } from "../../../hooks";
import { ChoroplethContext } from "../../../provider";

export type ColumnListViewProps = BaseType & {
  class: string;
};

type ParamsType = ColumnClassType & {
  search?: boolean;
  keyword?: string;
};

export const ColumnListView = (props: ColumnListViewProps) => {
  const { column, columnPath, setColumn, setColumnPath } =
    useContext(ChoroplethContext);

  // localStorageから復元されたパスで初期化
  const [params, setParams] = useState<ParamsType[]>(() => {
    if (columnPath && columnPath.length > 0) {
      // 復元されたパスを ParamsType 形式に変換
      const restoredParams = columnPath.map((item, index) => ({
        class: item.class,
        name: item.name,
        // 最後の要素かつcolumnに値がある場合はleaf: trueにして統計データリストを表示
        leaf: index === columnPath.length - 1 && column.length > 0,
      }));
      return restoredParams;
    }
    return [
      {
        class: props.class,
        name: "ルート",
        leaf: false,
      },
    ];
  });

  const [previous, setPrevious] = useState<ColumnClassType[]>(() => {
    if (columnPath && columnPath.length > 0 && column.length > 0) {
      // columnに値がある場合、最後の要素以外を previous に設定
      return columnPath.slice(0, -1).map((item) => ({
        class: item.class,
        name: item.name,
        leaf: false,
      }));
    } else if (columnPath && columnPath.length > 1) {
      // columnが空の場合は、最初の要素以外を previous に設定
      return columnPath.slice(0, -1).map((item) => ({
        class: item.class,
        name: item.name,
        leaf: false,
      }));
    }
    return [];
  });

  // params が変更されたら columnPath を更新
  useEffect(() => {
    setColumnPath(params.map((p) => ({ class: p.class, name: p.name })));
  }, [params, setColumnPath]);

  /**
   * 戻るボタンクリック
   * @param event
   */
  const previousClick = () => {
    // 最後尾リストを削除（不変更新）
    setParams((prev) => prev.slice(0, -1));
    setPrevious((prev) => prev.slice(0, -1));
  };

  /**
   * 戻る（ドロップダウン）リスト項目クリック
   * @param item
   */
  const previousSelect = (item: ColumnClassType) => {
    setParams((prev) => {
      const i = prev.findIndex((e) => e.class === item.class);
      return i >= 0 ? prev.slice(0, i + 1) : prev;
    });
    setPrevious((prev) => {
      const j = prev.findIndex((e) => e.class === item.class);
      return j >= 0 ? prev.slice(0, j) : prev;
    });
  };

  /**
   * 分類項目クリック
   * @param item
   */
  const handlerSelectClass = (item: ColumnClassType) => {
    const last = params.at(-1) as ColumnClassType;
    setPrevious((prev) => [...prev, last]);
    setParams((prev) => [...prev, item]);
  };

  /**
   * 指標項目クリック
   * @param item
   */
  const handlerSelectItem = (item: ColumnListProps) => {
    /**
     * 指定の種別IDから指標の時系列リストを取得します。
     */
    (async () => {
      setColumn(await getColumnList(item));
    })();
  };

  /**
   * カラムリストを検索します。
   * この時選択される列分類も条件に含まれます。
   * @param value 検索キーワード
   */
  const handlerSearch = (value: string) => {
    const item = params.at(-1);
    if (item) {
      if (!value) {
        if (item.keyword && item.keyword?.length > 0) {
          previousClick();
        }
      } else {
        const next = Object.assign({ keyword: value }, item, { leaf: true });
        setParams((prev) => [...prev, next]);
        setPrevious((prev) => [...prev, item as ColumnClassType]);
      }
    }
  };

  // ウインドウリサイズ
  const [, height] = useWindowSize();
  const style: CSSProperties = {
    height: `${height - 192}px`,
  };
  return (
    <>
      <div className="mb-4 ml-4 mt-2 flex items-center justify-between">
        <div className="relative z-0 flex">
          <Previous<ColumnClassType>
            disabled={params.length < 2}
            previous={previous}
            onClick={previousClick}
            onSelect={previousSelect}
          />
          <SearchBox name="column-item-search" onSearch={handlerSearch} />
        </div>
      </div>

      {!props.store || !props.class ? (
        <p className="mt-4 text-center font-normal text-gray-500 dark:text-gray-300">
          メニューを選択してください
        </p>
      ) : (
        params.map((it, i, array) => (
          <div
            key={i}
            className="overflow-y-auto p-4"
            style={style}
            hidden={i !== array.length - 1}
          >
            {it.leaf ? (
              <ItemList {...props} {...it} onSelect={handlerSelectItem} />
            ) : (
              <ClassList {...props} {...it} onSelect={handlerSelectClass} />
            )}
          </div>
        ))
      )}
    </>
  );
};
