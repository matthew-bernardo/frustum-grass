// @ts-nocheck
import { grassWavingShader } from "./vertexShader";
import { fragmentShader } from "./fragmentShader";

// A-Frame properties to three.js uniform types.
const propertyToThreeMapping = {
  array: 'v3',
  color: 'v3',
  int: 'i',
  number: 'f',
  map: 't',
  time: 'f',
  vec2: 'v2',
  vec3: 'v3',
  vec4: 'v4'
};

/**
 * Standard (physically-based) shader using MeshStandardMaterial.
 */
AFRAME.registerShader('grass', {
  schema: {
    timeMsec: { type: "time", is: "uniform" },
    vertexColorsEnabled: { type: "boolean", default: true }, 
    color: { type: "color", is: "uniform" },
    diffuseColor: { type: "color", is: "uniform" }
  },
  // @ts-ignore
  vertexShader: grassWavingShader,
  // @ts-ignore
  fragmentShader: fragmentShader,
  init: function (data) {
    this.attributes = this.initVariables(data, 'attribute');
    const lightUniforms = THREE.UniformsLib.lights
    this.uniforms = this.initVariables({ ...data, ...lightUniforms }, 'uniform');
    Object.assign(this.uniforms, lightUniforms)
    this.material = new (this.raw ? THREE.RawShaderMaterial : THREE.ShaderMaterial)({
      // attributes: this.attributes,
      uniforms: this.uniforms,
      lights: true,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });
    return this.material;
  },

  initVariables: function (data, type) {
    var key;
    var schema = this.schema;
    var variables = {};
    var varType;

    for (key in schema) {
      if (schema[key].is !== type) { continue; }
      varType = propertyToThreeMapping[schema[key].type];
      variables[key] = {
        type: varType,
        value: undefined  // Let updateVariables handle setting these.
      };
    }
    return variables;
  },

  /**
   * Update handler. Similar to attributeChangedCallback.
   * Called whenever the associated material data changes.
   *
   * @param {object} data - New material data.
   */
  update: function (data) {
    this.updateVariables(data, 'attribute');
    this.updateVariables(data, 'uniform');
  },

  updateVariables: function (data, type) {
    var key;
    var materialKey;
    var schema = this.schema;
    var variables;

    variables = type === 'uniform' ? this.uniforms : this.attributes;
    for (key in data) {
      if (!schema[key] || schema[key].is !== type) { continue; }

      if (schema[key].type === 'map') {
        // If data unchanged, get out early.
        if (!variables[key] || variables[key].value === data[key]) { continue; }

        // Special handling is needed for textures.
        materialKey = '_texture_' + key;

        // We can't actually set the variable correctly until we've loaded the texture.
        this.setMapOnTextureLoad(variables, key, materialKey);

        // Kick off the texture update now that handler is added.
        utils.material.updateMapMaterialFromData(materialKey, key, this, data);
        continue;
      }
      try {
        variables[key].value = this.parseValue(schema[key].type, data[key]);
        variables[key].needsUpdate = true;
      } catch(_) {}
    }
  },

  parseValue: function (type, value) {
    var color;
    switch (type) {
      case 'vec2': {
        return new THREE.Vector2(value.x, value.y);
      }
      case 'vec3': {
        return new THREE.Vector3(value.x, value.y, value.z);
      }
      case 'vec4': {
        return new THREE.Vector4(value.x, value.y, value.z, value.w);
      }
      case 'color': {
        color = new THREE.Color(value);
        return new THREE.Vector3(color.r, color.g, color.b);
      }
      case 'map': {
        return THREE.ImageUtils.loadTexture(value);
      }
      default: {
        return value;
      }
    }
  },

  setMapOnTextureLoad: function (variables, key, materialKey) {
    var self = this;
    this.el.addEventListener('materialtextureloaded', function () {
      variables[key].value = self.material[materialKey];
      variables[key].needsUpdate = true;
    });
  }
})