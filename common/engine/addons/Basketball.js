import { vec3, quat } from '../../../lib/gl-matrix-module.js';

import { Transform } from '../core/Transform.js';

export class Basketball {

    constructor(node, scene, {
        initialTranslation = [0, 0.5, 0],
        initialRotation = [0, 0, 0, 1],
        initialDirection = [0, 0, -1],
        throwAngle = 15,
        power = 0.5, // m/s
        gravity = [0, -1.981, 0], // m/s²
    } = {}) {
        this.node = node;
        this.scene = scene;
        this.gravity = gravity;

        this.direction = initialDirection; 
        this.adjustDirection(throwAngle);

        this.velocity = vec3.create();
        vec3.scale(this.velocity, this.direction, power);

        this.initTranslationRotation(initialTranslation, initialRotation);
        this.clearBalls();
    }

    update(t, dt) {
        vec3.scaleAndAdd(this.velocity, this.velocity, this.gravity, dt);
        const transform = this.node.getComponentOfType(Transform);
        if (transform) {
            // Update translation based on velocity.
            vec3.scaleAndAdd(transform.translation,
                transform.translation, this.velocity, dt);
        }
    }

    initTranslationRotation(initialPosition, initialRotation) {
        const nodeTransform = this.node.getComponentOfType(Transform);
        nodeTransform.translation = initialPosition;
        nodeTransform.rotation = initialRotation;
    }

    clearBalls() {
        const basketball = this.scene.find(node => node.name == 'Basketball');
        if (basketball !== undefined) 
        this.scene.removeChild(basketball);
    }

    adjustDirection(throwAngle) {
        const radians = -(throwAngle*Math.PI)/180;
        const rotation = quat.create();
        quat.rotateZ(rotation, rotation, radians);
        vec3.transformQuat(this.direction, this.direction, rotation);
    }
}