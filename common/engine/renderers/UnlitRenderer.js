import { mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../WebGL.js';

import { BaseRenderer } from './BaseRenderer.js';

import {
    getLocalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    getModels,
} from '../core/SceneUtils.js';

export class UnlitRenderer extends BaseRenderer {

    constructor(canvas) {
        super(canvas);
    }

    async initialize() {
        const gl = this.gl;

        // fetches FRAGMENT and VERTEX shader
        const unlitVertexShader = await fetch(new URL('../shaders/unlit.vs', import.meta.url))
            .then(response => response.text());

        const unlitFragmentShader = await fetch(new URL('../shaders/unlit.fs', import.meta.url))
            .then(response => response.text());

        // and builds PROGRAM 
        this.programs = WebGL.buildPrograms(gl, {
            unlit: {
                vertex: unlitVertexShader,
                fragment: unlitFragmentShader,
            },
        });

        gl.clearColor(1, 1, 1, 1);  // sets gl.COLOR_BUFFER_BIT to black
        gl.enable(gl.DEPTH_TEST);   // depth test   - draws to the screen just the objects that are closest to the camera
        gl.enable(gl.CULL_FACE);    // cull face    - only renders sides of objects facing the viewer which saves on computation
    }

    render(scene, camera) {
        const gl = this.gl;

        // mapping size of canvas to values [-1, 1] on x and y axis
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        // sets frame buffer values (all pixels on the screen) to black and
        // sets depth buffer values to 1 (0 - closest, 1 - farthes relative to the camera) 
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.unlit;
        gl.useProgram(program);

        // traverse the scene graph to obtain view and projection matrix
        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);

        // send the obtained matrices to the WebGL program
        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);


        this.renderNode(scene);
    }

    renderNode(node, modelMatrix = mat4.create()) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.unlit;

        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);
        gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

        const models = getModels(node);
        for (const model of models) {
            for (const primitive of model.primitives) {
                this.renderPrimitive(primitive);
            }
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

    renderPrimitive(primitive) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.unlit;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;

        if (material.baseTexture == undefined) {
            // [!fix] preglej kako upliva sampler in image na izris primirive-a
            gl.uniform1i(uniforms.uPrimitiveType, 0)
            gl.uniform4fv(uniforms.uBaseFactor, material.baseFactor);
        }
        else {
            gl.uniform1i(uniforms.uPrimitiveType, 1)
            gl.uniform4fv(uniforms.uBaseFactor, [1, 1, 1, 1]);

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uniforms.uBaseTexture, 0);

            // [!fix] baseTexture is undefined --> check GLTF build
            const glTexture = this.prepareImage(material.baseTexture.image);
            const glSampler = this.prepareSampler(material.baseTexture.sampler);

            gl.bindTexture(gl.TEXTURE_2D, glTexture);
            gl.bindSampler(0, glSampler);

        }

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
    }

}
