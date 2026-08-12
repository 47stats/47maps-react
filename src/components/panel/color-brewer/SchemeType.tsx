import { Label, Radio } from "flowbite-react";

type RadioType = {
  label: string;
  value: string;
};

type SchemeTypeProps = {
  schemeType: string;
  onSelect: (schemes: string) => void;
};

/**
 * カラースキームを切り替えるためのデータ性質を提供します。
 */
export const SchemeType = (props: SchemeTypeProps) => {
  const radioButtons: RadioType[] = [
    {
      label: "定量",
      value: "sequential",
    },
    {
      label: "分岐",
      value: "diverging",
    },
    {
      label: "定性",
      value: "qualitative",
    },
  ];

  const handlerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const schemeType = event.target.value;
    props.onSelect(schemeType);
  };

  return (
    <fieldset className="m-4">
      <legend className="grid grid-cols-4">
        <p className="flex">データ性質</p>
        {radioButtons.map((radio) => {
          return (
            <div key={radio.value} className="ml-6 flex items-center gap-2">
              <Radio
                id={`scheme-${radio.value}`}
                name="schemes"
                value={radio.value}
                onChange={(e) => handlerChange(e)}
                checked={props.schemeType == radio.value}
              />
              <Label htmlFor={`scheme-${radio.value}`}>{radio.label}</Label>
            </div>
          );
        })}
      </legend>
    </fieldset>
  );
};
