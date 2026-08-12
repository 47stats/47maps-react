import { useState } from "react";
import colorbrewer from "../../../utils/colorbrewer";

export type SchemeRampType = {
  [n: number]: string[];
};

type SchemeRampProps = {
  numClasses: number;
  schemeType: string;
  rampName: string;
  onSelect: (newRampName: string, newSchemeRamp: SchemeRampType) => void;
};

/**
 * カラースキームを選択するための Brewer Palette を提供します。
 */
export const SchemeRamps = (props: SchemeRampProps) => {
  const [active, setActive] = useState<string>(props.rampName);

  const schemeName = colorbrewer.schemeGroups[props.schemeType];
  const single = colorbrewer.schemeGroups["singlehue"];

  const handlerClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    const rampName = event.currentTarget.getAttribute("data-scheme-ramp");
    if (rampName) {
      setActive(rampName);
      props.onSelect(rampName, colorbrewer[rampName]);
    }
  };

  const renderSchemes = (rampName: string, i: number) => {
    if (!colorbrewer[rampName][props.numClasses]) {
      return "";
    }
    return (
      <div
        key={i}
        className={`float-left cursor-pointer border ${active == rampName ? "border-cyan-600 dark:border-cyan-200" : "border-gray-100 dark:border-gray-600"} px-1 py-2 hover:bg-gray-300`}
        data-scheme-ramp={rampName}
        onClick={handlerClick}
      >
        <svg width="15" height="75">
          {colorbrewer[rampName][5].map((rgb: string, j: number) => {
            return (
              <rect
                key={i * 1000 + j}
                fill={rgb}
                width="15"
                height="15"
                y={j * 15}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <>
      <div
        className={`float-left mx-1 h-64 ${props.schemeType == "sequential" ? "w-48" : "w-64"} overflow-hidden`}
      >
        {props.schemeType == "sequential" ? (
          <label className="ml-3 inline">Multi hue:</label>
        ) : (
          ""
        )}

        <div className="inline-block p-1">{schemeName.map(renderSchemes)}</div>
      </div>

      {props.schemeType == "sequential" ? (
        <div className="float-left mx-1 w-24 border-l border-solid border-gray-300">
          <label className="ml-3">Single hue:</label>
          <div className="inline-block p-1">{single.map(renderSchemes)}</div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};
