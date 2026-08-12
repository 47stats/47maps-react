import { useEffect, useState } from "react";
import { Popover } from "flowbite-react";
import { HexColorPicker } from "react-colorful";
//import type { FlowbitePopoverTheme } from "flowbite-react";

// const customTheme: FlowbitePopoverTheme = {
//   "base": "absolute z-20 inline-block w-max max-w-[100vw] rounded-lg border border-gray-200 bg-white shadow-sm outline-none dark:border-gray-600 dark:bg-gray-800",
//   "content": "z-10 overflow-hidden rounded-[7px]",
//   "arrow": {
//     "base": "absolute h-2 w-2 z-0 rotate-45 mix-blend-lighten bg-gray-600 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:mix-blend-color",
//     "placement": "-4px"
//   }
// };

type ColorPickerProps = {
  color: string;
  onChange: (newColor: string) => void;
  swatchSize?: { width?: string; height?: string }; // スウォッチサイズをカスタマイズ可能
};

export const ColorPicker = (props: ColorPickerProps) => {
  const [color, setColor] = useState<string>(props.color);

  const styles = {
    color: {
      width: props.swatchSize?.width ?? "36px",
      height: props.swatchSize?.height ?? "14px",
      borderRadius: "2px",
      background: color,
    },
    swatch: {
      padding: "5px",
      background: "#fff",
      borderRadius: "1px",
      boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
      display: "inline-block",
      cursor: "pointer",
    },
  };

  useEffect(() => {
    setColor(props.color);
  }, [props.color]);

  const handlerChange = (newColor: string) => {
    props.onChange(newColor);
    setColor(newColor);
  };

  return (
    <Popover
      /*theme={customTheme}*/ content={
        <div className="w-64 text-sm text-gray-800 dark:text-gray-400">
          <div className="border-b border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              カラーピッカー
            </h3>
          </div>
          <div className="px-3 py-2">
            <HexColorPicker color={color} onChange={handlerChange} />
          </div>
        </div>
      }
      placement="auto"
    >
      <div style={styles.swatch}>
        <div style={styles.color} />
      </div>
    </Popover>
  );
};
