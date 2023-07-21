import { MeshStandardMaterial, MeshStandardMaterialParameters } from "three";

interface MeshExtensibleMaterialParameters extends MeshStandardMaterialParameters {
  timeMsec: number
}

export class MeshExtensibleMaterial extends MeshStandardMaterial {
  timeMsec: number;
  constructor(parameters: MeshExtensibleMaterialParameters) {
    const { timeMsec = 0, ...standardParams } = parameters
    super(standardParams)
    this.timeMsec = timeMsec
    this.setValues(parameters)
  }
}