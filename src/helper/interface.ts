export interface ICoordinate {
  startCoordinate: { x: number; y: number };
  endCoordinate: { x: number; y: number };
}

export interface ILineStroke {
  name: string;
  value: null | number;
  content: string;
}

export interface IShapesArgs {
  coordinate: ICoordinate;
  canvas?: HTMLCanvasElement;
  strokeColor: string;
  strokeStyle: ILineStroke;
  currentShapeFillColor: string;
  strokeWidth: number;
  roomId?: string;
}
