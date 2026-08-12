import { Drawer } from "flowbite-react";
import { HiLocationMarker } from "react-icons/hi";
import { DrawerPropType } from "../base-drawer";
import { MarketTabs } from "./market-tabs";

export const MarketareaDrawer = (props: DrawerPropType) => {
  return (
    <Drawer
      backdrop={false}
      open={props.visible}
      onClose={props.handleClose}
      className="w-[300px]"
    >
      <Drawer.Header title="商圏登録" titleIcon={HiLocationMarker} />
      <Drawer.Items>
        <MarketTabs drawerVisible={props.visible} />
      </Drawer.Items>
    </Drawer>
  );
};
