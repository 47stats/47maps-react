type NumClassesProps = {
  numClasses: number;
  schemeType: string;
  onSelect: (newNumClasses: number) => void;
};

/**
 * 階級区分数を選択するためのセレクターを提供します。
 */
export const NumClasses = (props: NumClassesProps) => {
  const classes: number[] = [3, 4, 5, 6, 7, 8, 9];
  if (props.schemeType == "diverging") {
    classes.push(10, 11);
  } else if (props.schemeType == "qualitative") {
    classes.push(10, 11, 12);
  }

  const handlerChangeNumClasses = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value);
    props.onSelect(value);
  };

  return (
    <fieldset className="m-4">
      <legend className="grid grid-cols-2">
        <div className="pt-3">区分数</div>
        <select
          className="w-20 appearance-none border-0 border-gray-200 bg-transparent text-base focus:border-gray-200 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-600 dark:text-gray-200"
          value={props.numClasses}
          onChange={handlerChangeNumClasses}
          required
        >
          {classes.map((it) => {
            return (
              <option key={it} className="text-center" value={it}>
                {it}
              </option>
            );
          })}
        </select>
      </legend>
    </fieldset>
  );
};
