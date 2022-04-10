import { mat4, vec3 } from "gl-matrix";
import { createCube, loadTexture } from "./helpers";

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DESIRED_FPS = 60;
const USE_KEYBOARD = false;

function main(): void {
    const canvas = document.createElement("canvas");
    canvas.width = DEFAULT_WIDTH;
    canvas.height = DEFAULT_HEIGHT;

    document.body.appendChild(canvas);

    let gl: WebGLRenderingContext | WebGL2RenderingContext;

    gl = canvas.getContext("webgl2");
    if (!gl) {
        gl = canvas.getContext("webgl");
    }
    if (!gl) {
        throw new Error("Your browser does not support WebGL.");
    }

    // Print driver info
    console.info(
        `${gl.getParameter(gl.VERSION)}\n` +
            `${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}\n` +
            `Vendor: ${gl.getParameter(gl.VENDOR)}\n` +
            `Renderer: ${gl.getParameter(gl.RENDERER)}`
    );

    const keys = new Map<string, boolean>();
    window.addEventListener("keydown", (e) => {
        keys.set(e.key, true);
    });
    window.addEventListener("keyup", (e) => {
        keys.set(e.key, false);
    });

    // Vertex shader
    const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aColor;
    attribute vec2 aTextureCoord;

    varying lowp vec4 vColor;
    varying highp vec2 vTextureCoord;

    uniform mat4 uMatProj;
    uniform mat4 uMatView;
    uniform mat4 uMatModel;

    void main() {
        mat4 mvp = uMatProj * uMatView * uMatModel;

        gl_Position = mvp * vec4(aPosition, 1);
        // vColor = vec4(aColor, 1);
        vTextureCoord = aTextureCoord;
    }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource.trim());
    gl.compileShader(vertexShader);

    // Fragment shader
    const fragmentShaderSource = `
    varying lowp vec4 vColor;
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main() {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
    `;

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource.trim());
    gl.compileShader(fragmentShader);

    // Shader program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(
            "Error linking shader program.",
            gl.getProgramInfoLog(program)
        );
        console.error("Vertex shader log: ", gl.getShaderInfoLog(vertexShader));
        console.error(
            "Fragment shader log: ",
            gl.getShaderInfoLog(fragmentShader)
        );

        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return;
    }

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // Use shader program
    gl.useProgram(program);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    const aColor = gl.getAttribLocation(program, "aColor");
    const aTextureCoord = gl.getAttribLocation(program, "aTextureCoord");
    const uMatProj = gl.getUniformLocation(program, "uMatProj");
    const uMatView = gl.getUniformLocation(program, "uMatView");
    const uMatModel = gl.getUniformLocation(program, "uMatModel");

    const uSampler = gl.getUniformLocation(program, "uSampler");

    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#always_enable_vertex_attrib_0_as_an_array
    gl.enableVertexAttribArray(0);

    const { vertices, texCoords, elements, elementCount } = createCube(gl);
    const texture = loadTexture(gl, "./cubetexture.png");

    // Bind vertex buffer and configure shader inputs
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    // gl.bindBuffer(gl.ARRAY_BUFFER, colors);
    // gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(aColor);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoords);
    gl.vertexAttribPointer(aTextureCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aTextureCoord);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uSampler, 0);

    const uProjectionMatrix = mat4.perspective(
        mat4.create(),
        45.0,
        canvas.width / canvas.height,
        0.1,
        10.0
    );
    const uViewMatrix = mat4.lookAt(
        mat4.create(),
        vec3.fromValues(0, 0, -5),
        vec3.create(),
        vec3.fromValues(0, 1, 0)
    );
    const uModelMatrix = mat4.identity(mat4.create());

    /**
     * Update the world.
     * @param deltaTime Time elapsed between the previous frame and the current frame.
     */
    function update(deltaTime: number): void {
        const rad = deltaTime / 1000;

        if (!USE_KEYBOARD) {
            mat4.rotate(uModelMatrix, uModelMatrix, rad, [0, 1, 1]);
            return;
        }

        if (keys.get("ArrowLeft")) {
            mat4.rotateY(uModelMatrix, uModelMatrix, rad);
        } else if (keys.get("ArrowRight")) {
            mat4.rotateY(uModelMatrix, uModelMatrix, -rad);
        }
    }

    // Set clear color to black
    gl.clearColor(0, 0, 0, 1);

    // Enable deepth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    /**
     * Render the world.
     */
    function render(): void {
        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Set matrices
        gl.uniformMatrix4fv(uMatProj, false, uProjectionMatrix);
        gl.uniformMatrix4fv(uMatView, false, uViewMatrix);
        gl.uniformMatrix4fv(uMatModel, false, uModelMatrix);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
        gl.drawElements(gl.TRIANGLES, elementCount, gl.UNSIGNED_SHORT, 0);
    }

    const interval = DESIRED_FPS / 1000;
    let lastFrameTime: DOMHighResTimeStamp;

    /**
     * Game loop.
     * @param timestamp Ticks elapsed since start
     */
    function tick(timestamp: DOMHighResTimeStamp): void {
        if (!lastFrameTime) {
            lastFrameTime = timestamp;
        }

        requestAnimationFrame(tick);

        const deltaTime = timestamp - lastFrameTime;

        if (deltaTime > interval) {
            update(deltaTime);
            lastFrameTime = timestamp - (deltaTime % interval);
            render();
        }
    }

    requestAnimationFrame(tick);
}

window.addEventListener("load", main);
