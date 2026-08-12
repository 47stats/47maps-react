import { useState, useEffect } from "react";
import { ColumnInfoType } from "@47stats/api";

export type SeriesSliderProps = {
  series: number;
  column: ColumnInfoType[];
  onChangeSeries: (value: number) => void;
};

export const SeriesSlider = (props: SeriesSliderProps) => {
  const [series, setSeries] = useState<number>(props.series);

  useEffect(() => {
    setSeries(props.series);
  }, [props.series]);

  const min = props.column[0].date1;
  const max = props.column[props.column.length - 1].date1;
  const step = Math.abs(props.column[1].date1 - props.column[0].date1);

  return (
    <div className="input">
      <label>時点</label>
      <input
        type="range"
        id="volume"
        name="volume"
        value={series}
        min={min}
        max={max}
        step={step}
        list="markers"
        onChange={(evt) => {
          const value = parseInt(evt.target.value);
          setSeries(value);
          props && props.onChangeSeries(value);
        }}
      />
      <datalist id="markers">
        {props.column.map((it) => (
          <option key={it.date1} value={it.date1} />
        ))}
      </datalist>
    </div>
  );
};
