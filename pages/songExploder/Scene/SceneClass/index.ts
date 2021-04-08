import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import Stem from "./Stem";

interface Props {
  /** runs after first frame is rendered */
  onPreloadDone: () => void;
  canvas: HTMLCanvasElement;
}

export default class Scene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrame: number;
  private controls: OrbitControls;
  private textureLoader: THREE.TextureLoader;
  private gltfLoader: GLTFLoader;
  private stems: Stem[];
  private clock: THREE.Clock;
  private audioListener: THREE.AudioListener;
  private audioLoader: THREE.AudioLoader;

  constructor({ canvas, onPreloadDone }: Props) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.001,
      10
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /**
     * Orbit Controls
     */
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(0, 0, 1);
    this.controls.update();

    /**
     * set onLoadListener
     */

    THREE.DefaultLoadingManager.onLoad = () => {
      this.update();
      requestAnimationFrame(() => onPreloadDone());
    };

    /**
     * Create Texture Loader
     */
    this.textureLoader = new THREE.TextureLoader();

    /**
     * Create GLTF Loader
     */
    this.gltfLoader = new GLTFLoader();

    /**
     * Create Audio Loader
     */
    this.audioLoader = new THREE.AudioLoader(THREE.DefaultLoadingManager);

    /**
     * Create Clock
     */
    this.clock = new THREE.Clock();

    /**
     * Create Audio Listener
     */
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);

    console.log(this.audioListener);

    /**
     * add Resize Listeners
     */
    window.addEventListener("resize", this.handleResize);

    /**
     * Start Creating Scene
     */
    this.create();
  }

  private handleResize = () => {
    // Update camera
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  public dispose() {
    /**
     * dispose everything on component unmount to prevent memory leak
     */

    cancelAnimationFrame(this.animationFrame);

    window.removeEventListener("resize", this.handleResize);

    this.renderer.dispose();
    this.controls.dispose();

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.textureLoader = null;
    this.gltfLoader = null;
    this.audioLoader = null;
    this.audioListener.context.close().then(() => (this.audioListener = null));
    this.stems.forEach((stem) => stem.dispose());
  }

  private create() {
    this.stems = [
      new Stem({
        matcapTexture: "./silver.png",
        model: "./trumpet.glb",
        audio: "./audio/trumpet.wav",
        GLTFLoader: this.gltfLoader,
        TextureLoader: this.textureLoader,
        AudioLoader: this.audioLoader,
        AudioListener: this.audioListener,
        numberOfRings: 10,
        particleDensity: 6,
        pointSize: 10,
        amplitude: 0.15,
      }),
      new Stem({
        matcapTexture: "./matcap2.png",
        model: "./trumpet.glb",
        audio: "./audio/bass.wav",
        GLTFLoader: this.gltfLoader,
        TextureLoader: this.textureLoader,
        AudioLoader: this.audioLoader,
        AudioListener: this.audioListener,
        numberOfRings: 10,
        particleDensity: 6,
        pointSize: 10,
        amplitude: 0.15,
      }).setPosition(1.5, 0, 0),
      new Stem({
        matcapTexture: "./redGlowy.png",
        model: "./trumpet.glb",
        audio: "./audio/piano.wav",
        GLTFLoader: this.gltfLoader,
        TextureLoader: this.textureLoader,
        AudioLoader: this.audioLoader,
        AudioListener: this.audioListener,
        numberOfRings: 10,
        particleDensity: 6,
        pointSize: 10,
        amplitude: 0.15,
      }).setPosition(1.5 / 2, 0, 1.5),
    ];

    this.stems.forEach((stem) => this.scene.add(stem.group));
  }

  private update = () => {
    this.clock.getElapsedTime();

    this.stems.forEach((stem) => stem.update(this.clock.elapsedTime));

    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.update);
  };
}
