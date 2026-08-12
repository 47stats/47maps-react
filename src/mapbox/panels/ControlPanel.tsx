import { ColumnInfoType } from "@47stats/api";
import { SeriesPanel } from "./series/SeriesPanel";
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
  return (
    <>
      {props.store == "ASAHIRU" ? (
        <AsahiruPanel {...props} />
      ) : (
        <SeriesPanel {...props} />
      )}
    </>
  );
};
