import React, { useRef } from "react";

export type SearchBoxProps = {
  name: string;
  onSearch?: (value: string) => void;
};

export default function SearchBox(props: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const emitSearch = (value: string) => props.onSearch && props.onSearch(value);

  return (
    <div className="ml-2 flex-1 pr-4">
      <div className="relative">
        <div className="absolute left-0 top-0 inline-flex items-center p-2">
          <svg
            className="size-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input
          type="search"
          className="h-9 w-full rounded-lg border border-none border-gray-300 py-2 pl-10 pr-4 text-base font-medium text-gray-600 shadow outline-none focus:ring-0"
          placeholder="Search..."
          name={props.name}
          ref={inputRef}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              e.preventDefault();
              emitSearch(inputRef.current?.value || "");
            }
          }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            // 入力クリア（空文字）時は検索条件を解除
            if (e.target.value === "") {
              emitSearch("");
            }
          }}
        />
      </div>
    </div>
  );
}
