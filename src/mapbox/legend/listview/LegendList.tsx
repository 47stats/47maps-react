import { useState, useEffect, useRef } from "react";
import { ColorPicker } from "../../../components/ui/color-picker";
import type { LegendType } from "../Legend";

type StepButtonProps = {
  idx: number;
  delta: number;
  onStep: (idx: number, delta: number) => void;
};

type NumberInputProps = {
  idx: number;
  value: number;
  onCommit: (idx: number, value: number) => number;
};

type LegendListProps = {
  legend: LegendType[];
  onChange: (legend: LegendType[]) => void;
};

// 長押しで連続増減するボタン。LegendListの外で定義しないと
// 再レンダーのたびに再マウントされ、長押し中のタイマーが迷子になる
const StepButton = ({ idx, delta, onStep }: StepButtonProps) => {
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const repeatedRef = useRef<boolean>(false);
  // 連続増減中も最新のlegendを参照するため、onStepはrefで持つ
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  const clearTimers = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const onGlobalUp = () => {
    clearTimers();
    repeatedRef.current = false;
    window.removeEventListener("mouseup", onGlobalUp);
    window.removeEventListener("touchend", onGlobalUp);
    window.removeEventListener("mouseleave", onGlobalUp);
  };

  const startRepeat = () => {
    repeatedRef.current = true;
    intervalRef.current = window.setInterval(
      () => onStepRef.current(idx, delta),
      100,
    );
  };

  const startPress = () => {
    timeoutRef.current = window.setTimeout(startRepeat, 400);
    window.addEventListener("mouseup", onGlobalUp, { once: true });
    window.addEventListener("touchend", onGlobalUp, { once: true });
    window.addEventListener("mouseleave", onGlobalUp, { once: true });
  };

  const endPress = () => {
    clearTimers();
    // clickハンドラが処理されるまでrepeatedRefをtrueのまま維持する
    setTimeout(() => {
      repeatedRef.current = false;
    }, 0);
    window.removeEventListener("mouseup", onGlobalUp);
    window.removeEventListener("touchend", onGlobalUp);
    window.removeEventListener("mouseleave", onGlobalUp);
  };

  const isDecrement = delta < 0;
  return (
    <button
      type="button"
      id={`${isDecrement ? "decrement" : "increment"}-button-${idx}`}
      className={`h-8 border border-gray-300 bg-gray-100 px-3 py-1 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 ${isDecrement ? "rounded-s-lg" : "rounded-e-lg"}`}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        startPress();
      }}
      onMouseUp={endPress}
      onMouseLeave={() => {
        clearTimers();
        repeatedRef.current = false;
        window.removeEventListener("mouseup", onGlobalUp);
        window.removeEventListener("touchend", onGlobalUp);
        window.removeEventListener("mouseleave", onGlobalUp);
      }}
      onTouchStart={(event) => {
        event.preventDefault();
        startPress();
      }}
      onTouchEnd={endPress}
      onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        if (repeatedRef.current) {
          event.preventDefault();
          return;
        }
        onStep(idx, delta);
      }}
    >
      {isDecrement ? (
        <svg
          className="size-2 text-gray-900 dark:text-white"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 18 2"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M1 1h16"
          />
        </svg>
      ) : (
        <svg
          className="size-2 text-gray-900 dark:text-white"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 18 18"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 1v16M1 9h16"
          />
        </svg>
      )}
    </button>
  );
};

// 入力中はローカルのdraftに溜めて、blur / Enterで確定する。
// LegendListの外で定義しないと、確定のたびに再マウントされフォーカスが外れる
const NumberInput = ({ idx, value, onCommit }: NumberInputProps) => {
  const [draft, setDraft] = useState<string>(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const cleaned = draft.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    if (cleaned === "" || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    // 制約で拒否された場合も、実際に適用された値を表示に反映する
    const applied = onCommit(idx, parsed);
    setDraft(String(applied));
  };

  return (
    <input
      type="text"
      id={`quantity-input-${idx}`}
      inputMode="numeric"
      aria-describedby="helper-text-explanation"
      className="block h-8 w-full border-x-0 border-gray-300 bg-gray-50 py-2.5 text-center text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
      placeholder="0"
      value={draft}
      required
      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
        setDraft(event.target.value)
      }
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
    />
  );
};

//React-Color
//https://casesandberg.github.io/react-color/
export const LegendList = ({ legend, onChange }: LegendListProps) => {
  // idx番目の開始値をvalueに変更する。隣接クラスとの整合性を保ち、
  // 適用できない場合は変更せず、実際に適用された開始値を返す
  const commitMin = (idx: number, value: number): number => {
    const next = legend.map((it) => ({ ...it }));
    if (idx < next.length - 1) {
      if (value < next[idx + 1].min) {
        return next[idx].min;
      } else if (value < next[idx + 1].max) {
        next[idx + 1].max = value;
      }
    }
    if (idx > 0) {
      if (value > next[idx - 1].max) {
        return next[idx].min;
      }
      if (value > next[idx - 1].min) {
        next[idx - 1].min = value;
      }
    }
    next[idx].min = value;
    if (value > next[idx].max) {
      next[idx].max = value;
    }
    if (idx < next.length - 1) {
      next[idx + 1].max = value;
    }
    onChange(next);
    return value;
  };

  const changeBy = (idx: number, delta: number) => {
    commitMin(idx, legend[idx].min + delta);
  };

  return (
    <div className="relative -my-px mx-auto h-80 max-w-md overflow-auto bg-white shadow ring-1 ring-slate-900/5 dark:bg-slate-800">
      <div className="relative">
        <div className="sticky top-0 flex items-center bg-slate-50/90 px-8 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 backdrop-blur-sm dark:bg-slate-700/90 dark:text-slate-200 dark:ring-black/10">
          <div className="grid grid-cols-2 gap-8">
            <div>カラー</div>
            <div>開始値</div>
          </div>
        </div>
        <div className="divide-y dark:divide-slate-200/5">
          {legend.map((it, i) => (
            <div key={i} className="flex items-center gap-8 p-3">
              <ColorPicker
                color={it.color}
                onChange={(color) =>
                  onChange(
                    legend.map((l, j) => (j === i ? { ...l, color } : l)),
                  )
                }
              />
              <div className="flex max-w-40 items-center">
                <StepButton idx={i} delta={-1} onStep={changeBy} />
                <NumberInput idx={i} value={it.min} onCommit={commitMin} />
                <StepButton idx={i} delta={+1} onStep={changeBy} />
              </div>
              <p>{it.max}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
