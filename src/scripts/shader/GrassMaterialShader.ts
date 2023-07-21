import { Color } from "three";
import { grassWavingShader } from "./vertexShader";
import { MeshExtensibleMaterial } from "./MeshExtensibleMaterial";

/**
 * I was trying to register a shader that reuses MeshStandardMaterial but adds some extra garbage.
 * It didn't work :(
 * This is currently disused
 */
AFRAME.registerShader('grass', {
  schema: {
    timeMsec: { type: "time", is: "varying" },

    color: {type: 'color'},

    emissive: {type: 'color', default: '#000'},
    emissiveIntensity: {default: 1},

    fog: {default: true}
  },

  /**
   * Initializes the shader.
   * Adds a reference from the scene to this entity as the camera.
   */
  init: function (data) {
    this.materialData = {color: new Color(), emissive: new Color()};
    getMaterialData(data, this.materialData);
    this.material = new MeshExtensibleMaterial(this.materialData);
    this.material.onBeforeCompile = (shader: any) => {
      shader.uniforms.timeMsec = { value: 0 }
      shader.vertexShader = grassWavingShader
      this.material.userData = shader
    }
    return this.material
  },

  vertexShader: grassWavingShader,

  update: function (data: Record<string, any>) {
    this.updateMaterial(data);
  },

  /**
   * Updating existing material.
   *
   * @param {object} data - Material component data.
   * @returns {object} Material.
   */
  updateMaterial: function (data: any) {
    var key;
    var material = this.material;
    getMaterialData(data, this.materialData);
    for (key in this.materialData) {
      if (this.materialData[key] !== undefined) {
        material[key] = this.materialData[key];
      }
    }
  },
});

/**
 * Builds and normalize material data, normalizing stuff along the way.
 *
 * @param {object} data - Material data.
 * @param {object} materialData - Object to use.
 * @returns {object} Updated materialData.
 */
function getMaterialData (data: any, materialData: any) {
  materialData.timeMsec = data.timeMsec || 0;
  materialData.color.set(data.color);
  materialData.emissive.set(data.emissive);
  materialData.emissiveIntensity = data.emissiveIntensity;
  materialData.fog = data.fog;
  return materialData;
}