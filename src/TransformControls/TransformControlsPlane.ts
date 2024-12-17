import {
  DoubleSide,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneBufferGeometry,
  Quaternion,
  Vector3,
} from "three";

export class TransformControlsPlane extends Mesh {
  readonly type: string = "TransformControlsPlane";
  space: string = "world";
  mode: string = "translate";
  axis: string | null = null;
  size: number = 1;
  dragging: boolean = false;
  showX: boolean = true;
  showY: boolean = true;
  showZ: boolean = true;
  eye: Vector3 = new Vector3();
  worldPosition: Vector3 = new Vector3();
  worldQuaternion: Quaternion = new Quaternion();
  cameraQuaternion: Quaternion = new Quaternion();

  private unitX: Vector3 = new Vector3(1, 0, 0);
  private unitY: Vector3 = new Vector3(0, 1, 0);
  private unitZ: Vector3 = new Vector3(0, 0, 1);
  private tempVector: Vector3 = new Vector3();
  private dirVector: Vector3 = new Vector3();
  private alignVector: Vector3 = new Vector3();
  private tempMatrix: Matrix4 = new Matrix4();
  private identityQuaternion: Quaternion = new Quaternion();

  constructor() {
    super(
      new PlaneBufferGeometry(100000, 100000, 2, 2),
      new MeshBasicMaterial({
        visible: false,
        wireframe: true,
        side: DoubleSide,
        transparent: true,
        opacity: 0.1,
        toneMapped: false,
      }),
    );
  }

  updateMatrixWorld(force?: boolean): void {
    this.position.copy(this.worldPosition);

    const quaternion =
      this.mode === "scale" || this.space === "local"
        ? this.worldQuaternion
        : this.identityQuaternion;

    this.unitX.set(1, 0, 0).applyQuaternion(quaternion);
    this.unitY.set(0, 1, 0).applyQuaternion(quaternion);
    this.unitZ.set(0, 0, 1).applyQuaternion(quaternion);

    // Align the plane for current transform mode, axis and space.
    this.alignVector.copy(this.unitY);

    switch (this.mode) {
      case "translate":
      case "scale":
        switch (this.axis) {
          case "X":
            this.alignVector.copy(this.eye).cross(this.unitX);
            this.dirVector.copy(this.unitX).cross(this.alignVector);
            break;
          case "Y":
            this.alignVector.copy(this.eye).cross(this.unitY);
            this.dirVector.copy(this.unitY).cross(this.alignVector);
            break;
          case "Z":
            this.alignVector.copy(this.eye).cross(this.unitZ);
            this.dirVector.copy(this.unitZ).cross(this.alignVector);
            break;
          case "XY":
            this.dirVector.copy(this.unitZ);
            break;
          case "YZ":
            this.dirVector.copy(this.unitX);
            break;
          case "XZ":
            this.alignVector.copy(this.unitZ);
            this.dirVector.copy(this.unitY);
            break;
          case "XYZ":
          case "E":
            this.dirVector.set(0, 0, 0);
            break;
        }
        break;
      case "rotate":
      default:
        // special case for rotate
        this.dirVector.set(0, 0, 0);
    }

    if (this.dirVector.length() === 0) {
      // If in rotate mode, make the plane parallel to camera
      this.quaternion.copy(this.cameraQuaternion);
    } else {
      this.tempMatrix.lookAt(
        this.tempVector.set(0, 0, 0),
        this.dirVector,
        this.alignVector,
      );
      this.quaternion.setFromRotationMatrix(this.tempMatrix);
    }

    super.updateMatrixWorld(force);
  }
}
