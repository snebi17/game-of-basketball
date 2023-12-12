import { shaders } from "./shaders.js";
import * as WebGL from "./common/engine/WebGL.js";
import { GLTFLoader } from "./common/engine/loaders/GLTFLoader.js";
import { core } from "./common/engine/core.js";

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

const programs = WebGL.buildPrograms(gl, shaders);

const loader = new GLTFLoader();
await loader.load('./common/models/court/scene.gltf');

const scene = loader.loadScene(loader.defaultScene);
const camera = loader.