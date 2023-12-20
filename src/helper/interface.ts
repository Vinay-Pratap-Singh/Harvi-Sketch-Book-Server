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

export interface IWriteText {
  text: string;
  offsetX: number;
  offsetY: number;
  strokeWidth: number;
  fontType: string;
  strokeColor: string;
  canvas?: HTMLCanvasElement;
  roomId?: string;
}

// for begin path coordinates
export interface IBeginPathPencil {
  roomId: string;
  x: number;
  y: number;
}

export interface IDrawPathPencil {
  roomId: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: {
    name: string;
    value: null | number;
    content: string;
  };
  x: number;
  y: number;
}
