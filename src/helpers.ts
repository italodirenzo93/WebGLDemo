export interface IPrimitiveBuffers {
    vertices: WebGLBuffer;
    colors: WebGLBuffer;
    elements: WebGLBuffer;
    elementCount: number;
}

// prettier-ignore
const cubeVertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
] as const;

// prettier-ignore
const cubeColors = [
    1.0,  1.0,  1.0,    // Front face: white
    1.0,  1.0,  1.0,    // Front face: white
    1.0,  1.0,  1.0,    // Front face: white
    1.0,  1.0,  1.0,    // Front face: white

    1.0,  0.0,  0.0,    // Back face: red
    1.0,  0.0,  0.0,    // Back face: red
    1.0,  0.0,  0.0,    // Back face: red
    1.0,  0.0,  0.0,    // Back face: red

    0.0,  1.0,  0.0,    // Top face: green
    0.0,  1.0,  0.0,    // Top face: green
    0.0,  1.0,  0.0,    // Top face: green
    0.0,  1.0,  0.0,    // Top face: green

    0.0,  0.0,  1.0,    // Bottom face: blue
    0.0,  0.0,  1.0,    // Bottom face: blue
    0.0,  0.0,  1.0,    // Bottom face: blue
    0.0,  0.0,  1.0,    // Bottom face: blue

    1.0,  1.0,  0.0,    // Right face: yellow
    1.0,  1.0,  0.0,    // Right face: yellow
    1.0,  1.0,  0.0,    // Right face: yellow
    1.0,  1.0,  0.0,    // Right face: yellow

    1.0,  0.0,  1.0,    // Left face: purple
    1.0,  0.0,  1.0,    // Left face: purple
    1.0,  0.0,  1.0,    // Left face: purple
    1.0,  0.0,  1.0,    // Left face: purple
] as const;

// prettier-ignore
const cubeIndices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
] as const;

export function createCube(gl: WebGLRenderingContext): IPrimitiveBuffers {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(cubeVertices),
        gl.STATIC_DRAW
    );

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(cubeColors),
        gl.STATIC_DRAW
    );

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(cubeIndices),
        gl.STATIC_DRAW
    );

    return {
        vertices: vertexBuffer,
        colors: colorBuffer,
        elements: indexBuffer,
        elementCount: 36 /*indices.length*/,
    };
}
