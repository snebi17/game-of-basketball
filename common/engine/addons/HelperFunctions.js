import { Transform } from '../../../common/engine/core.js';
import { vec3 } from '../../../lib/gl-matrix-module.js';


export function configureBall(scene) {

    const basketball = scene.find(node => node.name == 'Basketball');
    scene.removeChild(basketball);
    basketball.isDynamic = true;

    var scaleFactor = basketball.getComponentOfType(Transform).scale.slice();

    vec3.scale(scaleFactor, scaleFactor, 1025)
    vec3.multiply(basketball.aabb.min, basketball.aabb.min, scaleFactor)
    vec3.multiply(basketball.aabb.max, basketball.aabb.max, scaleFactor)
    console.log(basketball.aabb);

    return basketball;
}

// Möller–Trumbore intersection algorithm using cramers rule
export function rayIntersectsTriangle(rayOrigin, rayVector, triangle) {

    // debugger;
    const EPSILON = 0.0000001;

    const vertex0 = triangle.vertex0.position;
    const vertex1 = triangle.vertex1.position;
    const vertex2 = triangle.vertex2.position;

    const edge1 = vec3.subtract(vec3.create(), vertex1, vertex0);
    const edge2 = vec3.subtract(vec3.create(), vertex2, vertex0);

    const h = vec3.cross(vec3.create(), rayVector, edge2);
    const a = vec3.dot(edge1, h);

    if (a > -EPSILON && a < EPSILON) {
        return false; // This ray is parallel to this triangle.
    }

    const f = 1.0 / a;
    const s = vec3.subtract(vec3.create(), rayOrigin, vertex0);
    const u = f * vec3.dot(s, h);

    if (u < 0.0 || u > 1.0) {
        return false;
    }

    const q = vec3.cross(vec3.create(), s, edge1);
    const v = f * vec3.dot(rayVector, q);

    if (v < 0.0 || u + v > 1.0) {
        return false;
    }

    // At this stage, we can compute t to find out where the intersection point is on the line.
    const t = f * vec3.dot(edge2, q);

    if (t > EPSILON) {
        // Ray intersection
        const intersectionPoint = vec3.scaleAndAdd(vec3.create(), rayOrigin, rayVector, t);
        return intersectionPoint;
    } else {
        // This means that there is a line intersection but not a ray intersection.
        return false;
    }
}
