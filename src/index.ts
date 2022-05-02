import { mat4, quat, vec3 } from "gl-matrix";
import { Colors } from "./Color";
import CubeObject from "./CubeObject";
import { loadTextureFromElement } from "./helpers";
import { ShaderProgram } from "./ShaderProgram";

const DESIRED_FPS = 60;

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

    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#always_enable_vertex_attrib_0_as_an_array
    gl.enableVertexAttribArray(0);

    const texture = await loadTextureFromElement(gl, document.getElementById("cube-texture") as HTMLImageElement);

    const sceneObjects = [
        new CubeObject(gl, [0.5, 0.5, 0.5], quat.create(), vec3.fromValues(1, 1, 1), texture),
        new CubeObject(gl, [-0.5, -0.5, -0.5], quat.create(), vec3.fromValues(0.5, 0.5, 0.5), texture),
    ];

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

    /**
     * Update the world.
     * @param deltaTime Time elapsed between the previous frame and the current frame.
     */
    function update(deltaTime: number): void {
        const rad = deltaTime / 1000;

        for (const obj of sceneObjects) {
            obj.rotation = quat.rotateY(quat.create(), obj.rotation, rad);
        }
    }

    // Set clear color to the classic cornflower blue
    gl.clearColor(...Colors.cornflowerBlue.values());

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    shaderProgram.setProjectionMatrix(uProjectionMatrix);
    shaderProgram.setViewMatrix(uViewMatrix);

    /**
     * Render the world.
     */
    function render(): void {
        // Use shader program
        shaderProgram.use();

        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Render scene objects
        for (const obj of sceneObjects) {
            obj.render(shaderProgram);
        }
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
