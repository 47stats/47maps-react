import { MapProvider } from "react-map-gl/mapbox";

interface MapWrapperProps {
  children: React.ReactNode;
}

export function MapWrapper({ children }: MapWrapperProps) {
  return <MapProvider>{children}</MapProvider>;
}
