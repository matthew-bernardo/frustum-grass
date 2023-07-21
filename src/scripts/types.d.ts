interface IInitProps {
  type: "initialize";
  vertices: Array<IVertex>;
  camera: ICamera;
  fov: number;
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