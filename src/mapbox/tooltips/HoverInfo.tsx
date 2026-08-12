import { ColumnInfoType } from "@47stats/api";
import { Feature } from "geojson";

export type HoverInfoType = {
  feature: Feature;
  x: number;
  y: number;
};
export type HoverInfoProps = {
  hoverInfo: HoverInfoType | undefined;
  columnInfo: ColumnInfoType | undefined;
};

export const HoverInfo = (props: HoverInfoProps) => {
  const hoverInfo = props.hoverInfo;
  const columnInfo = props.columnInfo;

  let name: string = "-";
  let value: string = "-";
  if (hoverInfo && columnInfo) {
    if (hoverInfo.feature.properties) {
      name = hoverInfo.feature.properties["DNAME"];
      if (
        hoverInfo.feature.properties[columnInfo.column] &&
        hoverInfo.feature.properties[columnInfo.column] != "null"
      ) {
        value =
          hoverInfo.feature.properties[columnInfo.column].toLocaleString() +
          columnInfo.unit;
      }
    }
  }

  return (
    <>
      {hoverInfo && columnInfo && (
        <div
          className="pointer-events-none absolute z-10 m-2 max-w-xs bg-gray-800 p-1 text-sm text-white"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          <div>{name}</div>
          <div>
            {columnInfo.name}：{value}
          </div>
        </div>
      )}
    </>
  );
};
