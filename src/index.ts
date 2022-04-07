function main() {
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    document.body.appendChild(canvas);

    const gl = canvas.getContext("webgl2");

    window.addEventListener("resize", () => {
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    });

    // Vertex shader
    const vertexShaderSource = `
    attribute vec3 aPosition;

    void main() {
        gl_Position = vec4(aPosition, 1);
    }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource.trim());
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("Error compiling vertex shader.", gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader);
        return;
    }

    // Fragment shader
    const fragmentShaderSource = `
    void main() {
        gl_FragColor = vec4(1, 1, 1, 1);
    }
    `;

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource.trim());
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("Error compiling fragment shader.", gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(fragmentShader);
        return;
    }

    // Shader program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Error linking shader program.", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return;
    }

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // Vertex buffer
    const vertices = [
        -0.5, -0.5, 1.0,
        0.0, 0.5, 1.0,
        0.5, -0.5, 1.0,
    ];

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");

    /**
     * Game loop.
     * @param timestamp Ticks elapsed since start
     */
    function tick(timestamp: DOMHighResTimeStamp) {
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

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

window.addEventListener('load', main);
