import { useState, useEffect, useContext } from "react";
import { Button } from "flowbite-react";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { RankType, ColumnInfoType } from "@47stats/api";
import { useConfig } from "../../contexts/ConfigContext";
import { ChoroplethContext } from "../../provider";
import { getMonthString } from "../utils";
import { LegendDialog } from "./LegendDialog";

import "./Legend.css";

export type LegendType = RankType & {
  color: string;
};

export type LegendProps = {
  legend: LegendType[];
  store: string;
  column: ColumnInfoType;
  onChangeLegend?: (legend: LegendType[]) => void;
};

export const Legend = (props: LegendProps) => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const config = useConfig();
  const {
    legendSchemeType,
    setLegendSchemeType,
    legendRampName,
    setLegendRampName,
    legendNumClasses,
    setLegendNumClasses,
  } = useContext(ChoroplethContext);

  // 初期化: Context の値が空の場合は config のデフォルト値を設定
  useEffect(() => {
    if (!legendSchemeType) {
      setLegendSchemeType(config.schemeType);
    }
    if (!legendRampName) {
      setLegendRampName(config.rampName);
    }
    if (!legendNumClasses) {
      setLegendNumClasses(config.numClasses);
    }
  }, [
    config.schemeType,
    config.rampName,
    config.numClasses,
    legendSchemeType,
    legendRampName,
    legendNumClasses,
    setLegendSchemeType,
    setLegendRampName,
    setLegendNumClasses,
  ]);

  // Safety: if column info is not provided, don't attempt to render content
  if (!props || !props.column) {
    return null;
  }

  const title = props.column
    ? `${props.column.name} (${props.column.unit})`
    : "";
  let subject: string = "";
  if (props.column) {
    if (props.store == "ASAHIRU") {
      subject = props.column.desc || "";
    } else {
      subject = getMonthString(props.column.date1);
    }
  }

  const renderLegend = (it: LegendType, i: number) => {
    let text;
    if (it.min != null) {
      text = it.min.toLocaleString();
    } else {
      text = "";
    }
    return (
      <div key={i}>
        <span style={{ backgroundColor: it.color }}></span>
        <span className="legend-text dark:text-gray-200">
          {text}
          <span className="indent-1.5 text-cyan-600 dark:text-cyan-200">
            {it.count}
          </span>
        </span>
      </div>
    );
  };

  const handlerOK = (
    newLegend: LegendType[],
    newSchemeType: string,
    newRampName: string,
    newNumClasses: number,
  ) => {
    // 親へ legend の更新を通知（不変更新）
    if (props.onChangeLegend) {
      props.onChangeLegend(newLegend);
    } else {
      // フォールバック: 互換のために props.legend をミューテート（推奨しない）
      props.legend.splice(0);
      newLegend.forEach((e) => props.legend.push(e));
    }
    setLegendSchemeType(newSchemeType);
    setLegendRampName(newRampName);
    setLegendNumClasses(newNumClasses);
    setOpenModal(false);
  };

  return (
    <>
      <div
        id="legend"
        className="legend dark:bg-gray-700"
        style={{ visibility: "visible" }}
      >
        <p className="font-bold dark:text-gray-300">{title}</p>
        <p className="dark:text-gray-300">{subject}</p>
        {props.legend ? props.legend.map(renderLegend) : null}
        <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
        <Button pill size="xs" onClick={() => setOpenModal(true)}>
          <HiOutlinePencilAlt className="mr-2 size-4" />
          編集
        </Button>
      </div>
      {legendSchemeType && legendRampName && legendNumClasses ? (
        <LegendDialog
          show={openModal}
          legend={props.legend}
          schemeType={legendSchemeType}
          rampName={legendRampName}
          numClasses={legendNumClasses}
          onOK={handlerOK}
          onClose={() => setOpenModal(false)}
        />
      ) : (
        ""
      )}
    </>
  );
};
