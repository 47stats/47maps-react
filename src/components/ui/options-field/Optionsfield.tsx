import styles from "./Optionsfield.module.css";

export interface OptionType {
  name: string;
  description?: string;
  property: string;
}
export interface OptionsfieldProps {
  options: Array<OptionType>;
  property: string;
  shadow?: boolean;
  style?: React.CSSProperties;
  name?: string;
  getOptionClassName?: (
    option: OptionType,
    index: number,
  ) => string | undefined;
  getOptionStyle?: (
    option: OptionType,
    index: number,
  ) => React.CSSProperties | undefined;
  changeState: (a: number) => void;
}

export const Optionsfield = (props: OptionsfieldProps) => {
  const renderOptions = (option: OptionType, i: number) => {
    return (
      <label key={i} className={styles.toggle_container}>
        <input
          onChange={() => props.changeState(i)}
          checked={option.property === props.property}
          name={props.name || "toggle"}
          type="radio"
          aria-label={option.name}
        />
        <div
          className={`${styles.toggle} text-gray-500 dark:text-gray-50 ${styles.toggle_label} ${props.getOptionClassName?.(option, i) || ""}`}
          style={props.getOptionStyle?.(option, i)}
        >
          {option.name}
        </div>
      </label>
    );
  };
  return (
    <div
      className={`${styles.toggle_group} bg-white dark:bg-gray-600 ${props.shadow ? styles.shadow_darken10 : ""}`}
      role="radiogroup"
      aria-label="機能選択"
      style={props.style}
    >
      {props.options.map(renderOptions)}
    </div>
  );
};
