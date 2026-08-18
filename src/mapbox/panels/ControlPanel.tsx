import { ColumnInfoType } from "@47stats/api";
import { SeriesPanel } from "./series/SeriesPanel";
import { useState } from "react";
import { AsahiruPanel } from "./asahiru/AsahiruPanel";
import "./ControlPanel.css";

export type ControlPanelProps = {
  store: string;
  column: ColumnInfoType[];
  series: number;
  opacity: number;
  onChangeSeries: (value: number) => void;
  onChangeOpacity: (value: number) => void;
  onChangeAuto: (automatic: boolean) => void;
};

export const ControlPanel = (props: ControlPanelProps) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <>
      {isVisible && props.store == "ASAHIRU" ? (
        <AsahiruPanel {...props} onClose={() => setIsVisible(false)} />
      ) : isVisible ? (
        <SeriesPanel {...props} onClose={() => setIsVisible(false)} />
      ) : (
        <button
          type="button"
          className="control-panel-toggle"
          onClick={() => setIsVisible(true)}
        >
          設定パネルを表示
        </button>
      )}
    </>
  );
};
