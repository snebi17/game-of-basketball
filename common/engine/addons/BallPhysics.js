import { vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { getGlobalModelMatrix } from '../../../common/engine/core/SceneUtils.js';
import { Transform, Model } from '../../../common/engine/core.js';
import { Basketball } from '../../../common/engine/addons/Basketball.js';
import { rayIntersectsTriangle, areEqualWithTolerance } from '../../../common/engine/addons/HelperFunctions.js';



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

        const hoopPattern = /^Hoop.00\d$/;
        if (a.name == "Basketball" && hoopPattern.test(b.name)) {

            const basketballTransform = a.getComponentOfType(Transform);
            const basketball = a.getComponentOfType(Basketball);
            if (!basketballTransform || !basketball) {
                return;
            }

            const hoopN = [0, 1, 0];
            const hoopR = 0.1075
            const hoopC = (b.name.split('.')[1] == "001")? 
            [   // hoop 1
                -1.890768571472168,
                0.9950,//.7808692455291748,
                2.760568168014288e-05
            ] : [ // hoop 2
                1.884831428527832,
                0.9950,//0.7808692455291748,
                2.760568168014288e-05
            ];
            
            const ballC = basketballTransform.translation.slice();
            const ballR = basketball.radius;
            
            const intersectionPoint = this.sphereCircleIntersection(hoopC, hoopR, hoopN, ballC, ballR);
            if (!intersectionPoint) {
                return;
            }
            
            if (intersectionPoint === true) {
                console.log("You've scored a point");
                return;
            }
    
            normal = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), intersectionPoint, ballC));
            this.calculateRebound(basketball, basketballTransform, normal);
            return;
        }


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

            const correctionVector = this.getCameraCorrectionVector(aBox, bBox)
            const transform = a.getComponentOfType(Transform);
            if (!transform) {
                return;
            }
            vec3.add(transform.translation, transform.translation, correctionVector);

        } else if (a.name == "Basketball") {

            const basketballTransform = a.getComponentOfType(Transform);
            const basketball = a.getComponentOfType(Basketball);
            if (!basketballTransform || !basketball) {
                return;
            }
            var normal = undefined;

            const backboardPattern = /^Backboard_red.\d*$/;
            const fencePattern = /^Base_fence.00\d$/;
            
            if (backboardPattern.test(b.name)) {
                // normal = this.getBackbordNormal(basketballTransform, basketball, b);
                if (b.name.split('.')[1] == "001") {
                    normal = [1, 0, 0];
                } else {
                    normal = [-1, 0, 0];
                }
            } 
            else if (fencePattern.test(b.name)) { normal = this.getFenceNormal(b); }
            else { normal = this.getDefaultObjectNormal(basketballTransform, basketball, b); }

            if (!normal) {
                return;
            }
            
            this.calculateRebound(basketball, basketballTransform, normal);
            
            
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

    calculateRebound(basketball, basketballTransform, normal) {
        const dampingFactor = 0.3;
        const reboundVector = this.getBasketballReboundVector(basketball, normal, dampingFactor);
        const dt = 0.05;
        vec3.scaleAndAdd(basketballTransform.translation, basketballTransform.translation, reboundVector, dt);
    }

    resolveBallCollision(ball, object) {
        ball.radius;
    }

    sphereCircleIntersection(c_c, r_c, n, c_s, r_s ) {
        // circleCenter, circleRadius, circleNormal, sphereCenter, sphereRadius

        // Calculates distance between spheres center and the plane
        const d = vec3.dot(n, vec3.sub(vec3.create(), c_c, c_s));
        
        // No intersection with the plane.
        if (Math.abs(d) > r_s) {
            return false;
        }

        // Calculate where is spheres center projected on the plane.
        const c_p = vec3.add(vec3.create(), c_s, vec3.scale(vec3.create(), n, d));
        
        // If c_p is at the same distance as d (the distance from c_s to the plane),
        // then c_p is the only point on the plane.
        const TOLERANCE = 0.00001;
        if (areEqualWithTolerance(d, r_s, 0.0001)) {
            
            const centerDistance = vec3.dist(c_p, c_c);
            if (areEqualWithTolerance(centerDistance, r_c, TOLERANCE)) {
                return c_p;
            } 
            return false;
        }

        // There are multiple points intersecting the circles plane, so we need to
        // calculate new radius of the circle we get from intersecting the sphere
        // with the plane.
        const r_p = Math.sqrt(r_s*r_s - d*d);


        // Check if there is no intersection.
        const centerDistance = vec3.dist(c_p, c_c);
        if (centerDistance > r_p + r_c) {
            return false;
        }
        
        // Check if sphere is inside the circle indicataing a point.
        const sphereProjectionInsideTheCircle = centerDistance + r_p < r_c;
        const sphereUnderTheCircle = c_s[1] < c_c[1]; // Sphere center is under the circle plane
        // TODO: Check if sphere has an upward direction
        if (sphereProjectionInsideTheCircle && sphereUnderTheCircle) {
            return true;
        }

        if (sphereProjectionInsideTheCircle) {
            return;
        }
        
        // Check if there is one point intersection
        if (areEqualWithTolerance(centerDistance, r_p + r_c, TOLERANCE)) {
            // Calculate a line form c_c to c_p.
            // Move form c_c with the interCenterLine pointing to c_p
            // for a length of the r_c devided by the distance between centers.
            const interCenterLine = vec3.sub(vec3.create(), c_c, c_p);
            return vec3.scaleAndAdd(vec3.create(), c_c, interCenterLine, r_c/centerDistance);
        }
        
        // Check if there is one point intersection from within the circle.
        if (areEqualWithTolerance(centerDistance + r_p, r_c, TOLERANCE)) {
            const interCenterLine = vec3.sub(vec3.create(), c_p, c_c);
            return vec3.scaleAndAdd(vec3.create(), c_c, interCenterLine, r_c/centerDistance);
        }
        
        // debugger;
        // The only oother option are two intersection points.
        // An intersection of the line between c_c and c_p and the circle circumference
        // is chosen as the return intersection point.
        const interCenterLine = vec3.sub(vec3.create(), c_p, c_c);
        return vec3.scaleAndAdd(vec3.create(), c_c, interCenterLine, r_c/centerDistance);
    }

    getCameraCorrectionVector(aBox, bBox) {
        
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

        return minDirection;

    }

    getClosestTriangle(basketballTransform, basketball, objectModel) {
        
        const rayOrigin = basketballTransform.translation;
        const rayVector = basketball.velocity;
        var closestTriangleDistance = Infinity;
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
            
        });

        return closestTriangle;
    }

    getBasketballReboundVector(basketball, normal, dampingFactor = 0.7) {

        let velocity = basketball.velocity;

        const parallelV = vec3.scale(vec3.create(), normal, vec3.dot(velocity, normal));
        const reflectedV = vec3.scaleAndAdd(vec3.create(), velocity, parallelV, -2);

        // console.log(Math.abs(Math.abs(vec3.dot(normal, vec3.normalize(vec3.create(), velocity)))-1.05));
        // dampingFactor = Math.abs(Math.abs(vec3.dot(normal, vec3.normalize(vec3.create(), velocity)))-1.05)
        const reflectedDampedV = vec3.scale(vec3.create(), reflectedV, dampingFactor);
        
        basketball.velocity = reflectedDampedV;
        return reflectedDampedV;
    }

    getDefaultObjectNormal(basketballTransform, basketball, object) {
                
        const objectModel = object.getComponentOfType(Model);
        if (!objectModel) {
            return;
        }
        
        const closestTriangle = this.getClosestTriangle(basketballTransform, basketball, objectModel);
        if (!closestTriangle) {
            return;
        }

        // Calculates average normal vector of 3 triangle vertices.
        const normalSum_v01 = vec3.add(vec3.create(), closestTriangle.vertex0.normal, closestTriangle.vertex1.normal)
        const normalSum = vec3.add(vec3.create() , closestTriangle.vertex2.normal, normalSum_v01);  
        var normal = vec3.normalize(vec3.create(), normalSum);

        return normal;
    }

    getFenceNormal(fenceNode) {

        if (fenceNode.name == "Base_fence.001") {
            return [0, 0, 1];
        } else if (fenceNode.name == "Base_fence.002") {
            return [1, 0, 0];
        } else if (fenceNode.name == "Base_fence.003") {
            return [-1, 0, 0];
        } else if (fenceNode.name == "Base_fence.004") {
            return [0, 0, -1];
        }
    }

    getBackbordNormal(basketballTransform, basketball, b) {

        const basketNumber = b.name.split('.')[1];
        const whiteBackboard = this.scene.find(node => node.name == `Backboard_white.${basketNumber}`);
        var normal = this.getDefaultObjectNormal(basketballTransform, basketball, whiteBackboard);
        
        if (!normal) {
            normal = this.getDefaultObjectNormal(basketballTransform, basketball, b);
        }

        return normal;
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
