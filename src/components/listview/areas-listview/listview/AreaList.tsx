import { useState, useEffect, useRef } from "react";
import { Badge, Checkbox, Spinner } from "flowbite-react";
import { HiCheck } from "react-icons/hi";

import { getAreaList, BaseType, AreaInfoType } from "@47stats/api";
import { IPrevious } from "../../previous";

export type AreaItemType = AreaInfoType & {
  checked?: boolean;
};

export type AreaListProps = BaseType &
  IPrevious & {
    code: string;
    mapType: string;
    leaf?: boolean;
    keyword?: string;
    selectedArea: Map<string, Set<string>>;
    onSelect: (selectedItem: AreaItemType) => void;
    onChange: (code: string[], checked: boolean) => Promise<boolean>;
  };

const isAreaChecked = (
  item: AreaItemType,
  selectedArea: Map<string, Set<string>>,
) => {
  if (selectedArea.size === 0) {
    return false;
  }

  const selItem = selectedArea.get(item.code);
  if (selItem && selItem.size > 0) {
    return true;
  }

  const prefcode = item.code.length > 2 ? item.code.substring(0, 2) : item.code;
  const prefItem = selectedArea.get(prefcode);
  return prefItem ? prefItem.size === 0 || prefItem.has(item.code) : false;
};

const resolveStoreForSearch = (store: string, mapType: string) => {
  if (mapType === "TOWN") {
    return "CITY";
  }
  return store;
};

/**
 * エリアリストを表示します。
 * @params {AreaListProps} props
 * @returns
 */
export const AreaList = (props: AreaListProps) => {
  const [areaList, setAreaList] = useState<AreaItemType[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // depsに含めると不要な再フェッチを招く値は、最新値をrefで参照する(useEffectEvent相当)。
  // - selectedArea: 変更時のチェック状態反映は下のeffectが担うため、リストは再取得しない
  // - onChange: 親からインライン関数が渡されるため、depsに含めると毎レンダー再実行される
  const latestRef = useRef({
    selectedArea: props.selectedArea,
    onChange: props.onChange,
  });
  useEffect(() => {
    latestRef.current = {
      selectedArea: props.selectedArea,
      onChange: props.onChange,
    };
  });

  useEffect(() => {
    setAreaList((prev) =>
      prev.map((it) => ({
        ...it,
        checked: isAreaChecked(it, props.selectedArea),
      })),
    );
  }, [props.selectedArea]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // エリアリストをロードします
        let letStore = props.store;
        if (props.keyword && props.keyword.length > 0) {
          // 検索条件あり
          letStore = resolveStoreForSearch(props.store, props.mapType);
        }
        const array: AreaItemType[] = await getAreaList({
          database: props.database,
          version: props.version,
          store: letStore,
          area: props.code,
          keyword: props.keyword,
        });

        if (props.mapType == "PREF") {
          const code: string[] = [];
          // `都道府県の統計`のときは、全都道府県にチェックする
          array.forEach((it) => {
            code.push(it.code);
            it.checked = true;
          });
          latestRef.current.onChange(code, true);
        } else if (props.code) {
          const children = latestRef.current.selectedArea.get(props.code);
          if (children) {
            if (children.size == 0) {
              array.forEach((it) => {
                it.checked = true;
              });
            } else {
              array.forEach((it) => {
                it.checked = children.has(it.code);
              });
            }
          } else {
            // selectedAreaが空の場合は明示的にuncheckedに設定
            array.forEach((it) => {
              it.checked = false;
            });
          }
        } else {
          array.forEach((it) => {
            it.checked = isAreaChecked(it, latestRef.current.selectedArea);
          });
        }
        setAreaList(array);
      } catch (e) {
        console.error(e);
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      setAreaList([]);
    };
  }, [
    props.database,
    props.version,
    props.store,
    props.code,
    props.mapType,
    props.keyword,
  ]);

  /**
   * 親要素にチェックすると子要素を全選択した状態になるが、リストには子要素を含まない。
   * その状態で子要素の選択状態を解除した時、その要素以外の子要素を親要素に含める。
   * 反対に子要素にチェックして全選択状態にたら、親要素のみにして子要素を削除する。
   */
  const updateSelectedArea = (item: AreaItemType) => {
    if (item.code.length > 2) {
      const prefcode = item.code.substring(0, 2);
      const target = props.selectedArea.get(prefcode);
      const size = target?.size;
      if (!item.checked) {
        if (size == 0) {
          // 親要素のみチェック状態
          areaList.forEach(
            (it) => item.code != it.code && target?.add(it.code),
          );
        }
      } else {
        if (!props.keyword && size == areaList.length - 1) {
          target?.clear();
          return true;
        }
      }
    }
  };

  /**
   * エリアリストの項目が選択（クリック）された時
   *   - 最下層項目の場合、チェックボックスを操作してチェックハンドラを処理を移譲する
   *   - 次の階層のエリアリストを表示する
   */
  const handlerSelect = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    const target = event.target as HTMLInputElement;
    if (target.type !== "checkbox") {
      event.stopPropagation();
      const item =
        areaList &&
        areaList.find(
          (it) => it.code === event.currentTarget.getAttribute("data-key"),
        );
      if (item) {
        if (props.leaf) {
          // Leaf項目の場合、チェックボックスを操作します
          item.checked = !item.checked;
          const revert = () => {
            item.checked = !item.checked;
          };
          if (updateSelectedArea(item)) {
            props.onChange([], item.checked).then((ok) => {
              if (!ok) revert();
            });
          } else {
            props.onChange([item.code], item.checked).then((ok) => {
              if (!ok) revert();
            });
          }
        } else {
          props.onSelect(item);
        }
      }
    }
  };

  const handlerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const key = event.currentTarget.getAttribute("data-key") || "";
      const item = areaList && areaList.find((it) => it.code === key);
      if (item) {
        if (props.leaf) {
          const newChecked = !item.checked;
          item.checked = newChecked;
          const revert = () => {
            item.checked = !newChecked;
          };
          if (updateSelectedArea(item)) {
            props.onChange([], newChecked).then((ok) => {
              if (!ok) revert();
            });
          } else {
            props.onChange([item.code], newChecked).then((ok) => {
              if (!ok) revert();
            });
          }
        } else {
          props.onSelect(item);
        }
      }
    }
  };

  /**
   * チェックボックスが操作（On/Off）された時
   */
  const handlerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const item =
      areaList &&
      areaList.find(
        (it) => it.code === event.currentTarget.getAttribute("data-key"),
      );
    if (item) {
      item.checked = event.target.checked;
      const revert = () => {
        item.checked = !item.checked;
      };
      if (updateSelectedArea(item)) {
        props.onChange([], item.checked).then((ok) => {
          if (!ok) revert();
        });
      } else {
        props.onChange([item.code], item.checked).then((ok) => {
          if (!ok) revert();
        });
      }
    }
  };

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
      ) : areaList.length <= 0 ? (
        <p className="mt-4 text-center font-normal text-gray-500 dark:text-gray-400 sm:text-xs">
          データは空です
        </p>
      ) : (
        areaList.map((item) => (
          <div
            key={item.code}
            className="areas items-body-content"
            role="button"
            tabIndex={0}
            onKeyDown={handlerKeyDown}
            onClick={handlerSelect}
            data-key={item.code}
          >
            {(props.mapType == "TOWN" || props.mapType == "ASAHIRU") &&
            props.store == "PREF" &&
            !props.keyword ? (
              <div></div>
            ) : (
              <Checkbox
                className="mt-1"
                onChange={handlerChange}
                data-key={item.code}
                color={"default"}
                checked={item.checked || false}
              />
            )}
            <span className="pt-1 text-gray-800 dark:text-gray-200">
              {!props.keyword ? item.name : item.fullname}
            </span>
            {!props.leaf && props.selectedArea.get(item.code) ? (
              <Badge color="gray" icon={HiCheck}>
                {props.selectedArea.get(item.code)?.size == 0
                  ? "ALL"
                  : props.selectedArea.get(item.code)?.size}
              </Badge>
            ) : (
              <div />
            )}
            {!props.leaf ? (
              <svg
                className="size-6 text-gray-800 dark:text-white"
                aria-hidden="true"
                xmlns="http:// www.w3.org/2000/svg"
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
            ) : (
              <div />
            )}
          </div>
        ))
      )}
    </>
  );
};
