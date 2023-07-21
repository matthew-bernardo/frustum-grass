export const fragmentShader = `
#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
uniform vec3 diffuseColor;
#ifdef IOR
	uniform float ior;
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <bsdfs>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	
  PhysicalMaterial material;
  material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
  vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );
  float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
  material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
  material.roughness = min( material.roughness, 1.0 );
  #ifdef IOR
    material.ior = ior;
    #ifdef SPECULAR
      float specularIntensityFactor = specularIntensity;
      vec3 specularColorFactor = specularColor;
      #ifdef USE_SPECULARINTENSITYMAP
        specularIntensityFactor *= texture2D( specularIntensityMap, vUv ).a;
      #endif
      #ifdef USE_SPECULARCOLORMAP
        specularColorFactor *= texture2D( specularColorMap, vUv ).rgb;
      #endif
      material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
    #else
      float specularIntensityFactor = 1.0;
      vec3 specularColorFactor = vec3( 1.0 );
      material.specularF90 = 1.0;
    #endif
    material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
  #else
    material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
    material.specularF90 = 1.0;
  #endif
  #ifdef USE_CLEARCOAT
    material.clearcoat = clearcoat;
    material.clearcoatRoughness = clearcoatRoughness;
    material.clearcoatF0 = vec3( 0.04 );
    material.clearcoatF90 = 1.0;
    #ifdef USE_CLEARCOATMAP
      material.clearcoat *= texture2D( clearcoatMap, vUv ).x;
    #endif
    #ifdef USE_CLEARCOAT_ROUGHNESSMAP
      material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vUv ).y;
    #endif
    material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
    material.clearcoatRoughness += geometryRoughness;
    material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
  #endif
  #ifdef USE_IRIDESCENCE
    material.iridescence = iridescence;
    material.iridescenceIOR = iridescenceIOR;
    #ifdef USE_IRIDESCENCEMAP
      material.iridescence *= texture2D( iridescenceMap, vUv ).r;
    #endif
    #ifdef USE_IRIDESCENCE_THICKNESSMAP
      material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vUv ).g + iridescenceThicknessMinimum;
    #else
      material.iridescenceThickness = iridescenceThicknessMaximum;
    #endif
  #endif
  #ifdef USE_SHEEN
    material.sheenColor = sheenColor;
    #ifdef USE_SHEENCOLORMAP
      material.sheenColor *= texture2D( sheenColorMap, vUv ).rgb;
    #endif
    material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
    #ifdef USE_SHEENROUGHNESSMAP
      material.sheenRoughness *= texture2D( sheenRoughnessMap, vUv ).a;
    #endif
  #endif

	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}
`