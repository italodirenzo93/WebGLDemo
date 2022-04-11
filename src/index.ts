import { mat4, vec3 } from "gl-matrix";
import { createCube, loadTextureFromElement } from "./helpers";
import { ShaderProgram } from "./ShaderProgram";

const DESIRED_FPS = 60;
const USE_KEYBOARD = false;

export default async function main(canvas: HTMLCanvasElement): Promise<void> {
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        throw new Error("Your browser does not support WebGL 2.");
    }

    // Print driver info
    const glInfo =
        `${gl.getParameter(gl.VERSION)}\n` +
        `${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}\n` +
        `Vendor: ${gl.getParameter(gl.VENDOR)}\n` +
        `Renderer: ${gl.getParameter(gl.RENDERER)}`;

    console.info(glInfo);

    const keys = new Map<string, boolean>();
    window.addEventListener("keydown", (e) => {
        keys.set(e.key, true);
    });
    window.addEventListener("keyup", (e) => {
        keys.set(e.key, false);
    });

    const shaderProgram = new ShaderProgram(gl);
    shaderProgram.use();

    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#always_enable_vertex_attrib_0_as_an_array
    gl.enableVertexAttribArray(0);

    const { vertices, texCoords, elements, elementCount } = createCube(gl);
    const texture = await loadTextureFromElement(gl, document.getElementById("cube-texture") as HTMLImageElement);

    shaderProgram.setVertexData(vertices);
    shaderProgram.setTextureCoordinates(texCoords);
    shaderProgram.setTexture(texture);

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
            mat4.rotate(uModelMatrix, uModelMatrix, rad, [1, 1, 1]);
            return;
        }

        if (keys.get("ArrowLeft")) {
            mat4.rotateY(uModelMatrix, uModelMatrix, -rad);
        } else if (keys.get("ArrowRight")) {
            mat4.rotateY(uModelMatrix, uModelMatrix, rad);
        }
    }

    // Set clear color to black
    gl.clearColor(0, 0, 0, 1);

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    shaderProgram.setProjectionMatrix(uProjectionMatrix);
    shaderProgram.setViewMatrix(uViewMatrix);

    /**
     * Render the world.
     */
    function render(): void {
        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Set matrices
        shaderProgram.setModelMatrix(uModelMatrix);

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
