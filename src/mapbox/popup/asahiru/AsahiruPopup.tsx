import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
  Legend,
} from "recharts";
import type { Payload } from "recharts/types/component/DefaultLegendContent";
import { Popup } from "react-map-gl/mapbox";
import { Spinner } from "flowbite-react";
import {
  ColumnKindType,
  getColumnKindList,
  ColumnInfoType,
  getColumnList,
  Json,
  getDatalistList,
} from "@47stats/api";
import { PopupInfoProps } from "../";

import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

type ColumnKindExType = ColumnKindType & {
  columns?: string[];
  values?: Json;
};

const colors = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
  "#a4de6c",
  "#d0ed57",
];

type BarPropsType = {
  [key: string]: boolean | string | null;
  hover: string | null;
};

export const AsahiruPopup = (props: PopupInfoProps) => {
  const [data, setData] = useState<Json[]>();
  const [title, setTitle] = useState<string>("");
  const [barPros, setBarPros] = useState<BarPropsType>({ hover: null });
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 依存配列の最適化: infoオブジェクト全体ではなく必要な値のみを抽出
  const cx = props.info.cx;
  const cy = props.info.cy;
  const lng = props.info.lng;
  const lat = props.info.lat;
  const dname = props.info.DNAME;
  const hasInfo = Object.keys(props.info).length > 0;

  useEffect(() => {
    if (!hasInfo) {
      return;
    }
    if (props.store !== "ASAHIRU") {
      throw new Error("ASAHIRU store only");
    }
    if (!props.column[0]) {
      console.error("No column data available");
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 列種別のカタログリストを取得
        const keyword = props.column[0]?.name.substring(0, 2);
        const resultKind: ColumnKindType[] = await getColumnKindList({
          database: props.database,
          store: props.store,
          keyword: keyword,
        });
        const regex = new RegExp(
          `${props.column[0]?.kind.substring(0, 1)}._..${props.column[0]?.kind.substring(5)}`,
        );
        const kindList: ColumnKindExType[] = resultKind.filter((it) =>
          it.kind.match(regex),
        );

        // 列種別別に列カタログリストを取得（Promise.allで並列実行）
        await Promise.all(
          kindList.map(async (it) => {
            const result: ColumnInfoType[] = await getColumnList({
              database: props.database,
              store: props.store,
              kind: it.kind,
            });
            it.columns = [];
            result.forEach((r) => it.columns!.push(r.column));
          }),
        );

        // 取得した列種別と列カタログを使用してデータリストを取得（Promise.allで並列実行）
        await Promise.all(
          kindList.map(async (it) => {
            const dataList: Json[] = await getDatalistList({
              database: props.database,
              store: props.store,
              column: it.columns!,
              point: JSON.stringify({
                type: "Point" as const,
                coordinates: [Number(cx), Number(cy)],
              }),
              format: "geojson",
            });
            it.values = dataList[0];
          }),
        );

        const array: Json[] = [];
        props.column.forEach((it, i) => {
          const d: Json = {
            name: it.desc.match(/[+-]?\d+[時]?/gm)?.join("") || "",
            unit: it.unit,
            desc: it.desc,
          };
          kindList.forEach((kt) => {
            const columnKey = kt.columns?.[i];
            if (
              columnKey &&
              kt.values &&
              typeof kt.values === "object" &&
              !Array.isArray(kt.values)
            ) {
              const values = kt.values as Record<string, unknown>;
              const value = values[columnKey];
              d[kt.name.substring(8)] = Number(value) || 0;
            }
          });
          array.push(d);

          const obj: BarPropsType = { hover: null };
          Object.keys(d)
            .filter((key) => key !== "desc" && key !== "name" && key !== "unit")
            .map((key) => {
              obj[key] = false;
            });
          obj.hover = null;
          setBarPros(obj);
        });

        if (!cancelled) {
          setData(array);
          setTitle(`${dname}`);
        }
      } catch (error) {
        if (!cancelled) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "データの取得に失敗しました";
          console.error("Failed to load ASAHIRU popup data:", error);
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      setData([]);
    };
  }, [props.database, props.store, cx, cy, dname, hasInfo, props.column]);

  const CustomTooltip = useCallback(
    ({ active, payload }: TooltipProps<ValueType, NameType>) => {
      if (active && payload && payload.length) {
        return (
          <div className="z-20 m-2 max-w-xs border border-gray-300 bg-gray-50 p-1 text-sm text-black opacity-80">
            <p className="text-black">{payload[0].payload.desc}</p>
            <ul>
              {payload.map((it, index) => (
                <li
                  key={index}
                  className="text-black"
                  style={{ color: it.color }}
                >
                  {`${it.name}: ${it.value?.toLocaleString()} (${it.payload.unit})`}
                </li>
              ))}
            </ul>
          </div>
        );
      }
      return null;
    },
    [],
  );

  const onClick = (data: Payload) => {
    const dataKey =
      typeof data.dataKey === "string" ? data.dataKey : String(data.dataKey);
    if (!dataKey) return;

    if (
      Object.entries(barPros).filter(([key, value]) => {
        // 1. キーが "hover" で**ない**ことを確認
        const isNotHover = key !== "hover";

        // 2. 値がブール値の false と**厳密に**等しいことを確認
        const isFalseValue = value === false;

        // 両方の条件を満たす要素だけをフィルタリング
        return isNotHover && isFalseValue;
      }).length <= 1 &&
      barPros[dataKey] === false
    ) {
      // 最後の1つを非表示にしようとした場合は無視
      return;
    }
    setBarPros({ ...barPros, [dataKey]: !barPros[dataKey], hover: null });
  };
  const onMouseOver = (data: Payload) => {
    const dataKey =
      typeof data.dataKey === "string" ? data.dataKey : String(data.dataKey);
    if (!dataKey) return;

    if (!barPros[dataKey]) {
      setBarPros({ ...barPros, hover: dataKey });
    }
  };
  const onMouseOut = () => {
    setBarPros({ ...barPros, hover: null });
  };
  return (
    <>
      {hasInfo && (
        <Popup
          className="z-20 w-auto text-2xl"
          closeOnClick={false}
          maxWidth="384px"
          anchor="bottom"
          longitude={Number(lng)}
          latitude={Number(lat)}
          onClose={() => {
            props.onClose();
          }}
        >
          <h1 className="text-lg text-cyan-800 dark:text-cyan-400">{title}</h1>
          {error ? (
            <div className="flex h-[250px] w-[350px] items-center justify-center">
              <p className="text-center text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex h-[250px] w-[350px] items-center justify-center">
              <p className="mt-4 text-center font-normal text-gray-500 dark:text-gray-400 sm:text-xs">
                <Spinner aria-label="データを取得中" size="sm" />{" "}
                データを取得中・・・
              </p>
            </div>
          ) : (
            <LineChart
              width={350}
              height={250}
              data={data}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis tick={{ fontSize: 10 }} dataKey="name" />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip
                wrapperStyle={{ fontSize: "12px" }}
                content={<CustomTooltip />}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                onClick={onClick}
                onMouseOver={onMouseOver}
                onMouseOut={onMouseOut}
              />
              {data &&
                data[0] &&
                Object.keys(data[0])
                  .filter(
                    (key) => key !== "name" && key !== "unit" && key !== "desc",
                  )
                  .map((key, index) => (
                    <Line
                      key={index}
                      type="monotone"
                      dataKey={key}
                      stroke={colors[index % colors.length]}
                      hide={barPros[key] === true}
                      strokeWidth={Number(
                        barPros.hover !== key || !barPros.hover ? 1 : 3,
                      )}
                    />
                  ))}
            </LineChart>
          )}
        </Popup>
      )}
    </>
  );
};
