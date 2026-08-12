import { Button, Dropdown } from "flowbite-react";
import { HiChevronLeft, HiChevronDown } from "react-icons/hi";
import { Flowbite } from "flowbite-react";
import type { CustomFlowbiteTheme } from "flowbite-react";

/**
 * name: string が必須です
 */
export interface IPrevious {
  name?: string;
}

const customTheme: CustomFlowbiteTheme = {
  button: {
    color: {
      primary: "text-gray-500 hover:text-gray-800",
    },
    size: {
      primary: "px-0.5 py-1 text-base",
    },
  },
};

export type PreviousProps<T> = {
  disabled?: boolean;
  previous: T[];
  onClick: () => void;
  onSelect: (item: T) => void;
};

export default function Previous<T extends IPrevious>(props: PreviousProps<T>) {
  return (
    <Flowbite theme={{ theme: customTheme }}>
      <Button
        color="gray"
        size="primary"
        className="inline-flex h-9 w-20 items-center rounded-l-md rounded-r-none border border-r-0 border-gray-300 bg-gray-100 px-0 text-sm font-normal text-gray-500 focus:ring-0 focus:ring-offset-0 enabled:hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
        aria-label="戻る"
        onClick={() => props.onClick()}
        disabled={props.disabled}
      >
        <HiChevronLeft className="mr-1 size-6" />
        戻る
      </Button>

      <Dropdown
        label=""
        renderTrigger={() => (
          <Button
            color="gray"
            size="primary"
            className="inline-flex size-9 items-center rounded-l-none rounded-r-md border border-gray-300 bg-gray-100 px-0 text-sm font-normal text-gray-500 focus:ring-0 focus:ring-offset-0 enabled:hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
            aria-label="履歴を開く"
            disabled={props.disabled}
          >
            <HiChevronDown className="mr-1 size-6" />
          </Button>
        )}
      >
        {props.previous &&
          props.previous.map((it, i) => (
            <Dropdown.Item
              key={i}
              className="text-base"
              onClick={() => props.onSelect(it)}
            >
              {it.name}
            </Dropdown.Item>
          ))}
      </Dropdown>
    </Flowbite>
  );
}
