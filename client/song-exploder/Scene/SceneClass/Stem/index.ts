import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { PositionalAudioHelper } from "three/examples/jsm/helpers/PositionalAudioHelper.js";

import Particles from "./Particles";

interface StemProps {
  matcapTexture: string;
  model: string;
  audio: string;
  TextureLoader: THREE.TextureLoader;
  GLTFLoader: GLTFLoader;
  AudioLoader: THREE.AudioLoader;
  AudioListener: THREE.AudioListener;
  numberOfRings: number;
  /** must be `integer` not floating number in range `[5,15]`  */
  particleDensity: number;
  pointSize: number;
  amplitude: number;
}

export default class Stem {
  private matcapTexture: THREE.Texture;
  private particles: Particles;

  public group: THREE.Group = new THREE.Group();
  public model: THREE.Mesh;
  audio: THREE.PositionalAudio;
  analyzer: THREE.AudioAnalyser;

  constructor({
    matcapTexture,
    TextureLoader,
    GLTFLoader,
    AudioLoader,
    AudioListener,
    model,
    audio,
    particleDensity,
    numberOfRings,
    pointSize,
    amplitude,
  }: StemProps) {
    /**
     * Load Matcap texture
     */
    this.matcapTexture = TextureLoader.load(matcapTexture);

    /**
     * Load Model
     */
    GLTFLoader.load(model, (gltf) => {
      const model = gltf.scene.getObjectByName("model") as THREE.Mesh;

      model.material = new THREE.MeshMatcapMaterial({
        matcap: this.matcapTexture,
        normalMapType: THREE.TangentSpaceNormalMap,
      });
      /**
       * Scale to fit in Particles minRadius
       */
      model.geometry.computeBoundingSphere();
      const scale = 0.15 / model.geometry.boundingSphere.radius;
      model.scale.setScalar(scale);

      // lift up a bit
      model.position.y = 0.05;

      this.model = model;
      this.group.add(this.model);
    });

    /**
     * Load Audio
     */
    this.audio = new THREE.PositionalAudio(AudioListener);
    AudioLoader.load(audio, (buffer) => {
      console.log(buffer);
      this.audio.setBuffer(buffer);
      document.addEventListener("click", () =>
        this.audio.isPlaying ? this.audio.pause() : this.audio.play()
      );
    });

    this.analyzer = new THREE.AudioAnalyser(
      this.audio,
      Math.pow(2, particleDensity)
    );

    //@ts-ignore for testing
    window.analyzer = this.analyzer;

    // const helper = new PositionalAudioHelper(this.audio);
    // this.group.add(helper);

    this.group.add(this.audio);

    /**
     * Create Particles
     */
    this.particles = new Particles({
      pointMatcapTexture: this.matcapTexture,
      numberOfRings,
      numberOfParticlesPerRing: Math.pow(2, particleDensity),
      pointSize,
      minRadius: 0.15,
      maxRadius: 0.5,
      amplitude,
    });

    this.group.add(this.particles);
  }

  public dispose() {
    this.particles.dispose();
    this.matcapTexture.dispose();
    (this.model.material as THREE.Material).dispose();
    this.model.geometry.dispose();
    this.audio.context.close().then(() => (this.audio = null));
    this.analyzer.analyser.disconnect();
  }

  public update(time) {
    this.model.rotateOnWorldAxis(this.group.up, 0.05);

    this.particles.update(time, this.analyzer.getFrequencyData());
  }

  public setPosition(x: number, y: number, z: number): Stem {
    this.group.position.set(x, y, z);

    return this;
  }
}
