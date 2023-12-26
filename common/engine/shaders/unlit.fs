#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uBaseTexture;
uniform vec4 uBaseFactor;
uniform int uPrimitiveType;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    if (uPrimitiveType == 0) {
        oColor = uBaseFactor;
    } else {
        vec4 baseColor = texture(uBaseTexture, vTexCoord);
        oColor = uBaseFactor * baseColor;
    }
    
}
