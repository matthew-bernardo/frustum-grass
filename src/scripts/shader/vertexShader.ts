// from https://github.com/hughsk/glsl-noise/blob/master/periodic/3d.glsl
export const noiseFunction = `
  float N (vec2 st) { // https://thebookofshaders.com/10/
        return fract( sin( dot( st.xy, vec2(12.9898,78.233 ) ) ) *  43758.5453123);
    }
    
    float smoothNoise( vec2 ip ){ // https://www.youtube.com/watch?v=zXsWftRdsvU
    	vec2 lv = fract( ip );
      vec2 id = floor( ip );
      
      lv = lv * lv * ( 3. - 2. * lv );
      
      float bl = N( id );
      float br = N( id + vec2( 1, 0 ));
      float b = mix( bl, br, lv.x );
      
      float tl = N( id + vec2( 0, 1 ));
      float tr = N( id + vec2( 1, 1 ));
      float t = mix( tl, tr, lv.x );
      
      return mix( b, t, lv.y );
    }
`;

export const displacementShaderBegin = `
  varying vec2 vUv;
  uniform float timeMsec;
  uniform float metalness;
`

export const displacementShaderEnd = `
    vUv = uv;
    float t = timeMsec / 500.;
    
    // VERTEX POSITION
    
    mvPosition = vec4( position, 1.0 );
    #ifdef USE_INSTANCING
    	vec3 mvPosition = instanceMatrix * mvPosition;
    #endif
    
    // DISPLACEMENT
    
    float noise = smoothNoise(mvPosition.xz * 1000. + vec2(0., t - mvPosition.z * 1000.));
    noise = pow(noise * 0.5 + 0.5, 2.) * 2.;
    
    // here the displacement is made stronger on the blades tips.
    float dispPower = 1. - cos( uv.y * 3.1416 * 0.8 );
    
    float displacement = noise * ( 0.5 * dispPower );
    mvPosition.z -= displacement;
    mvPosition.y += metalness;

    vec4 modelViewPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * modelViewPosition;
`

export const grassWavingShader = `
${noiseFunction}
#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif

${displacementShaderBegin}
void main() {

${displacementShaderEnd}
}
`