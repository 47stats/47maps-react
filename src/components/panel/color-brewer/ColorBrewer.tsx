import { useState } from "react";
import { NumClasses, SchemeType } from "./";
import { SchemeRamps } from "./";
import type { SchemeRampType } from "./";

type ColorBrewerProps = {
  title: string;
  numClasses: number;
  schemeType: string;
  rampName: string;
  onSelectSchemeType: (newSchemeType: string) => void;
  onSelectNumClasses: (newNumClasses: number) => void;
  onSelectRamp: (
    newSchemeType: string,
    newRampName: string,
    newSchemeRamp: SchemeRampType,
  ) => void;
};

/**
 * 区分数、データ性質、Brewer Palette を表示します。
 * @see Color Brewer
 * https://colorbrewer2.org/
 * https://en.wikipedia.org/wiki/ColorBrewer
 */
export const ColorBrewer = (props: ColorBrewerProps) => {
  const [numClasses, setNumClasses] = useState<number>(props.numClasses);
  const [schemeType, setSchemeType] = useState<string>(props.schemeType);
  const [rampName, setRampName] = useState<string>(props.rampName);

  const handlerSelectNumClasses = (newNumClasses: number) => {
    setNumClasses(newNumClasses);
    props.onSelectNumClasses(newNumClasses);
  };

  const handlerSelectSchemeType = (newSchemeType: string) => {
    if (newSchemeType == "sequential") {
      if (numClasses > 9) {
        setNumClasses(9);
      }
    } else if (newSchemeType == "diverging") {
      if (numClasses > 11) {
        setNumClasses(11);
      }
    }
    setSchemeType(newSchemeType);
    props.onSelectSchemeType(newSchemeType);
  };

  const handlerSelectSchemeRamp = (
    newRampName: string,
    newSchemeRamp: SchemeRampType,
  ) => {
    setRampName(newRampName);
    props.onSelectRamp(schemeType, newRampName, newSchemeRamp);
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-t border-b bg-gray-100 p-1 dark:border-gray-600 dark:bg-gray-600 md:p-1">
        <h3 className="pl-2 text-base font-semibold text-gray-900 dark:text-white">
          {props.title}
        </h3>
      </div>

      <NumClasses
        numClasses={numClasses}
        schemeType={schemeType}
        onSelect={handlerSelectNumClasses}
      />
      <SchemeType schemeType={schemeType} onSelect={handlerSelectSchemeType} />
      <hr />
      <legend className="mx-4 my-2 text-xs">
        カラースキームを選択してください
      </legend>
      <SchemeRamps
        numClasses={numClasses}
        schemeType={schemeType}
        rampName={rampName}
        onSelect={handlerSelectSchemeRamp}
      />
    </>
  );
};
