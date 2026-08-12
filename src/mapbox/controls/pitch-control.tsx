import { useControl, ControlPosition } from "react-map-gl/mapbox";
//import PitchToggle from './pitch/pitchtoggle-control';
import MapboxPitchToggleControl, { Options } from "./pitch-toggle-control";

export type PitchControlPass = Options & {
  position: ControlPosition;
};

export default function PitchControl(props: PitchControlPass) {
  useControl(() => new MapboxPitchToggleControl(props), {
    position: props.position,
  });
  return null;
}
