import { useControl, ControlPosition } from "react-map-gl/mapbox";
import type { IControl, Map as MapboxMap } from "mapbox-gl";
import "./styles-control.css";

export interface MapStyleDefinition {
  title: string;
  uri: string;
}

export interface MapStyleSwitcherEvents {
  onChange?: (event: MouseEvent, style: string) => void;
}

export interface StylesControlProps {
  styles: MapStyleDefinition[];
  defaultStyle?: string;
  eventListeners?: MapStyleSwitcherEvents;
  position?: ControlPosition | "top-right";
}

class StylesMapControl implements IControl {
  private map?: MapboxMap;
  private container?: HTMLDivElement;
  private list?: HTMLDivElement;
  private toggle?: HTMLButtonElement;

  constructor(private readonly options: StylesControlProps) {}

  getDefaultPosition(): ControlPosition {
    return "top-right";
  }

  onAdd(map: MapboxMap): HTMLElement {
    this.map = map;

    const container = document.createElement("div");
    container.className = "mapboxgl-ctrl mapboxgl-ctrl-group m47-style-control";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "m47-style-control__toggle";
    toggle.title = "地図スタイルを切り替える";
    toggle.setAttribute("aria-label", toggle.title);
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", this.handleToggle);

    const list = document.createElement("div");
    list.className = "m47-style-control__list";
    list.setAttribute("role", "menu");

    const initialStyle =
      this.options.defaultStyle ?? this.options.styles[0]?.uri;
    for (const style of this.options.styles) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = style.title;
      button.dataset.uri = style.uri;
      button.setAttribute("role", "menuitemradio");
      button.setAttribute("aria-checked", String(style.uri === initialStyle));
      if (style.uri === initialStyle) {
        button.classList.add("active");
      }
      button.addEventListener("click", this.handleStyleSelect);
      list.appendChild(button);
    }

    container.append(toggle, list);
    document.addEventListener("click", this.handleDocumentClick);
    this.container = container;
    this.list = list;
    this.toggle = toggle;
    return container;
  }

  onRemove(): void {
    document.removeEventListener("click", this.handleDocumentClick);
    this.toggle?.removeEventListener("click", this.handleToggle);
    this.list
      ?.querySelectorAll("button")
      .forEach((button) =>
        button.removeEventListener("click", this.handleStyleSelect),
      );
    this.container?.remove();
    this.map = undefined;
  }

  private setOpen(open: boolean): void {
    this.container?.classList.toggle("is-open", open);
    this.toggle?.setAttribute("aria-expanded", String(open));
  }

  private handleToggle = (event: MouseEvent): void => {
    event.stopPropagation();
    this.setOpen(!this.container?.classList.contains("is-open"));
  };

  private handleDocumentClick = (): void => {
    this.setOpen(false);
  };

  private handleStyleSelect = (event: MouseEvent): void => {
    event.stopPropagation();
    const target = event.currentTarget as HTMLButtonElement;
    const style = target.dataset.uri;
    if (!style || !this.map) {
      return;
    }

    this.map.setStyle(style, {
      diff: false,
      localFontFamily: undefined,
      localIdeographFontFamily: undefined,
    });
    this.list?.querySelectorAll("button").forEach((button) => {
      const active = button === target;
      button.classList.toggle("active", active);
      button.setAttribute("aria-checked", String(active));
    });
    this.options.eventListeners?.onChange?.(event, style);
    this.setOpen(false);
  };
}

export default function StylesControl(props: StylesControlProps) {
  useControl(() => new StylesMapControl(props), { position: props.position });
  return null;
}
