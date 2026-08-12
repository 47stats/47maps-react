import { useState } from "react";

export type LegendSwitchProps = {
  automatic: boolean;
  onChangeAuto: (automatic: boolean) => void;
};

export const LegendSwitch = (props: LegendSwitchProps) => {
  const [automatic, setAutomatic] = useState<boolean>(props.automatic);

  return (
    <div className="input mt-4">
      <label className="text-gray-800 dark:text-gray-300">凡例</label>
      <label className="mb-5 inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only dark:border-gray-500 dark:bg-gray-500"
          onChange={(evt) => {
            setAutomatic(evt.target.checked);
            props && props.onChangeAuto(evt.target.checked);
          }}
          checked={automatic}
        />
        <div className="peer relative h-5 w-9 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:size-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800 rtl:peer-checked:after:-translate-x-full"></div>
        <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          自動更新
        </span>
      </label>
    </div>
  );
};
