import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
} from "recharts";
import { Popup } from "react-map-gl/mapbox";
import { getMonthString } from "../utils";
import { ColumnInfoType, JsonObject } from "@47stats/api";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

type PopupInfoProps = {
  info: JsonObject;
  store: string;
  column: ColumnInfoType[];
  onClose: () => void;
};

type DataType = {
  name: string;
  unit: string;
  desc: string;
  value: number;
};

export const PopupInfo = (props: PopupInfoProps) => {
  const [data, setData] = useState<DataType[]>();
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    const array: DataType[] = [];
    if (Object.keys(props.info).length !== 0) {
      if (props.store == "ASAHIRU") {
        props.column.forEach((it) => {
          array.push({
            name: it.desc.match(/[+-]?\d+[時]?/gm)?.join("") || "",
            unit: it.unit,
            desc: it.desc,
            value: Number(props.info[it.column]),
          });
        });
        setData(array);
      } else {
        props.column.forEach((it) => {
          const month = getMonthString(it.date1);
          array.push({
            name: month,
            unit: it.unit,
            desc: `${it.name} ${month}`,
            value: Number(props.info[it.column]),
          });
        });
        setData(array.reverse());
      }
      setTitle(`${props.info["DNAME"]}`);
    }

    return () => {
      setData([]);
    };
  }, [props.column, props.store, props.info]);

  const CustomTooltip = useCallback(
    ({ active, payload }: TooltipProps<ValueType, NameType>) => {
      if (active && payload && payload.length) {
        const target = payload[0];
        return (
          <div className="z-20 m-2 max-w-xs border border-gray-300 bg-gray-50 p-1 text-sm text-black opacity-80">
            <p className="text-black">{target.payload.desc}</p>
            <p className="text-right text-black">{`${target.value?.toLocaleString()} (${target.payload.unit})`}</p>
          </div>
        );
      }
    },
    [],
  );

  return (
    <>
      {Object.keys(props.info).length !== 0 && (
        <Popup
          className="z-20 w-96 text-2xl"
          closeOnClick={false}
          maxWidth="384px"
          anchor="bottom"
          longitude={Number(props.info.lng)}
          latitude={Number(props.info.lat)}
          onClose={() => {
            props.onClose();
          }}
        >
          <h1 className="text-lg text-cyan-800 dark:text-cyan-400">{title}</h1>
          <LineChart
            width={300}
            height={200}
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
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </Popup>
      )}
    </>
  );
};
