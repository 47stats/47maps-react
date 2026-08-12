import { Map } from "./mapbox/Map";
import { NavTool } from "./components";
import { ChoroplethContextProvider } from "./provider/ChoroplethContextProvider";
import { MapProvider } from "react-map-gl/mapbox";
import { MarketareaProvider } from "./contexts";

function App() {
  return (
    <MapProvider>
      <MarketareaProvider>
        <ChoroplethContextProvider>
          <NavTool />
          <Map />
        </ChoroplethContextProvider>
      </MarketareaProvider>
    </MapProvider>
  );
}

export default App;
