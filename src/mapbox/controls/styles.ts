export type StyleType = {
  title: string;
  styleName: string;
  uri: string;
};

export const styles: StyleType[] = [
  {
    title: "Streets",
    styleName: "Mapbox Streets",
    uri: "mapbox://styles/mapbox/streets-v12",
  },
  {
    title: "Outdoors",
    styleName: "Mapbox Outdoors",
    uri: "mapbox://styles/mapbox/outdoors-v12",
  },
  {
    title: "Light",
    styleName: "Mapbox Light",
    uri: "mapbox://styles/mapbox/light-v11",
  },
  {
    title: "Dark",
    styleName: "Mapbox Dark",
    uri: "mapbox://styles/mapbox/dark-v11",
  },
  {
    title: "Satellite Streets",
    styleName: "Mapbox Satellite Streets",
    uri: "mapbox://styles/mapbox/satellite-streets-v12",
  },
  {
    title: "Traffic Day",
    styleName: "Mapbox Traffic Day",
    uri: "mapbox://styles/mapbox/traffic-day-v2",
  },
  {
    title: "Traffic Night",
    styleName: "Mapbox Traffic Night",
    uri: "mapbox://styles/mapbox/traffic-night-v2",
  },
  {
    title: "Navigation Day",
    styleName: "Mapbox Navigation Day",
    uri: "mapbox://styles/mapbox/navigation-day-v1",
  },
  {
    title: "Navigation Night",
    styleName: "Mapbox Navigation Night",
    uri: "mapbox://styles/mapbox/navigation-night-v1",
  },
];
