import { useState, useEffect, useRef } from "react";
import { Button, MegaMenu, Modal, Navbar } from "flowbite-react";

import {
  ColorBrewer,
  SchemeRampType,
} from "../../components/panel/color-brewer";
import { LegendList } from "./listview";
import type { LegendType } from "./Legend";

import colorbrewer from "../../utils/colorbrewer";

import type { CustomFlowbiteTheme } from "flowbite-react";
const customTheme: CustomFlowbiteTheme["modal"] = {
  content: {
    base: "relative h-full w-[28rem] p-4 md:h-auto",
    inner:
      "relative flex max-h-[66dvh] flex-col rounded-lg bg-white shadow dark:bg-gray-700",
  },
  body: {
    base: "flex-1 overflow-auto p-4",
  },
  footer: {
    base: "flex items-center space-x-2 rounded-b border-gray-200 p-4 dark:border-gray-600",
  },
};

type LegendDialogProps = {
  legend: LegendType[];
  show: boolean;
  schemeType: string;
  rampName: string;
  numClasses: number;
  onOK: (
    legend: LegendType[],
    schemeType: string,
    rampName: string,
    numClasses: number,
  ) => void;
  onClose: () => void;
};

export const LegendDialog = (props: LegendDialogProps) => {
  const [legend, setLegend] = useState<LegendType[]>(props.legend);
  const [schemeType, setSchemeType] = useState<string>(props.schemeType);
  const [rampName, setRampName] = useState<string>(props.rampName);
  const [numClasses, setNumClasses] = useState<number>(props.numClasses);
  const [schemeRamp, setSchemeRamp] = useState<SchemeRampType>();

  // ダイアログを開くたびに編集用stateを親の値へ同期する。
  // 編集はすべてイミュータブルに行い、OKまで親のlegendへは反映しない
  const prevShowRef = useRef(false);
  useEffect(() => {
    // 開いた瞬間(false→true)のみ同期する。
    // 編集中に親の値が変わってもユーザーの編集内容を上書きしない
    if (props.show && !prevShowRef.current) {
      setLegend(structuredClone(props.legend));
      setSchemeType(props.schemeType);
      setRampName(props.rampName);
      setNumClasses(props.numClasses);
    }
    prevShowRef.current = props.show;
  }, [
    props.show,
    props.legend,
    props.schemeType,
    props.rampName,
    props.numClasses,
  ]);

  const handerSelectNumClasses = (newNumClasses: number) => {
    setNumClasses(newNumClasses);

    let colortable: string[];
    if (schemeRamp) {
      colortable = schemeRamp[newNumClasses];
    } else {
      colortable = colorbrewer[rampName][newNumClasses];
    }

    let pallete: string[] = [];
    if (colortable) {
      pallete = structuredClone(colortable).reverse();
    }

    const next = legend.slice(0, newNumClasses).map((it, i) => ({
      ...it,
      color: pallete.length ? pallete[i] : it.color,
    }));
    for (let i = next.length; i < newNumClasses; i++) {
      next.push({
        color: pallete[i] ?? "#fff",
        min: 0,
        max: 0,
        count: 0,
      });
    }
    setLegend(next);
  };

  const handlerSelectRamp = (
    newSchemeType: string,
    newRampName: string,
    newSchemeRamp: SchemeRampType,
  ) => {
    setSchemeType(newSchemeType);
    setRampName(newRampName);
    setSchemeRamp(newSchemeRamp);

    let max = 9; // newSchemeType == 'sequential'
    if (newSchemeType == "diverging") {
      max = 11;
    } else if (newSchemeType == "qualitative") {
      max = 12;
    }

    if (numClasses > max) {
      setNumClasses(max);
    }

    let colortable = newSchemeRamp[numClasses <= max ? numClasses : max];
    if (!colortable) {
      colortable = newSchemeRamp[Object.keys(newSchemeRamp).length - 2];
    }

    const palette = structuredClone(colortable).reverse();
    setLegend(legend.map((it, i) => ({ ...it, color: palette[i] })));
  };

  const handlerOK = () => {
    props.onOK(legend, schemeType, rampName, numClasses);
  };

  const handlerCancel = () => {
    props.onClose();
  };

  return (
    <Modal show={props.show} onClose={handlerCancel} theme={customTheme}>
      <Modal.Header> 凡例編集 </Modal.Header>
      <MegaMenu>
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between md:space-x-8">
          <Navbar.Collapse>
            <Navbar.Link>
              <MegaMenu.Dropdown toggle={<>テーマと区分数</>}>
                <ColorBrewer
                  title="テーマと区分数"
                  numClasses={numClasses}
                  schemeType={schemeType}
                  rampName={rampName}
                  onSelectSchemeType={(e) => setSchemeType(e)}
                  onSelectNumClasses={handerSelectNumClasses}
                  onSelectRamp={handlerSelectRamp}
                />
              </MegaMenu.Dropdown>
            </Navbar.Link>
          </Navbar.Collapse>
        </div>
      </MegaMenu>

      <Modal.Body>
        <LegendList legend={legend} onChange={setLegend} />
      </Modal.Body>

      <Modal.Footer>
        <Button className="w-28" onClick={handlerOK}>
          OK
        </Button>
        <Button className="w-28" color="gray" onClick={handlerCancel}>
          キャンセル
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
