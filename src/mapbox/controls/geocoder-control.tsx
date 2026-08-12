import { useControl, ControlPosition } from "react-map-gl/mapbox";
import MapboxGeocoder, { GeocoderOptions } from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import * as mapboxgl from "mapbox-gl";

export type GeocoderControlProps = Omit<
  GeocoderOptions,
  "accessToken" | "mapboxgl" | "marker"
> & {
  mapboxAccessToken?: string;
  position?: ControlPosition | "top-right";
};

export default function GeocoderControl(props: GeocoderControlProps) {
  useControl(
    () =>
      new MapboxGeocoder({
        ...props,
        collapsed: false,
        mapboxgl,
        language: "ja",
        countries: "JP",
        types: "region,place,locality,neighborhood,country",
        limit: 8,

        accessToken: props.mapboxAccessToken || "",
      }),
    {
      position: props.position,
    },
  );
  return null;
}
