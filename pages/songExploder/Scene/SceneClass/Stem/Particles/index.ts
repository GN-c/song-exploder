import * as THREE from "three";

export interface SoundParticlesProps {
  numberOfRings: number;
  numberOfParticlesPerRing: number;
  pointSize?: number;
  pointMatcapTexture: THREE.Texture;
  minRadius?: number;
  maxRadius?: number;
  amplitude: number;
}

export default class SoundParticles extends THREE.Points {
  material: THREE.Material & { uniforms: { [key: string]: { value: any } } };

  constructor({
    numberOfParticlesPerRing,
    numberOfRings,
    pointSize = 2,
    pointMatcapTexture,
    minRadius = 0.15,
    maxRadius = 0.5,
    amplitude,
  }: SoundParticlesProps) {
    super();
    console.log({ numberOfParticlesPerRing });

    /**
     * Create Material
     */
    this.material = new THREE.ShaderMaterial({
      vertexShader: `
      varying float vDistance; 

      uniform float time;

      uniform float frequencyData[${
        (numberOfRings * numberOfParticlesPerRing) / 2
      }];

      vec2 rotate(vec2 v, float a) {
        float s = sin(a);
        float c = cos(a);
        mat2 m = mat2(c, -s, s, c);
        return m * v;
      }

      void main(){
        vDistance = distance(vec2(0.,0.),position.xz);

        int ringID = gl_VertexID / ${numberOfParticlesPerRing};
        int particleID = gl_VertexID % ${numberOfParticlesPerRing};

        /**
        * Position
        */
        vec3 transformedPos = position;
        // get frequency for this vertex based on its id
        transformedPos.y = ${amplitude} * frequencyData[ringID * ${
        numberOfParticlesPerRing / 2
      } + particleID - max(0,2*(particleID - ${
        numberOfParticlesPerRing / 2
      }) + 1)] / 255.;

        transformedPos.xz = rotate(transformedPos.xz,time * (float(ringID)*0.06 + 0.5));
        
        // transformedPos.y = ringID;

        vec4 viewPosition = modelViewMatrix * vec4(transformedPos, 1.0);
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;

        gl_PointSize = ${pointSize.toFixed(1)}/ - viewPosition.z;

      }
    `,

      fragmentShader: `
      uniform sampler2D matcap;

      varying float vDistance; 
       
      vec2 matcapUV(vec3 eye, vec3 normal) {
        vec3 reflected = reflect(eye, normal);
        float m = 2.8284271247461903 * sqrt( reflected.z+1.0 );
        return reflected.xy / m + 0.5;
      }

      

      void main(){
        float strength = distance(gl_PointCoord, vec2(0.5));
        if(strength > 0.5) discard;

        vec2 finalUV = gl_PointCoord;

        gl_FragColor = vec4(texture2D(matcap,finalUV).rgb,1.0 - smoothstep(0.7,1.0, 2.* vDistance));
        // float diff = dot(vec3(1.),vNormal);
        // gl_FragColor = vec4(diff,diff,diff,1.);
      }
    `,
      uniforms: {
        matcap: { value: pointMatcapTexture },
        time: { value: 0 },
        frequencyData: {
          value: new Uint8Array((numberOfRings * numberOfParticlesPerRing) / 2),
        },
      },
      transparent: true,
    });

    // console.log(this.material.);

    /**
     * Create Geometry
     */
    this.geometry = new THREE.BufferGeometry();

    const position = new Float32Array(
      numberOfParticlesPerRing * numberOfRings * 3
    );

    // generate vertexes on circle
    const ringInterval = (maxRadius - minRadius) / numberOfRings;

    for (let ring = 0; ring < numberOfRings; ring++) {
      for (let particle = 0; particle < numberOfParticlesPerRing; particle++) {
        const index = 3 * (ring * numberOfParticlesPerRing + particle);
        position[index] =
          Math.cos(2 * Math.PI * (particle / numberOfParticlesPerRing)) *
          (minRadius + ringInterval * ring);
        position[index + 1] = 0;
        position[index + 2] =
          Math.sin(2 * Math.PI * (particle / numberOfParticlesPerRing)) *
          (minRadius + ringInterval * ring);
      }
    }

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(position, 3)
    );
    console.log(this.geometry);
  }

  public dispose() {
    this.material.dispose();
    this.geometry.dispose();
  }

  update(time: number, frequencyData: Uint8Array) {
    this.material.uniforms.time.value = time;

    /**
     * Shift frequencies with frequency.length units
     */
    for (
      let i =
        this.material.uniforms.frequencyData.value.length -
        frequencyData.length -
        1;
      i >= 0;
      i--
    ) {
      this.material.uniforms.frequencyData.value[
        i + frequencyData.length
      ] = this.material.uniforms.frequencyData.value[i];
    }

    /**
     * Update shader's frequencyData with new values
     */
    for (let i = 0, length = frequencyData.length; i < length; i++) {
      this.material.uniforms.frequencyData.value[i] = frequencyData[i];
    }
    // this.material.uniforms.frequencyData.value[1] = frequencyData[1];
  }
}
