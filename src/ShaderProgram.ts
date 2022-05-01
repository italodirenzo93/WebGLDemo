import { ReadonlyMat4 } from "gl-matrix";
import { minifyShaderCode } from "./helpers";

// Vertex shader
const vertexShaderSource = `
attribute vec3 aPosition;
attribute vec3 aColor;
attribute vec2 aTextureCoord;

varying highp vec2 vTextureCoord;

uniform mat4 uMatProj;
uniform mat4 uMatView;
uniform mat4 uMatModel;

void main() {
    mat4 mvp = uMatProj * uMatView * uMatModel;

    gl_Position = mvp * vec4(aPosition, 1);
    vTextureCoord = aTextureCoord;
}`;

// Fragment shader
const fragmentShaderSource = `
varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;

void main() {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
}`;

export class ShaderProgram {
    private static s_program: WebGLProgram;

    private static s_aPosition: number;
    private static s_aTextureCoord: number;

    private static s_uMatProj: WebGLUniformLocation;
    private static s_uMatView: WebGLUniformLocation;
    private static s_uMatModel: WebGLUniformLocation;
    private static s_uSampler: WebGLUniformLocation;

    constructor(private readonly gl: WebGLRenderingContext) {
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

    setTexture(texture: WebGLTexture) {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(ShaderProgram.s_uSampler, 0);
    }

    private static compileAndLink(gl: WebGLRenderingContext): void {
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
        ShaderProgram.s_aPosition = gl.getAttribLocation(
            ShaderProgram.s_program,
            "aPosition"
        );

        ShaderProgram.s_aTextureCoord = gl.getAttribLocation(
            ShaderProgram.s_program,
            "aTextureCoord"
        );

        ShaderProgram.s_uMatProj = gl.getUniformLocation(
            ShaderProgram.s_program,
            "uMatProj"
        );

        ShaderProgram.s_uMatView = gl.getUniformLocation(
            ShaderProgram.s_program,
            "uMatView"
        );

        ShaderProgram.s_uMatModel = gl.getUniformLocation(
            ShaderProgram.s_program,
            "uMatModel"
        );

        ShaderProgram.s_uSampler = gl.getUniformLocation(
            ShaderProgram.s_program,
            "uSampler"
        );
    }
}
