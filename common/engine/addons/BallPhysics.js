import { vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { getGlobalModelMatrix } from '../../../common/engine/core/SceneUtils.js';
import { Transform, Model } from '../../../common/engine/core.js';
import { Basketball } from '../../../common/engine/addons/Basketball.js';
import { rayIntersectsTriangle } from '../../../common/engine/addons/HelperFunctions.js';



export class BallPhysics {

    constructor(scene) {
        this.scene = scene;
    }

    update(t, dt) {
        this.scene.traverse(node => {
            if (node.isDynamic) {
                this.scene.traverse(other => {
                    if (node !== other && other.isStatic) {
                        this.resolveCollision(node, other);
                    }
                });
            }
        });
    }

    intervalIntersection(min1, max1, min2, max2) {
        return !(min1 > max2 || min2 > max1);
    }

    aabbIntersection(aabb1, aabb2) {
        return this.intervalIntersection(aabb1.min[0], aabb1.max[0], aabb2.min[0], aabb2.max[0])
            && this.intervalIntersection(aabb1.min[1], aabb1.max[1], aabb2.min[1], aabb2.max[1])
            && this.intervalIntersection(aabb1.min[2], aabb1.max[2], aabb2.min[2], aabb2.max[2]);
    }

    getTransformedAABB(node) {
        // Transform all vertices of the AABB from local to global space.
        const matrix = getGlobalModelMatrix(node);
        const { min, max } = node.aabb;
        const vertices = [
            [min[0], min[1], min[2]],
            [min[0], min[1], max[2]],
            [min[0], max[1], min[2]],
            [min[0], max[1], max[2]],
            [max[0], min[1], min[2]],
            [max[0], min[1], max[2]],
            [max[0], max[1], min[2]],
            [max[0], max[1], max[2]],
        ].map(v => vec3.transformMat4(v, v, matrix));

        // Find new min and max by component.
        const xs = vertices.map(v => v[0]);
        const ys = vertices.map(v => v[1]);
        const zs = vertices.map(v => v[2]);
        const newmin = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
        const newmax = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];
        return { min: newmin, max: newmax };
    }

    resolveCollision(a, b) {
        // Get global space AABBs.
        const aBox = this.getTransformedAABB(a);
        const bBox = this.getTransformedAABB(b);
        // Check if there is collision.
        const isColliding = this.aabbIntersection(aBox, bBox);
        if (!isColliding) {
            return;
        }
        

        // Move node A minimally to avoid collision.
        if (a.name == "Camera") {

            const diffa = vec3.sub(vec3.create(), bBox.max, aBox.min);
            const diffb = vec3.sub(vec3.create(), aBox.max, bBox.min);

            let minDiff = Infinity;
            let minDirection = [0, 0, 0];


            if (diffa[0] >= 0 && diffa[0] < minDiff) {
                minDiff = diffa[0];
                minDirection = [minDiff, 0, 0];
            }
            if (diffa[1] >= 0 && diffa[1] < minDiff) {
                minDiff = diffa[1];
                minDirection = [0, minDiff, 0];
            }
            if (diffa[2] >= 0 && diffa[2] < minDiff) {
                minDiff = diffa[2];
                minDirection = [0, 0, minDiff];
            }
            if (diffb[0] >= 0 && diffb[0] < minDiff) {
                minDiff = diffb[0];
                minDirection = [-minDiff, 0, 0];
            }
            if (diffb[1] >= 0 && diffb[1] < minDiff) {
                minDiff = diffb[1];
                minDirection = [0, -minDiff, 0];
            }
            if (diffb[2] >= 0 && diffb[2] < minDiff) {
                minDiff = diffb[2];
                minDirection = [0, 0, -minDiff];
            }

            const transform = a.getComponentOfType(Transform);
            if (!transform) {
                return;
            }

            vec3.add(transform.translation, transform.translation, minDirection);
        
        } else if (a.name == "Basketball") {

            console.log(b);

            const objectModel = b.getComponentOfType(Model);
            if (!objectModel) {
                return;
            }
            
            const basketballTransform = a.getComponentOfType(Transform);
            const basketball = a.getComponentOfType(Basketball);
            if (!basketballTransform) {
                return;
            }

            const rayOrigin = basketballTransform.translation;
            const rayVector = basketball.velocity;
            var closestTriangleDistance = 1000;
            var closestTriangle = undefined;

            objectModel.primitives.forEach(primitive => {
                let indices = primitive.mesh.indices;
                let vertices = primitive.mesh.vertices;
                
                for (let i = 0; i < indices.length; i+=3) {
                    let triangle = { vertex0: vertices[indices[i]],
                        vertex1: vertices[indices[i+1]],
                        vertex2: vertices[indices[i+2]]};
                    
                    let intersectionPoint = rayIntersectsTriangle(rayOrigin, rayVector, triangle);
                    
                    if (intersectionPoint) {
                        let triangleDistance = vec3.length(vec3.sub(vec3.create(), intersectionPoint, rayOrigin));
                        if (triangleDistance < closestTriangleDistance) {
                            closestTriangleDistance = triangleDistance;
                            closestTriangle = triangle;
                        }
                    }
                }
                
            })

            if (!closestTriangle) {
                return;
            }

            const normalSum_v01 = vec3.add(vec3.create(), closestTriangle.vertex0.normal, closestTriangle.vertex1.normal)
            const normalSum = vec3.add(vec3.create() , closestTriangle.vertex2.normal, normalSum_v01);  
            const normal = vec3.normalize(vec3.create(), normalSum);

            let velocity = basketball.velocity;
            const dampingFactor = 0.7;

            let parallelV = vec3.create(); 
            let reflectedV = vec3.create();
            let reflectedDampedV = vec3.create();

            vec3.scale(parallelV, normal, vec3.dot(velocity, normal));
            vec3.scaleAndAdd(reflectedV, velocity, parallelV, -2);
            vec3.scale(reflectedDampedV, reflectedV, dampingFactor);
            
            basketball.velocity = reflectedDampedV;

            vec3.scaleAndAdd(basketballTransform.translation, basketballTransform.translation, reflectedDampedV, 0.01);


            // // const collisionVolume = this.collisionVolume(aBox, bBox); 
            // let collisionPoint = undefined;
            // // let i = 0;

            // // while (collisionPoint === undefined && i < model.primitives.length) {
            // //     collisionPoint = this.findCollisionPoint(model.primitives[i].mesh.vertices, collisionVolume);
            // //     i++;
            // // }
            // if (collisionPoint === undefined) {
            //     collisionPoint = model.primitives[Math.floor(Math.random()*model.primitives.length)].mesh.vertices[0];
            // }
            

            // let velocity = a.getComponentOfType(Basketball).velocity;
            // const normal = collisionPoint.normal;
            // const dampingFactor = 0.7;

            // let parallelV = vec3.create(); 
            // let reflectedV = vec3.create();
            // let reflectedDampedV = vec3.create();

            // vec3.scale(parallelV, normal, vec3.dot(velocity, normal));
            // vec3.scaleAndAdd(reflectedV, velocity, parallelV, -2);
            // vec3.scale(reflectedDampedV, reflectedV, dampingFactor);
            
            // a.getComponentOfType(Basketball).velocity = reflectedDampedV;

            // const transform = a.getComponentOfType(Transform);
            // if (!transform) {
            //     return;
            // }

            // vec3.scaleAndAdd(transform.translation, transform.translation, reflectedDampedV, 0.01);

        }
    }

    findCollisionPoint(array, collisionVolume) {
        array.forEach(element => {
            if ((collisionVolume[0].min < element.position[0] && element.position[0] < collisionVolume[0].max) &&
                (collisionVolume[1].min < element.position[1] && element.position[1] < collisionVolume[1].max) &&
                (collisionVolume[2].min < element.position[2] && element.position[2] < collisionVolume[2].max)) {
                    return element;
            }    
        });
        return undefined;
    }

    collisionVolume (aabb1, aabb2) {
        return [this.collisionInterval(aabb1.min[0], aabb1.max[0], aabb2.min[0], aabb2.max[0]),
                this.collisionInterval(aabb1.min[1], aabb1.max[1], aabb2.min[1], aabb2.max[1]),
                this.collisionInterval(aabb1.min[2], aabb1.max[2], aabb2.min[2], aabb2.max[2])]
    }

    collisionInterval (min1, max1, min2, max2) {
        
        if (max1 > min2 && max1 < max2) {
            return {min: min2, max: max1};
        } else if (max2 > min1 && max1 < max2) {
            return {min: min1, max: max2};
        } else if (min1 < min2 && max1 > max2) {
            return {min: min2, max: max2};
        } else if (min2 < min1 && max2 > max1) {
            return {min: min1, max: max1};
        } else {
            debugger;
        }

    }   

}
