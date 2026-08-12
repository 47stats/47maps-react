import { CSSProperties } from "react";
import { Button } from "flowbite-react";
import { HiLocationMarker } from "react-icons/hi";
import { BaseType } from "@47stats/api";
import { MarketAreaChecklist } from "../../marketarea-drawer";
import { useWindowSize } from "../../../../hooks";

export type AsahiruAreaProps = BaseType & {
  mapType: string;
  onMarketareaOpen?: () => void;
};

export const AsahiruArea = (props: AsahiruAreaProps) => {
  // ウインドウリサイズ
  const [, height] = useWindowSize();
  const style: CSSProperties = {
    height: `${height - 340}px`,
  };

  return (
    <>
      <p className="pb-2 text-gray-500 dark:text-gray-50">
        あさひる統計の階級図は、まず商圏を登録してください。
        <br />
      </p>

      <div className="grid grid-cols-1 gap-2 pl-5 md:grid-cols-2">
        <Button
          className="inline-flex w-32 items-center"
          onClick={props.onMarketareaOpen}
        >
          <HiLocationMarker className="mr-2 size-5" />
          商圏登録
        </Button>
      </div>

      <div className="mt-4 overflow-y-auto p-4" style={style}>
        <MarketAreaChecklist />
      </div>
    </>
  );
};
