import { useRef, useState, useContext, useEffect } from "react";
import { Flowbite, Tabs, TabsRef, CustomFlowbiteTheme } from "flowbite-react";
import { IsochroneArea, TradingArea } from "./panel";
import { ChoroplethContext } from "../../../provider";

const customTheme: CustomFlowbiteTheme = {
  tabs: {
    tablist: {
      tabitem: {
        base: "flex items-center justify-center rounded-t-lg p-4 text-sm font-medium first:ml-0 focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400 disabled:dark:text-gray-500",
      },
    },
  },
};

interface MarketTabsProps {
  onTabChange?: (tab: number) => void;
  drawerVisible: boolean;
}

export const MarketTabs = (props: MarketTabsProps) => {
  const tabsRef = useRef<TabsRef>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setIsMarketareaDrawerActive } = useContext(ChoroplethContext);

  // Drawerの表示状態をContextに反映
  useEffect(() => {
    setIsMarketareaDrawerActive(props.drawerVisible);
  }, [props.drawerVisible, setIsMarketareaDrawerActive]);

  const handleTabChange = (tab: number) => {
    setActiveTab(tab);
    if (props.onTabChange) {
      props.onTabChange(tab);
    }
  };

  return (
    <Flowbite theme={{ theme: customTheme }}>
      <Tabs
        aria-label="Tabs with underline"
        style="underline"
        ref={tabsRef}
        onActiveTabChange={handleTabChange}
      >
        <Tabs.Item active title="円商圏" className="p-3">
          <TradingArea
            drawerVisible={props.drawerVisible}
            isActive={activeTab === 0}
          />
        </Tabs.Item>

        <Tabs.Item title="到達圏" className="p-3">
          <IsochroneArea
            drawerVisible={props.drawerVisible}
            isActive={activeTab === 1}
          />
        </Tabs.Item>
      </Tabs>
    </Flowbite>
  );
};
