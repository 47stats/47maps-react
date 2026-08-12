import { useState, useEffect } from "react";
import { Layer } from "react-map-gl/mapbox";
import type { FillLayer, FillExtrusionLayer } from "mapbox-gl";
import {
  getFillCaseLayer,
  getFillExtrusionCaseLayer,
  getBorderCaseLayer,
} from "../layers";
import { LegendType } from "../legend";
import { ColumnInfoType } from "@47stats/api";
import { LAYER_ID } from "./";

type Visibility = "visible" | "none";

type LayerComponentProps = {
  sourceId: string;
  legend: LegendType[];
  column: ColumnInfoType[];
  series: number;
  isArea: boolean;
  pitch: boolean;
  opacity: number;
};

export const LayerComponent = (props: LayerComponentProps) => {
  const [lineLayer, setLineLayer] = useState<Omit<FillLayer, "source">>(
    getBorderCaseLayer(LAYER_ID.LINE),
  );
  const [fillLayer, setFillLayer] = useState<Omit<FillLayer, "source">>({
    id: LAYER_ID.FILL,
    type: "fill",
  } as Omit<FillLayer, "source">);
  const [extrusionLayer, setExtrusionLayer] = useState<
    Omit<FillExtrusionLayer, "source">
  >({ id: LAYER_ID.EXTR, type: "fill-extrusion" } as Omit<
    FillExtrusionLayer,
    "source"
  >);
  const [layerKey, setLayerKey] = useState<number>(0);

  const [isVisibleLine, setVisibleLine] = useState<Visibility>("none");
  const [isVisibleFill, setVisibleFill] = useState<Visibility>("none");
  const [isVisibleExtrusion, setVisibleExtrusion] =
    useState<Visibility>("none");

  useEffect(() => {
    const columnItem = props.column.find((it) => it.date1 === props.series);
    if (columnItem && props.legend.length > 0) {
      const newFillLayer = getFillCaseLayer(
        LAYER_ID.FILL,
        columnItem.column,
        ...props.legend,
      );
      const newExtrusionLayer = getFillExtrusionCaseLayer(
        LAYER_ID.EXTR,
        columnItem.column,
        ...props.legend,
      );
      const newLineLayer = getBorderCaseLayer(LAYER_ID.LINE);

      // 荳埼乗・蠎ｦ繧帝←逕ｨ
      const opacityValue = props.opacity / 100;
      if (newLineLayer.paint) {
        newLineLayer.paint["fill-opacity"] = opacityValue;
      }
      if (newFillLayer.paint) {
        newFillLayer.paint["fill-opacity"] = opacityValue;
      }
      if (newExtrusionLayer.paint) {
        newExtrusionLayer.paint["fill-extrusion-opacity"] = opacityValue;
      }

      setLineLayer(newLineLayer);
      setFillLayer(newFillLayer);
      setExtrusionLayer(newExtrusionLayer);
      setLayerKey((prev) => prev + 1);
    }
    setVisibleLine("none");
    setVisibleFill("none");
    setVisibleExtrusion("none");
    if (props.isArea) {
      if (props.column.length > 0) {
        if (props.pitch) {
          setVisibleExtrusion("visible");
        } else {
          setVisibleLine("visible");
          setVisibleFill("visible");
        }
      } else {
        setVisibleLine("visible");
      }
    }
    return () => {
      setVisibleLine("none");
      setVisibleFill("none");
      setVisibleExtrusion("none");
    };
  }, [
    props.legend,
    props.column,
    props.series,
    props.isArea,
    props.pitch,
    props.opacity,
  ]);

  return (
    <>
      <Layer
        key={`line-${layerKey}`}
        {...lineLayer}
        layout={{ visibility: isVisibleLine }}
        source={props.sourceId}
      />
      <Layer
        key={`fill-${layerKey}`}
        {...fillLayer}
        layout={{ visibility: isVisibleFill }}
        source={props.sourceId}
      />
      <Layer
        key={`extrusion-${layerKey}`}
        {...extrusionLayer}
        layout={{ visibility: isVisibleExtrusion }}
        source={props.sourceId}
      />
    </>
  );
};
