import { GUI } from './lib/dat.gui.module.js';

import { ResizeSystem } from './common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from './common/engine/systems/UpdateSystem.js';

import { GLTFLoader } from './common/engine/loaders/GLTFLoader.js';
import { UnlitRenderer } from './common/engine/renderers/UnlitRenderer.js';

import { Camera, Model } from './common/engine/core.js';
import { FirstPersonController } from './common/engine/controllers/FirstPersonController.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from './common/engine/core/MeshUtils.js';

import { Physics } from './common/engine/core/Physics.js';
import { Crosshair } from './common/engine/addons/Crosshair.js';


const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const loader = new GLTFLoader();
await loader.load('./common/models/basketball/simple/court-edit_.gltf'); // load OK.

const scene = loader.loadScene(loader.defaultScene);
if (!scene) {
    throw new Error('A default scene is required to run this example');
}

const camera = scene.find(node => node.getComponentOfType(Camera));
if (!camera) {
    throw new Error('A camera in the scene is required to run this example');
}
camera.addComponent(new FirstPersonController(camera, canvas));
camera.isDynamic = true;
camera.aabb = {
    min: [-0.1, -0.1, -0.1],
    max: [0.1, 0.1, 0.1],
};

loader.loadNode('Basketball_Stand.001').isStatic = true;
loader.loadNode('Backboard.001').isStatic = true;
loader.loadNode('Hoop.001').isStatic = true;
loader.loadNode('Basketball_Net.001').isStatic = true;

loader.loadNode('Basketball_Net.002').isStatic = true;
loader.loadNode('Basketball_Stand.002').isStatic = true;
loader.loadNode('Backboard.002').isStatic = true;
loader.loadNode('Hoop.002').isStatic = true;

loader.loadNode('Base_fence.001').isStatic = true;
loader.loadNode('Base_fence.002').isStatic = true;
loader.loadNode('Base_fence.003').isStatic = true;
loader.loadNode('Base_fence.004').isStatic = true;

loader.loadNode('Base_podium').isStatic = true;
loader.loadNode('Base_floor').isStatic = true;

// loader.loadNode('Base_fance_stand.001').isStatic = true;
// loader.loadNode('Base_fance_stand.002').isStatic = true;
// loader.loadNode('Base_fance_stand.003').isStatic = true;
// loader.loadNode('Base_fance_stand.004').isStatic = true;

loader.loadNode('Benches.001').isStatic = true;
loader.loadNode('Benches.002').isStatic = true;
loader.loadNode('Benches.003').isStatic = true;
loader.loadNode('Benches.004').isStatic = true;
loader.loadNode('Benches.005').isStatic = true;
loader.loadNode('Benches.006').isStatic = true;
loader.loadNode('Benches.007').isStatic = true;
loader.loadNode('Benches.008').isStatic = true;

loader.loadNode('Court').isStatic = true;

loader.loadNode('Dust_Bin.001').isStatic = true;
loader.loadNode('Dust_Bin.002').isStatic = true;
loader.loadNode('Dust_Bin.003').isStatic = true;
loader.loadNode('Dust_Bin.004').isStatic = true;

loader.loadNode('Light_Pillars.001').isStatic = true;
loader.loadNode('Light_Pillars.002').isStatic = true;
loader.loadNode('Light_Pillars.003').isStatic = true;
loader.loadNode('Light_Pillars.004').isStatic = true;

// loader.loadNode('Mesh_Bars').isStatic = true;

const physics = new Physics(scene);
// Calculates bounding boxes of nodes
scene.traverse(node => {
    const model = node.getComponentOfType(Model);
    if (!model) {
        return;
    }

    const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
    node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
});

function update(time, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });

    physics.update(time, dt);
}

function render() {
    renderer.render(scene, camera);
}
 
function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}
 
new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
const controller = camera.getComponentOfType(FirstPersonController);
gui.add(controller, 'pointerSensitivity', 0.0001, 0.01);
gui.add(controller, 'maxSpeed', 0, 2);
gui.add(controller, 'decay', 0, 1);
gui.add(controller, 'acceleration', 1, 100);


const crosshair = new Crosshair(document.getElementById('crosshair'));
crosshair.show();

document.querySelector('.loader-container').remove();