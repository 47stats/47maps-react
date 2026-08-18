import { ColumnInfoType } from "@47stats/api";
import { OpacitySlider, LegendSwitch, IndexSlider } from "../parts";
import { getMonthString } from "../../utils";
import "../ControlPanel.css";

export type SeriesPanelProps = {
  column: ColumnInfoType[];
  series: number;
  opacity: number;
  onChangeSeries: (value: number) => void;
  onChangeOpacity: (value: number) => void;
  onChangeAuto: (automatic: boolean) => void;
  onClose: () => void;
};

export const SeriesPanel = (props: SeriesPanelProps) => {
  const column: ColumnInfoType[] = [];
  column.push(...props.column);
  column.reverse();

  const handerChangeIndex = (index: number) => {
    props.onChangeSeries(column[index].date1);
  };

  const item = column[0];
  return (
    <div className="control-panel  dark:bg-gray-700">
      <button
        type="button"
        className="control-panel-close"
        aria-label="設定パネルを閉じる"
        onClick={props.onClose}
      >
        &times;
      </button>
      <h1 className="text-cyan-800 dark:text-cyan-400">
        {item.name} ({item.unit})
      </h1>
      <h3 className="text-cyan-800 dark:text-cyan-400">
        {getMonthString(props.series)}
      </h3>
      <p className="text-gray-700 dark:bg-gray-700 dark:text-gray-300">
        {item.desc}
      </p>

      {column.length > 1 ? (
        <>
          <hr className="my-8 h-px border-0 bg-gray-200 dark:bg-gray-600" />
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

      <hr className="my-8 h-px border-0 bg-gray-200 dark:bg-gray-600" />
      <OpacitySlider
        opacity={props.opacity}
        onChangeOpacity={props.onChangeOpacity}
      />
    </div>
  );
};
