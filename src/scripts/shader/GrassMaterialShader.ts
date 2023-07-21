// @ts-ignore
const { material, srcLoader } = AFRAME.utils
import { CubeTextureLoader, Color, EquirectangularReflectionMapping } from "three";
import { grassWavingShader } from "./vertexShader";
import { MeshExtensibleMaterial } from "./MeshExtensibleMaterial";
const CubeLoader = new CubeTextureLoader();
const texturePromises: any = {};

let logged = 10

/**
 * Standard (physically-based) shader using MeshStandardMaterial.
 */
AFRAME.registerShader('grass', {
  schema: {
    // timeMsec: { type: "time", is: "uniform" },
    ambientOcclusionMap: {type: 'map'},
    ambientOcclusionMapIntensity: {default: 1},
    ambientOcclusionTextureOffset: {type: 'vec2'},
    ambientOcclusionTextureRepeat: {type: 'vec2', default: {x: 1, y: 1}},

    color: {type: 'color'},

    displacementMap: {type: 'map'},
    displacementScale: {default: 1},
    displacementBias: {default: 0.5},
    displacementTextureOffset: {type: 'vec2'},
    displacementTextureRepeat: {type: 'vec2', default: {x: 1, y: 1}},

    emissive: {type: 'color', default: '#000'},
    emissiveIntensity: {default: 1},

    envMap: {default: ''},

    fog: {default: true},
    height: {default: 256},

    metalness: {default: 0.0, min: 0.0, max: 1.0},
    metalnessMap: {type: 'map'},
    metalnessTextureOffset: {type: 'vec2'},
    metalnessTextureRepeat: {type: 'vec2', default: {x: 1, y: 1}},

    normalMap: {type: 'map'},
    normalScale: {type: 'vec2', default: {x: 1, y: 1}},
    normalTextureOffset: {type: 'vec2'},
    normalTextureRepeat: {type: 'vec2', default: {x: 1, y: 1}},

    offset: {type: 'vec2', default: {x: 0, y: 0}},
    repeat: {type: 'vec2', default: {x: 1, y: 1}},

    roughness: {default: 0.5, min: 0.0, max: 1.0},
    roughnessMap: {type: 'map'},
    roughnessTextureOffset: {type: 'vec2'},
    roughnessTextureRepeat: {type: 'vec2', default: {x: 1, y: 1}},

    sphericalEnvMap: {type: 'map'},
    src: {type: 'map'},
    width: {default: 512},
    wireframe: {default: false},
    wireframeLinewidth: {default: 2}
  },

  /**
   * Initializes the shader.
   * Adds a reference from the scene to this entity as the camera.
   */
  init: function (data) {
    // setTimeout(() => {
    //   this.el.setAttribute("material", {
    //     color: "red"
    //   })
    // }, 3000)
    // setTimeout(() => {
    //   logged = 0
    // }, 2000)
    this.materialData = {color: new Color(), emissive: new Color()};
    getMaterialData(data, this.materialData);
    this.material = new MeshExtensibleMaterial(this.materialData);
    this.material.onBeforeCompile = (shader: any) => {
      // shader.uniforms.timeMsec = { value: 0.5 };
      shader.vertexShader = grassWavingShader
      this.material.userData = shader
    }
    return this.material
  },

  vertexShader: grassWavingShader,

  update: function (data: Record<string, any>) {
    this.updateMaterial(data);
    material.updateMap(this, data);
    if (data.normalMap) { material.updateDistortionMap('normal', this, data); }
    if (data.displacementMap) { material.updateDistortionMap('displacement', this, data); }
    if (data.ambientOcclusionMap) { material.updateDistortionMap('ambientOcclusion', this, data); }
    if (data.metalnessMap) { material.updateDistortionMap('metalness', this, data); }
    if (data.roughnessMap) { material.updateDistortionMap('roughness', this, data); }
    this.updateEnvMap(data);
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
    if (logged < 3) {
      logged++
      console.log(material)
    }
    getMaterialData(data, this.materialData);
    for (key in this.materialData) {
      material[key] = this.materialData[key];
    }
  },

  /**
   * Handle environment cubemap. Textures are cached in texturePromises.
   */
  updateEnvMap: function (data: any) {
    var self = this;
    var material = this.material;
    var envMap = data.envMap;
    var sphericalEnvMap = data.sphericalEnvMap;

    // No envMap defined or already loading.
    if ((!envMap && !sphericalEnvMap) || this.isLoadingEnvMap) {
      material.envMap = null;
      material.needsUpdate = true;
      return;
    }
    this.isLoadingEnvMap = true;

    // if a spherical env map is defined then use it.
    if (sphericalEnvMap) {
      this.el.sceneEl.systems.material.loadTexture(sphericalEnvMap, {src: sphericalEnvMap}, function textureLoaded (texture: any) {
        self.isLoadingEnvMap = false;
        texture.mapping = EquirectangularReflectionMapping;
        material.envMap = texture;
        material.handleTextureEvents(self.el, texture);
        material.needsUpdate = true;
      });
      return;
    }

    // Another material is already loading this texture. Wait on promise.
    if (texturePromises[envMap]) {
      texturePromises[envMap].then(function (cube: any) {
        self.isLoadingEnvMap = false;
        material.envMap = cube;
        material.handleTextureEvents(self.el, cube);
        material.needsUpdate = true;
      });
      return;
    }

    // Material is first to load this texture. Load and resolve texture.
    texturePromises[envMap] = new Promise(function (resolve) {
      srcLoader.validateCubemapSrc(envMap, function loadEnvMap (urls: any) {
        CubeLoader.load(urls, function (cube) {
          // Texture loaded.
          self.isLoadingEnvMap = false;
          material.envMap = cube;
          material.handleTextureEvents(self.el, cube);
          resolve(cube);
        });
      });
    });
  }
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
  materialData.metalness = data.metalness;
  materialData.roughness = data.roughness;
  materialData.wireframe = data.wireframe;
  materialData.wireframeLinewidth = data.wireframeLinewidth;

  if (data.normalMap) { materialData.normalScale = data.normalScale; }

  if (data.ambientOcclusionMap) {
    materialData.aoMapIntensity = data.ambientOcclusionMapIntensity;
  }

  if (data.displacementMap) {
    materialData.displacementScale = data.displacementScale;
    materialData.displacementBias = data.displacementBias;
  }

  return materialData;
}