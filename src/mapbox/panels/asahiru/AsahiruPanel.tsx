import { useState } from "react";
import { ColumnInfoType } from "@47stats/api";
import { OpacitySlider, LegendSwitch, IndexSlider } from "../parts";
import "../ControlPanel.css";

export type AsahiruPanelProps = {
  store: string;
  column: ColumnInfoType[];
  series: number;
  opacity: number;
  onChangeSeries: (value: number) => void;
  onChangeOpacity: (value: number) => void;
  onChangeAuto: (automatic: boolean) => void;
  onClose: () => void;
};

export const AsahiruPanel = (props: AsahiruPanelProps) => {
  const [colIndex, setColIndex] = useState<number>(-1);

  const column: ColumnInfoType[] = [];
  column.push(...props.column);

  const handerChangeIndex = (index: number) => {
    setColIndex(index);
    props.onChangeSeries(column[index].date1);
  };

  const item = column[colIndex !== -1 ? colIndex : column.length - 1];
  return (
    <div className="control-panel">
      <button
        type="button"
        className="control-panel-close"
        aria-label="設定パネルを閉じる"
        onClick={props.onClose}
      >
        &times;
      </button>
      <h1>
        {item.name} ({item.unit})
      </h1>
      <h3>{item.desc}</h3>
      <p> </p>

      {column.length > 1 ? (
        <>
          <hr className="my-8 h-px border-0 bg-gray-200 dark:bg-gray-700" />
          <IndexSlider
            index={column.length - 1}
            max={column.length}
            onChangeIndex={handerChangeIndex}
          />
          <LegendSwitch automatic={false} onChangeAuto={props.onChangeAuto} />
        </>
      ) : (
        <></>
      )}

      <hr className="my-8 h-px border-0 bg-gray-200 dark:bg-gray-700" />

      <OpacitySlider
        opacity={props.opacity}
        onChangeOpacity={props.onChangeOpacity}
      />
    </div>
  );
};
