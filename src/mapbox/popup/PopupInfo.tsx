import { ColumnInfoType, JsonObject } from "@47stats/api";
import { SeriesPopup } from "./series/SeriesPopup";
import { AsahiruPopup } from "./asahiru/AsahiruPopup";

export type PopupInfoProps = {
  info: JsonObject;
  database: string;
  store: string;
  column: ColumnInfoType[];
  onClose: () => void;
};

export const PopupInfo = (props: PopupInfoProps) => {
  return (
    <>
      {props.store == "ASAHIRU" ? (
        <AsahiruPopup {...props} />
      ) : (
        <SeriesPopup {...props} />
      )}
    </>
  );
};
