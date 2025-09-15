declare module 'react-plotly.js' {
  import { Component } from 'react';
  import * as Plotly from 'plotly.js';

  interface PlotParams {
    data: Plotly.Data[];
    layout?: Partial<Plotly.Layout>;
    config?: Partial<Plotly.Config>;
    frames?: Plotly.Frame[];
    revision?: number;
    onInitialized?: (figure: Plotly.Figure, graphDiv: PlotlyHTMLElement) => void;
    onUpdate?: (figure: Plotly.Figure, graphDiv: PlotlyHTMLElement) => void;
    onPurge?: (figure: Plotly.Figure, graphDiv: PlotlyHTMLElement) => void;
    onError?: (err: Error) => void;
    onRelayout?: (eventdata: Plotly.PlotRelayoutEvent) => void;
    onRestyle?: (eventdata: Plotly.PlotRestyleEvent) => void;
    onRedraw?: () => void;
    onSelected?: (eventdata: Plotly.PlotSelectionEvent) => void;
    onDeselect?: () => void;
    onHover?: (eventdata: Plotly.PlotHoverEvent) => void;
    onUnhover?: (eventdata: Plotly.PlotMouseEvent) => void;
    onClick?: (eventdata: Plotly.PlotMouseEvent) => void;
    onDoubleClick?: () => void;
    onAnimatingFrame?: (eventdata: Plotly.FrameAnimationEvent) => void;
    onAnimationInterrupted?: () => void;
    onAnimated?: () => void;
    onWebGlContextLost?: () => void;
    divId?: string;
    className?: string;
    style?: React.CSSProperties;
    debug?: boolean;
    useResizeHandler?: boolean;
  }

  export default class Plot extends Component<PlotParams> {}
}
