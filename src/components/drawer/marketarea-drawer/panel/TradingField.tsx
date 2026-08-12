import { useState, useId, useEffect, useCallback, useContext } from "react";
import { Button, Dropdown } from "flowbite-react";
import { ColorPicker } from "../../../ui/color-picker";
import { HiCheck, HiOutlineLightBulb } from "react-icons/hi";
import { MarketareaContext } from "../../../../contexts";
import tradingAreaMenu from "../../../../assets/tradingarea-menu.json";

export type TradingItemType = {
  name: string;
  description: string;
  icon: string; //react-icons/fa6
  meterRadius: number;
  minutesRadius: number[]; //徒歩、自転車、車
};

export type TradingFieldProps = {
  travelMode?: "walking" | "cycling" | "driving";
  contourType?: "minutes" | "meters";
  color?: string;
  inputId?: string;
};

const getRangeFromMenu = (
  item: TradingItemType,
  travelMode?: TradingFieldProps["travelMode"],
  contourType?: TradingFieldProps["contourType"],
) => {
  if (contourType !== "minutes") {
    return item.meterRadius;
  }

  const travelModeIndex =
    travelMode === "walking" ? 0 : travelMode === "cycling" ? 1 : 2;
  return item.minutesRadius[travelModeIndex];
};

const clampRange = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const TradingField = (props?: TradingFieldProps) => {
  const {
    tradingSettings,
    setTradingSettings,
    isochroneSettings,
    setIsochroneSettings,
  } = useContext(MarketareaContext);
  const [menuList, setMenuList] = useState<TradingItemType[]>();
  const [disabled, setDisabled] = useState<boolean>(false);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState<number | null>(
    null,
  );
  const generatedId = useId();
  const numberInputId = props?.inputId || generatedId;

  // 到達圏モードかどうか
  const isIsochroneMode = props?.contourType !== undefined;

  const updateRange = useCallback(
    (value: number) => {
      if (isIsochroneMode && props?.contourType) {
        setIsochroneSettings({
          ...isochroneSettings,
          range: value,
          ranges: {
            ...isochroneSettings.ranges,
            [props.contourType]: value,
          },
        });
      } else {
        setTradingSettings({ ...tradingSettings, radius: value });
      }
    },
    [
      isIsochroneMode,
      isochroneSettings,
      props?.contourType,
      setIsochroneSettings,
      tradingSettings,
      setTradingSettings,
    ],
  );

  useEffect(() => {
    // パッケージ内の静的JSONを直接利用（フェッチ不要）
    try {
      setMenuList(tradingAreaMenu as TradingItemType[]);
    } catch (err) {
      console.error(err);
      setMenuList([]);
      setDisabled(true);
    }
  }, []);

  const onSelect = useCallback(
    (item: TradingItemType, index: number) => {
      const numberInput = document.getElementById(
        numberInputId,
      ) as HTMLInputElement;
      const newRadius = getRangeFromMenu(
        item,
        props?.travelMode,
        props?.contourType,
      );

      setSelectedMenuIndex(index);
      if (numberInput) {
        numberInput.value = newRadius.toString();
      }

      updateRange(newRadius);
    },
    [numberInputId, props?.contourType, props?.travelMode, updateRange],
  );

  const getInputConstraints = () => {
    if (props?.contourType === "minutes") {
      return { min: 1, max: 60 };
    }
    return { min: 100, max: 8000 };
  };

  const { min: minRange, max: maxRange } = getInputConstraints();

  useEffect(() => {
    const currentRange =
      isIsochroneMode && props?.contourType
        ? isochroneSettings.ranges[props.contourType]
        : tradingSettings.radius;
    const clampedRange = clampRange(currentRange, minRange, maxRange);

    const numberInput = document.getElementById(
      numberInputId,
    ) as HTMLInputElement | null;

    if (numberInput && numberInput.valueAsNumber !== clampedRange) {
      numberInput.value = String(clampedRange);
    }

    if (currentRange !== clampedRange) {
      updateRange(clampedRange);
    }
  }, [
    isIsochroneMode,
    isochroneSettings.ranges,
    maxRange,
    minRange,
    numberInputId,
    props?.contourType,
    tradingSettings.radius,
    updateRange,
  ]);

  useEffect(() => {
    if (selectedMenuIndex === null) return;

    const selectedItem = menuList?.[selectedMenuIndex];
    if (!selectedItem) return;

    const numberInput = document.getElementById(
      numberInputId,
    ) as HTMLInputElement | null;
    if (!numberInput) return;

    const value = getRangeFromMenu(
      selectedItem,
      props?.travelMode,
      props?.contourType,
    );
    const currentRange = isIsochroneMode
      ? isochroneSettings.ranges[props?.contourType ?? "meters"]
      : tradingSettings.radius;
    if (numberInput.valueAsNumber === value && currentRange === value) return;

    numberInput.value = String(value);
    updateRange(value);
  }, [
    isIsochroneMode,
    isochroneSettings.ranges,
    menuList,
    numberInputId,
    props?.contourType,
    props?.travelMode,
    selectedMenuIndex,
    tradingSettings.radius,
    updateRange,
  ]);

  return (
    <>
      <div className="flex rounded shadow-sm">
        <Dropdown
          label=""
          renderTrigger={() => (
            <Button
              className="inline-flex items-center rounded-l-md rounded-r-none border border-r-0 border-gray-300 bg-gray-100 px-0 text-sm text-gray-500 focus:ring-0 focus:ring-offset-0 enabled:hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
              aria-label="商圏メニューを開く"
              disabled={disabled}
            >
              <HiOutlineLightBulb />
            </Button>
          )}
        >
          {menuList &&
            menuList.map((it, i) => (
              <Dropdown.Item
                key={i}
                aria-checked={selectedMenuIndex === i}
                className="text-base"
                onClick={() => onSelect(it, i)}
                role="menuitemradio"
              >
                <HiCheck
                  aria-hidden="true"
                  className={`mr-2 size-4 ${selectedMenuIndex === i ? "visible" : "invisible"}`}
                />
                {it.name}
              </Dropdown.Item>
            ))}
        </Dropdown>
        <input
          type="number"
          id={numberInputId}
          min={minRange}
          max={maxRange}
          defaultValue={
            isIsochroneMode && props?.contourType
              ? isochroneSettings.ranges[props.contourType]
              : tradingSettings.radius
          }
          onChange={(e) => {
            setSelectedMenuIndex(null);
            const value = e.currentTarget.valueAsNumber;
            if (
              Number.isFinite(value) &&
              value >= minRange &&
              value <= maxRange
            ) {
              updateRange(value);
            }
          }}
          onBlur={(e) => {
            const inputValue = e.currentTarget.valueAsNumber;
            const value = Number.isFinite(inputValue)
              ? clampRange(inputValue, minRange, maxRange)
              : minRange;

            e.currentTarget.value = String(value);
            updateRange(value);
          }}
          className="block w-full rounded-none rounded-r-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
          placeholder="500 m"
          required
        />
      </div>
      <div className="flex items-center">
        <ColorPicker
          color={
            isIsochroneMode ? isochroneSettings.color : tradingSettings.color
          }
          onChange={(color) => {
            if (isIsochroneMode) {
              setIsochroneSettings({ ...isochroneSettings, color });
            } else {
              setTradingSettings({ ...tradingSettings, color });
            }
          }}
          swatchSize={{ width: "50px", height: "22px" }}
        />
      </div>
    </>
  );
};
