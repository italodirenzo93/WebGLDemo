import { mat4, quat, ReadonlyMat4, ReadonlyQuat, ReadonlyVec3, vec3 } from "gl-matrix";
import { createCube, GeometricPrimitive } from "./helpers";
import { ShaderProgram } from "./ShaderProgram";

class CubeObject {
    private _data: GeometricPrimitive;
    private _modelMatrix: mat4 = mat4.create();
    private _dirty = true;

    constructor(
        private readonly gl: WebGL2RenderingContext,
        private _position: ReadonlyVec3 = vec3.create(),
        private _rotation: ReadonlyQuat = quat.create()
    ) {
        this._data = createCube(gl);
    }

    get position(): ReadonlyVec3 {
        return this._position;
    }

    set position(position: ReadonlyVec3) {
        this._position = position;
        this._dirty = true;
    }

    get rotation(): ReadonlyQuat {
        return this._rotation;
    }

    set rotation(rotation: ReadonlyQuat) {
        this._rotation = rotation;
        this._dirty = true;
    }

    get modelMatrix(): ReadonlyMat4 {
        if (this._dirty) {
            mat4.fromRotationTranslation(this._modelMatrix, this._rotation, this._position);
            this._dirty = false;
        }
        return this._modelMatrix;
    }

    render(program: ShaderProgram): void {
        program.setModelMatrix(this.modelMatrix);
        program.setVertexData(this._data.vertices);
        program.setTextureCoordinates(this._data.texCoords);

        // Draw indexed
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this._data.elements);
        this.gl.drawElements(this.gl.TRIANGLES, this._data.elementCount, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }
}

export default CubeObject;
