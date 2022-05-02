import { ReadonlyMat4 } from "gl-matrix";
import { minifyShaderCode } from "./helpers";

// Vertex shader
const vertexShaderSource = `#version 300 es
layout(location=0) in vec3 a_Position;
layout(location=1) in vec2 a_TextureCoord;

out vec2 textureCoord;

uniform MVP {
    mat4 u_MatProj;
    mat4 u_MatView;
    mat4 u_MatModel;
};

void main() {
    gl_Position = u_MatProj * u_MatView * u_MatModel * vec4(a_Position, 1);
    textureCoord = a_TextureCoord;
}`;

// Fragment shader
const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 textureCoord;
out vec4 fragColor;

uniform sampler2D u_Sampler;

void main() {
    fragColor = texture(u_Sampler, textureCoord);
}`;

const uniformNames = ["u_MatProj", "u_MatView", "u_MatModel"] as const;
type UniformName = typeof uniformNames[number];

interface UniformVariableInfo {
    index: number;
    offset: number;
}

export class ShaderProgram {
    private static s_program: WebGLProgram;

    private static s_aPosition: number;
    private static s_aTextureCoord: number;

    private static s_uSampler: WebGLUniformLocation;
    private static s_uniformBuffer: WebGLBuffer;

    private static s_uniformInfo: Record<UniformName, UniformVariableInfo> = {
        u_MatProj: {
            index: -1,
            offset: -1,
        },
        u_MatView: {
            index: -1,
            offset: -1,
        },
        u_MatModel: {
            index: -1,
            offset: -1,
        },
    };

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

    setVertexData(buffer: WebGLBuffer | null): void {
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

    setTextureCoordinates(buffer: WebGLBuffer | null): void {
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
        ShaderProgram.setUniformMatrix(this.gl, "u_MatProj", matrix);
    }

    setViewMatrix(matrix: ReadonlyMat4): void {
        ShaderProgram.setUniformMatrix(this.gl, "u_MatView", matrix);
    }

    setModelMatrix(matrix: ReadonlyMat4): void {
        ShaderProgram.setUniformMatrix(this.gl, "u_MatModel", matrix);
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

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(vertexShader));
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, minifyShaderCode(fragmentShaderSource));
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(fragmentShader));
        }

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

        ShaderProgram.s_uSampler = gl.getUniformLocation(
            ShaderProgram.s_program,
            "u_Sampler"
        );

        // Uniform buffer
        {
            const blockIndex = gl.getUniformBlockIndex(
                ShaderProgram.s_program,
                "MVP"
            );

            gl.uniformBlockBinding(ShaderProgram.s_program, blockIndex, 0);

            const blockSize = gl.getActiveUniformBlockParameter(
                ShaderProgram.s_program,
                blockIndex,
                gl.UNIFORM_BLOCK_DATA_SIZE
            );

            ShaderProgram.s_uniformBuffer = gl.createBuffer();
            gl.bindBuffer(gl.UNIFORM_BUFFER, ShaderProgram.s_uniformBuffer);
            gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);

            // Bind the buffer to a binding point
            // Think of it as storing the buffer into a special UBO ArrayList
            // The second argument is the index you want to store your Uniform Buffer in
            // Let's say you have 2 unique UBO, you'll store the first one in index 0 and the second one in index 1
            gl.bindBufferBase(
                gl.UNIFORM_BUFFER,
                blockIndex,
                ShaderProgram.s_uniformBuffer
            );

            const uniformIndices = gl.getUniformIndices(
                ShaderProgram.s_program,
                uniformNames
            );

            const uniformOffsets = gl.getActiveUniforms(
                ShaderProgram.s_program,
                uniformIndices,
                gl.UNIFORM_OFFSET
            );

            uniformNames.forEach((name, index) => {
                ShaderProgram.s_uniformInfo[name].index = uniformIndices[index];
                ShaderProgram.s_uniformInfo[name].offset =
                    uniformOffsets[index];
            });
        }
    }

    private static setUniformMatrix(
        gl: WebGL2RenderingContext,
        name: UniformName,
        matrix: ReadonlyMat4
    ): void {
        gl.bindBuffer(gl.UNIFORM_BUFFER, ShaderProgram.s_uniformBuffer);

        gl.bufferSubData(
            gl.UNIFORM_BUFFER,
            ShaderProgram.s_uniformInfo[name].offset,
            new Float32Array(matrix)
        );

        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }
}
