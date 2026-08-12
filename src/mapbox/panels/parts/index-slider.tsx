import { useState } from "react";

export type IndexSliderProps = {
  index: number;
  min?: number;
  max: number;
  step?: number;
  onChangeIndex: (index: number) => void;
};

export const IndexSlider = (props: IndexSliderProps) => {
  const [index, setIndex] = useState<number>(props.index);

  return (
    <div className="input">
      <label className="dark:text-gray-300">時点</label>
      <input
        type="range"
        id="volume"
        name="volume"
        value={index}
        min={props.min || 0}
        max={props.max - 1}
        step={props.step || 1}
        list="markers"
        onChange={(evt) => {
          const value = parseInt(evt.target.value);
          setIndex(value);
          props && props.onChangeIndex(value);
        }}
      />
      <datalist id="markers" className="dark:text-white">
        {Array(props.max)
          .fill(0)
          .map((_, i) => (
            <option key={i} value={i} />
          ))}
      </datalist>
    </div>
  );
};
