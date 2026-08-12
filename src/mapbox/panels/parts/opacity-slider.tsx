import { useState, useEffect } from "react";

export type OpacitySliderProps = {
  opacity: number;
  onChangeOpacity: (value: number) => void;
};

export const OpacitySlider = (props: OpacitySliderProps) => {
  const [opacity, setOpacity] = useState<number>(props.opacity);

  useEffect(() => {
    setOpacity(props.opacity);
  }, [props.opacity]);

  return (
    <>
      <div className="input mt-4">
        <label className="dark:text-gray-300">不透明度</label>
        <input
          type="range"
          id="opacity"
          name="opacity"
          value={opacity}
          min={0}
          max={100}
          step={0}
          onChange={(evt) => {
            const value = parseInt(evt.target.value);
            setOpacity(value);
            props && props.onChangeOpacity(value);
          }}
        />
      </div>
      <div className="input">
        <label className="indent-4 text-xs dark:text-gray-300">
          Layer opacity: <span id="slider-value">{opacity}%</span>
        </label>
      </div>
    </>
  );
};
