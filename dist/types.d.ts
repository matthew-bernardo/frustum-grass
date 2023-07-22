interface IInitProps {
  type: "initialize";
  vertices: Array<IVertex>;
  camera: ICamera;
  fov: number;
  isTerrainosaurus: boolean;
  terrainScale?: number;
  density: number;
}

interface IUpdateProps {
  type: "update";
  camera: ICamera;
}

interface IVertex {
  pos: [number, number, number];
  color: [number, number, number];
}

interface ICamera {
  position: [number, number, number];
  rotation: [number, number, number];
}