import { useState, useEffect, CSSProperties, useContext } from "react";

import { BaseType, AreaInfoType, getDatalistCount } from "@47stats/api";
import Previous from "../previous/Previous";
import SearchBox from "../searchbox/SearchBox";
import { AreaList, AreaItemType } from "./listview";
import { useWindowSize } from "../../../hooks";
import { ChoroplethContext } from "../../../provider";

import "../ListView.css";

export type AreaListViewProps = BaseType & {
  mapType: string;
};

type ParamsType = AreaInfoType & {
  leaf: boolean;
  keyword?: string;
};

export const AreaListView = (props: AreaListViewProps) => {
  const {
    area,
    setArea,
    isMapClickSelection,
    setIsMapClickSelection,
    maxSelection,
    setErrorMessage,
  } = useContext(ChoroplethContext);

  const [params, setParams] = useState<ParamsType[]>([
    {
      code: "",
      name: "ルート",
      leaf: props.mapType === "PREF",
    },
  ]);
  const [previous, setPrevious] = useState<AreaInfoType[]>([]);

  const [selectedArea, setSelectedArea] = useState<Map<string, Set<string>>>(
    new Map<string, Set<string>>(),
  );

  // ChoroplethContextのareaが更新された時の追加
  useEffect(() => {
    // areaが空になった時は、selectedAreaもクリアする必要がある
    if (area.length === 0 && selectedArea.size > 0) {
      setSelectedArea(new Map<string, Set<string>>());
      return;
    }

    // マップクリック以外での更新の場合は、areaとselectedAreaを同期
    if (!isMapClickSelection && area.length > 0) {
      const newSelectedArea = new Map<string, Set<string>>();

      // area配列のすべてのコードをselectedAreaに統合
      area.forEach((areaCode) => {
        const prefcode =
          areaCode.length == 2 ? areaCode : areaCode.substring(0, 2);

        if (!newSelectedArea.has(prefcode)) {
          newSelectedArea.set(prefcode, new Set());
        }

        if (areaCode.length > 2) {
          newSelectedArea.get(prefcode)?.add(areaCode);
        }
      });

      setSelectedArea(newSelectedArea);
    }
  }, [area, selectedArea.size, isMapClickSelection]);

  // マップクリックによる選択をselectedAreaに統合
  useEffect(() => {
    if (isMapClickSelection && area.length > 0) {
      // 新しいselectedAreaマップを作成
      const newSelectedArea = cloneSelectedArea(selectedArea);

      // 最後に追加されたエリアコード（マップクリックで選択されたもの）
      const lastAddedCode = area[area.length - 1];

      // handlerChangeと同じロジックで処理する
      const prefcode =
        lastAddedCode.length == 2
          ? lastAddedCode
          : lastAddedCode.substring(0, 2);

      if (!newSelectedArea.has(prefcode)) {
        newSelectedArea.set(prefcode, new Set());
      }

      if (lastAddedCode.length > 2) {
        // 東京府県が存在し、市の場合は、登録順に追加
        newSelectedArea.get(prefcode)?.add(lastAddedCode);
      } else {
        // 都道府県の場合は、そのままで空のSetで都道府県全体選択を示す
      }

      setSelectedArea(newSelectedArea);
      setIsMapClickSelection(false); // フラグをリセット
    }
  }, [isMapClickSelection, area, selectedArea, setIsMapClickSelection]);

  // 検索時の store 解決を行う関数
  const resolveStoreForSearch = (
    store: string,
    mapType: string,
    keyword?: string,
  ) => {
    if (keyword && keyword.length > 0) {
      if (mapType === "TOWN") {
        return "CITY";
      }
      return mapType;
    }
    return store;
  };

  // Map<string, Set<string>> 深堀のディープクローン
  const cloneSelectedArea = (
    src: Map<string, Set<string>>,
  ): Map<string, Set<string>> => {
    const copy = new Map<string, Set<string>>();
    src.forEach((v, k) => copy.set(k, new Set(v)));
    return copy;
  };

  /**
   * 戻るボタンクリック
   * @param event
   */
  const previousClick = () => {
    // 最後のリストを削除し、画面更新を新しく
    setParams((prev) => prev.slice(0, -1));
    setPrevious((prev) => prev.slice(0, -1));
  };

  /**
   * 戻るボタン（ドロップダウンボタン）リスト選択クリック
   * @param item
   */
  const previousSelect = (item: AreaInfoType) => {
    setParams((prev) => {
      const i = prev.findIndex((e) => e.code === item.code);
      return i >= 0 ? prev.slice(0, i + 1) : prev;
    });
    setPrevious((prev) => {
      const j = prev.findIndex((e) => e.code === item.code);
      return j >= 0 ? prev.slice(0, j) : prev;
    });
  };

  /**
   * 項目クリック
   * @param item
   */
  const handlerSelect = (item: AreaItemType) => {
    /*
     * 次のリストを読み込むため、条件を設定します。
     */
    const lastItem = params.at(-1);
    if (!lastItem?.leaf) {
      setPrevious([...previous, lastItem as AreaInfoType]);
      switch (props.mapType) {
        case "CITY":
        case "TOWN":
        case "ASAHIRU":
          if (params.length == 1) {
            setParams([
              ...params,
              Object.assign(
                { store: "CITY", leaf: true },
                item as AreaInfoType,
              ),
            ]);
          }
          break;
        // case "TOWN":
        //     if (params.length == 1) {
        //         setParams([...params, Object.assign({ store: 'CITY', leaf: false }, item as AreaInfoType)]);
        //     } else if (params.length == 2) {
        //         setParams([...params, Object.assign({ store: 'TOWN', leaf: true }, item as AreaInfoType)]);
        //     }
        //     break;
      }
    }
  };

  /**
   * 項目チェック
   * エリアを選択します。
   * @param code[]
   * @param checked
   */
  const handlerChange = async (
    code: string[],
    checked: boolean,
  ): Promise<boolean> => {
    const arrays = cloneSelectedArea(selectedArea);

    if (checked) {
      // エリアを追加
      code.forEach((it) => {
        const prefcode = it.length == 2 ? it : it.substring(0, 2);
        if (!arrays.get(prefcode)) {
          arrays.set(prefcode, new Set());
        }
        if (it.length > 2) {
          arrays.get(prefcode)?.add(it);
        }
      });

      // maxSelectionによる制限チェック（0=無制限）
      if (maxSelection > 0) {
        const codeList: string[] = [];
        arrays.forEach((a, k) => {
          a.size > 0 ? a.forEach((b) => codeList.push(b)) : codeList.push(k);
        });
        try {
          const count = await getDatalistCount({
            database: props.database,
            version: props.version,
            store: props.mapType,
            area: codeList,
          });
          if (count > maxSelection) {
            setErrorMessage(
              `エリアの最大選択数(${maxSelection}個)に達しているため、この以上エリアを追加できません`,
            );
            return false;
          }
        } catch (error) {
          // 件数チェックに失敗した場合は選択を適用しない
          console.error("Datalist count check failed:", error);
          const message =
            error instanceof Error ? error.message : String(error);
          setErrorMessage(`エリア件数の確認に失敗しました: ${message}`);
          return false;
        }
      }
    } else {
      // エリアを削除
      code.forEach((it) => {
        if (it.length == 2 && arrays.get(it)) {
          arrays.get(it)?.forEach((citycode) => {
            const index = area.findIndex((areacode) => areacode == citycode);
            if (index >= 0) {
              area.splice(index, 1);
            }
          });
          arrays.delete(it);
        } else {
          const index = area.findIndex((areacode) => areacode === it);
          if (index >= 0) {
            area.splice(index, 1);
            const prefcode = it.substring(0, 2);
            arrays.get(prefcode)?.delete(it);
            if (arrays.get(prefcode)?.size == 0) {
              arrays.delete(prefcode);
            }
          }
        }
      });
    }
    const codeList: string[] = [];
    arrays.forEach((a, k) => {
      a.size > 0 ? a.forEach((b) => codeList.push(b)) : codeList.push(k);
    });
    setArea(codeList);
    setSelectedArea(arrays);
    return true;
  };

  /**
   * エリアリストを検索します。
   * この時検索された地域も候補に含まれます。
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
        // 検索時に、store をmapType に切り替える
        const nextStore = resolveStoreForSearch(
          props.store,
          props.mapType,
          value,
        );
        setParams([
          ...params,
          Object.assign({ keyword: value, store: nextStore }, item, {
            leaf: true,
          }),
        ]);
        setPrevious([...previous, item as AreaInfoType]);
      }
    }
  };

  // ウィンドウリサイズ
  const [, height] = useWindowSize();
  const style: CSSProperties = {
    height: `${height - 192}px`,
  };
  return (
    <>
      <div className="mb-4 ml-4 mt-2 flex items-center justify-between">
        <div className="relative z-0 flex">
          <Previous<AreaInfoType>
            disabled={params.length < 2}
            previous={previous}
            onClick={previousClick}
            onSelect={previousSelect}
          />
          <SearchBox name="area-item-search" onSearch={handlerSearch} />
        </div>
      </div>

      {!props.mapType ? (
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
            <AreaList
              {...props}
              {...it}
              selectedArea={selectedArea}
              onChange={handlerChange}
              onSelect={handlerSelect}
            />
          </div>
        ))
      )}
    </>
  );
};
