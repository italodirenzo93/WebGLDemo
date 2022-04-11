import { ReadonlyMat4 } from "gl-matrix";
import { minifyShaderCode } from "./helpers";

interface UniformBufferMVP {
    uMatProj: ReadonlyMat4;
    uMatView: ReadonlyMat4;
    uMatModel: ReadonlyMat4;
}

// Vertex shader
const vertexShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location=0) in vec3 a_Position;
layout(location=1) in vec2 a_TextureCoord;

out vec2 textureCoord;

uniform mat4 u_MatProj;
uniform mat4 u_MatView;
uniform mat4 u_MatModel;

// uniform MVP {
//     mat4 uMatProj;
//     mat4 uMatView;
//     mat4 uMatModel;
// };

void main() {
    gl_Position = u_MatProj * u_MatView * u_MatModel * vec4(a_Position, 1);
    textureCoord = a_TextureCoord;
}`;

// Fragment shader
const fragmentShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec2 textureCoord;
out vec4 fragColor;

uniform sampler2D u_Sampler;

void main() {
    fragColor = texture(u_Sampler, textureCoord);
}`;

export class ShaderProgram {
    private static s_program: WebGLProgram;

    private static s_aPosition: number;
    private static s_aTextureCoord: number;

    private static s_uMatProj: WebGLUniformLocation;
    private static s_uMatView: WebGLUniformLocation;
    private static s_uMatModel: WebGLUniformLocation;
    private static s_uSampler: WebGLUniformLocation;

    // private static s_uniformBuffer: WebGLBuffer;

    constructor(private readonly gl: WebGL2RenderingContext) {
        // If the program hasn't been compiled and linked already do it now
        if (!ShaderProgram.s_program) {
            ShaderProgram.compileAndLink(gl);
        }
    }

    get program(): WebGLProgram {
        return ShaderProgram.s_program;
    }

    use() {
        this.gl.useProgram(ShaderProgram.s_program);
    }

    setVertexData(buffer: WebGLBuffer | null) {
        if (buffer) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
            this.gl.vertexAttribPointer(
                ShaderProgram.s_aPosition,
                3,
                this.gl.FLOAT,
                false,
                0,
                0
            );
            this.gl.enableVertexAttribArray(ShaderProgram.s_aPosition);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        } else {
            this.gl.disableVertexAttribArray(ShaderProgram.s_aPosition);
        }
    }

    setTextureCoordinates(buffer: WebGLBuffer | null) {
        if (buffer) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
            this.gl.vertexAttribPointer(
                ShaderProgram.s_aTextureCoord,
                2,
                this.gl.FLOAT,
                false,
                0,
                0
            );
            this.gl.enableVertexAttribArray(ShaderProgram.s_aTextureCoord);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        } else {
            this.gl.disableVertexAttribArray(ShaderProgram.s_aTextureCoord);
        }
    }

    setProjectionMatrix(matrix: ReadonlyMat4): void {
        this.gl.uniformMatrix4fv(ShaderProgram.s_uMatProj, false, matrix);
    }

    setViewMatrix(matrix: ReadonlyMat4): void {
        this.gl.uniformMatrix4fv(ShaderProgram.s_uMatView, false, matrix);
    }

    setModelMatrix(matrix: ReadonlyMat4): void {
        this.gl.uniformMatrix4fv(ShaderProgram.s_uMatModel, false, matrix);
    }

    setTexture(texture: WebGLTexture): void {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(ShaderProgram.s_uSampler, 0);
    }

    private static compileAndLink(gl: WebGL2RenderingContext): void {
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, minifyShaderCode(vertexShaderSource));
        gl.compileShader(vertexShader);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, minifyShaderCode(fragmentShaderSource));
        gl.compileShader(fragmentShader);

        // Shader program
        ShaderProgram.s_program = gl.createProgram();
        gl.attachShader(ShaderProgram.s_program, vertexShader);
        gl.attachShader(ShaderProgram.s_program, fragmentShader);
        gl.linkProgram(ShaderProgram.s_program);

        if (!gl.getProgramParameter(ShaderProgram.s_program, gl.LINK_STATUS)) {
            console.error(
                "Error linking shader program.",
                gl.getProgramInfoLog(ShaderProgram.s_program)
            );
            console.error(
                "Vertex shader log: ",
                gl.getShaderInfoLog(vertexShader)
            );
            console.error(
                "Fragment shader log: ",
                gl.getShaderInfoLog(fragmentShader)
            );

            gl.deleteProgram(ShaderProgram.s_program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            return;
        }

        gl.detachShader(ShaderProgram.s_program, vertexShader);
        gl.detachShader(ShaderProgram.s_program, fragmentShader);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        // Get locations
        ShaderProgram.s_aPosition = 0;
        ShaderProgram.s_aTextureCoord = 1;

        ShaderProgram.s_uMatProj = gl.getUniformLocation(
            ShaderProgram.s_program,
            "u_MatProj"
        );

        ShaderProgram.s_uMatView = gl.getUniformLocation(
            ShaderProgram.s_program,
            "u_MatView"
        );

        ShaderProgram.s_uMatModel = gl.getUniformLocation(
            ShaderProgram.s_program,
            "u_MatModel"
        );

        ShaderProgram.s_uSampler = gl.getUniformLocation(
            ShaderProgram.s_program,
            "u_Sampler"
        );

        // Uniform buffer
        // {
        //     const blockIndex = gl.getUniformBlockIndex(
        //         ShaderProgram.s_program,
        //         "MVP"
        //     );
        //     const blockSize = gl.getActiveUniformBlockParameter(
        //         ShaderProgram.s_program,
        //         blockIndex,
        //         gl.UNIFORM_BLOCK_DATA_SIZE
        //     );

        //     const uniformBuffer = gl.createBuffer();
        //     gl.bindBuffer(gl.UNIFORM_BUFFER, uniformBuffer);
        //     gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);
        //     gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        //     // Bind the buffer to a binding point
        //     // Think of it as storing the buffer into a special UBO ArrayList
        //     // The second argument is the index you want to store your Uniform Buffer in
        //     // Let's say you have 2 unique UBO, you'll store the first one in index 0 and the second one in index 1
        //     gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uniformBuffer);
        // }
    }
}
