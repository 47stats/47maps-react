import { useCallback, useEffect, useRef, useState } from "react";
import { Flowbite } from "flowbite-react";
import { ChoroplethDrawer, MarketareaDrawer, SettingsDrawer } from "../drawer";
import { Optionsfield, OptionType } from "../ui/options-field";
import type { CustomFlowbiteTheme } from "flowbite-react";
import {
  CHOROPLETH_ONBOARDING_KEY,
  RESTART_CHOROPLETH_ONBOARDING_EVENT,
} from "./onboarding";

const options = Array<OptionType>(
  {
    name: "階級図を見る",
    description: "コロプレスマップを表示します",
    property: "choroplethmap",
  },
  {
    name: "商圏登録",
    description: "商圏を登録します",
    property: "marketarea",
  },
  {
    name: "設定",
    description: "アプリケーションを設定します",
    property: "settings",
  },
);

const customTheme: CustomFlowbiteTheme = {
  drawer: {
    root: {
      base: "fixed z-40 overflow-y-hidden bg-white p-4 transition-transform dark:bg-gray-800",
    },
  },
};

export const NavTool = () => {
  const [active, setActive] = useState<string>("");
  const [visible, setVisible] = useState<number>(0);
  const [isChoroplethHintVisible, setIsChoroplethHintVisible] =
    useState<boolean>(false);
  const [isChoroplethTooltipVisible, setIsChoroplethTooltipVisible] =
    useState<boolean>(false);
  const onboardingTimersRef = useRef<number[]>([]);

  const clearOnboardingTimers = useCallback(() => {
    onboardingTimersRef.current.forEach((timerId) =>
      window.clearTimeout(timerId),
    );
    onboardingTimersRef.current = [];
  }, []);

  const finishOnboarding = useCallback(
    (markAsSeen: boolean) => {
      clearOnboardingTimers();
      setIsChoroplethHintVisible(false);
      setIsChoroplethTooltipVisible(false);

      if (markAsSeen) {
        localStorage.setItem(CHOROPLETH_ONBOARDING_KEY, "seen");
      }
    },
    [clearOnboardingTimers],
  );

  const changeState = (i: number) => {
    finishOnboarding(true);
    setVisible(i + 1);
    setActive(options[i].property);
  };

  function onHide() {
    finishOnboarding(true);
    setVisible(0);
    setActive("");
  }

  const startChoroplethOnboarding = useCallback(
    (force: boolean) => {
      if (
        !force &&
        localStorage.getItem(CHOROPLETH_ONBOARDING_KEY) === "seen"
      ) {
        return;
      }

      clearOnboardingTimers();
      setVisible(0);
      setActive("");
      setIsChoroplethTooltipVisible(true);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setIsChoroplethTooltipVisible(false);
        localStorage.setItem(CHOROPLETH_ONBOARDING_KEY, "seen");
        setVisible(1);
        setActive(options[0].property);
        return;
      }

      const blinkStates = [true, false, true, false, true, false];

      blinkStates.forEach((isVisible, index) => {
        const timerId = window.setTimeout(
          () => {
            setIsChoroplethHintVisible(isVisible);
          },
          280 * (index + 1),
        );
        onboardingTimersRef.current.push(timerId);
      });

      const openTimerId = window.setTimeout(
        () => {
          finishOnboarding(true);
          setVisible(1);
          setActive(options[0].property);
        },
        280 * (blinkStates.length + 1),
      );
      onboardingTimersRef.current.push(openTimerId);
    },
    [clearOnboardingTimers, finishOnboarding],
  );

  useEffect(() => {
    startChoroplethOnboarding(false);

    const restartOnboarding = () => {
      localStorage.removeItem(CHOROPLETH_ONBOARDING_KEY);
      startChoroplethOnboarding(true);
    };

    window.addEventListener(
      RESTART_CHOROPLETH_ONBOARDING_EVENT,
      restartOnboarding,
    );

    return () => {
      window.removeEventListener(
        RESTART_CHOROPLETH_ONBOARDING_EVENT,
        restartOnboarding,
      );
      finishOnboarding(false);
    };
  }, [finishOnboarding, startChoroplethOnboarding]);

  return (
    <>
      <Flowbite theme={{ theme: customTheme }}>
        <ChoroplethDrawer
          visible={visible == 1}
          handleClose={onHide}
          onMarketareaOpen={() => changeState(1)}
        />
        <MarketareaDrawer visible={visible == 2} handleClose={onHide} />
        <SettingsDrawer visible={visible == 3} handleClose={onHide} />
      </Flowbite>
      {isChoroplethTooltipVisible && (
        <div
          className="pointer-events-none absolute z-10 max-w-56 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 shadow-lg ring-1 ring-amber-200"
          style={{ top: "58px", left: "12px" }}
          role="status"
          aria-live="polite"
        >
          最初は「階級図を見る」を開いて、表示したい統計と地域を選びます。
        </div>
      )}
      <Optionsfield
        options={options}
        property={active}
        changeState={changeState}
        getOptionStyle={(option) =>
          option.property === "choroplethmap" && isChoroplethHintVisible
            ? {
                backgroundColor: "#fef3c7",
                color: "#92400e",
                boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.35)",
                transform: "scale(1.04)",
                transition:
                  "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, color 160ms ease",
              }
            : undefined
        }
        shadow={true}
        style={{ top: "12px", left: "12px" }}
      />
    </>
  );
};
