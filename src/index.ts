import { mat4, vec3 } from "gl-matrix";

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

    // window.addEventListener("resize", () => {
    //     gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    // });
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

    varying lowp vec4 vColor;

    uniform mat4 uMatProj;
    uniform mat4 uMatView;
    uniform mat4 uMatModel;

    void main() {
        mat4 mvp = uMatProj * uMatView * uMatModel;

        gl_Position = mvp * vec4(aPosition, 1);
        vColor = vec4(aColor, 1);
    }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource.trim());
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error(
            "Error compiling vertex shader.",
            gl.getShaderInfoLog(vertexShader)
        );
        gl.deleteShader(vertexShader);
        return;
    }

    // Fragment shader
    const fragmentShaderSource = `
    varying lowp vec4 vColor;

    void main() {
        gl_FragColor = vColor;
    }
    `;

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource.trim());
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error(
            "Error compiling fragment shader.",
            gl.getShaderInfoLog(fragmentShader)
        );
        gl.deleteShader(fragmentShader);
        return;
    }

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
        gl.deleteProgram(program);
        return;
    }

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // prettier-ignore
    const vertices = [
        -0.5, -0.5, 0.0,
        0.0, 0.5, 0.0,
        0.5, -0.5, 0.0
    ];
    // prettier-ignore
    const colors = [
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0
    ];

    // Vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    const aColor = gl.getAttribLocation(program, "aColor");
    const uMatProj = gl.getUniformLocation(program, "uMatProj");
    const uMatView = gl.getUniformLocation(program, "uMatView");
    const uMatModel = gl.getUniformLocation(program, "uMatModel");

    const uProjectionMatrix = mat4.perspective(
        mat4.create(),
        45.0,
        canvas.width / canvas.height,
        0.1,
        10.0
    );
    const uViewMatrix = mat4.lookAt(
        mat4.create(),
        vec3.fromValues(0, 1, -2),
        vec3.create(),
        vec3.fromValues(0, 1, 0)
    );
    const uModelMatrix = mat4.identity(mat4.create());

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    /**
     * Update the world.
     * @param deltaTime Time elapsed between the previous frame and the current frame.
     */
    function update(deltaTime: number): void {
        const rad = deltaTime / 1000;

        if (!USE_KEYBOARD) {
            mat4.rotateY(uModelMatrix, uModelMatrix, rad);
            return;
        }

        if (keys.get("ArrowLeft")) {
            mat4.rotateY(uModelMatrix, uModelMatrix, rad);
        } else if (keys.get("ArrowRight")) {
            mat4.rotateY(uModelMatrix, uModelMatrix, -rad);
        }
    }

    /**
     * Render the world.
     */
    function render(): void {
        // Set clear color to black
        gl.clearColor(0, 0, 0, 1);

        // Enable deepth testing
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Use shader program
        gl.useProgram(program);

        // Bind vertex buffer and configure shader inputs
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aColor);

        // Set matrices
        gl.uniformMatrix4fv(uMatProj, false, uProjectionMatrix);
        gl.uniformMatrix4fv(uMatView, false, uViewMatrix);
        gl.uniformMatrix4fv(uMatModel, false, uModelMatrix);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
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
