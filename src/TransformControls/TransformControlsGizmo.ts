import {
  Color,
  Euler,
  Matrix4,
  Object3D,
  Quaternion,
  Vector3,
  Camera,
  OrthographicCamera,
  PerspectiveCamera,
} from "three";
import { TransformationMode, TransformationSpace } from "./types";
import {
  gizmoTranslate,
  helperScale,
  helperRotate,
  helperTranslate,
  pickerScale,
  pickerRotate,
  pickerTranslate,
  gizmoScale,
  gizmoRotate,
} from "./gizmo-constants";

export class TransformControlsGizmo extends Object3D {
  readonly type = "TransformControlsGizmo";
  readonly isTransformControlsGizmo = true;

  mode: TransformationMode;
  space: TransformationSpace;
  enabled: boolean;
  dragging: boolean;

  camera: Camera;
  cameraPosition: Vector3;
  eye: Vector3;

  worldPosition: Vector3;
  worldPositionStart: Vector3;

  worldQuaternion: Quaternion;
  worldQuaternionStart: Quaternion;

  axis: string;
  rotationAxis: Vector3;

  size: 1;

  showX: boolean;
  showY: boolean;
  showZ: boolean;

  private gizmo = {
    translate: this.setupGizmo(gizmoTranslate),
    rotate: this.setupGizmo(gizmoRotate),
    scale: this.setupGizmo(gizmoScale),
  };
  picker = {
    translate: this.setupGizmo(pickerTranslate),
    rotate: this.setupGizmo(pickerRotate),
    scale: this.setupGizmo(pickerScale),
  };
  private helper = {
    translate: this.setupGizmo(helperTranslate),
    rotate: this.setupGizmo(helperRotate),
    scale: this.setupGizmo(helperScale),
  };

  private tempVector = new Vector3(0, 0, 0);
  private tempEuler = new Euler();
  private alignVector = new Vector3(0, 1, 0);
  private zeroVector = new Vector3(0, 0, 0);
  private lookAtMatrix = new Matrix4();
  private tempQuaternion = new Quaternion();
  private tempQuaternion2 = new Quaternion();
  private identityQuaternion = new Quaternion();

  private unitX = new Vector3(1, 0, 0);
  private unitY = new Vector3(0, 1, 0);
  private unitZ = new Vector3(0, 0, 1);

  constructor() {
    super();

    this.initializeGizmos();
  }

  private initializeGizmos() {
    // Pickers should be hidden always
    this.picker.translate.visible = false;
    this.picker.rotate.visible = false;
    this.picker.scale.visible = false;

    // Add all gizmos to the scene
    Object.values(this.gizmo).forEach((g) => this.add(g));
    Object.values(this.picker).forEach((p) => this.add(p));
    Object.values(this.helper).forEach((h) => this.add(h));
  }

  private isOrthographicCamera(camera: Camera): camera is OrthographicCamera {
    return camera.type === "OrthographicCamera";
  }

  private isPerspectiveCamera(camera: Camera): camera is PerspectiveCamera {
    return camera.type === "PerspectiveCamera";
  }

  private setupGizmo(gizmoMap: object) {
    const gizmo = new Object3D();

    for (const name in gizmoMap) {
      for (let i = gizmoMap[name].length; i--; ) {
        const object = gizmoMap[name][i][0].clone();
        const position = gizmoMap[name][i][1];
        const rotation = gizmoMap[name][i][2];
        const scale = gizmoMap[name][i][3];
        const tag = gizmoMap[name][i][4];

        // name and tag properties are essential for picking and updating logic.
        object.name = name;
        object.tag = tag;

        if (position) {
          object.position.set(position[0], position[1], position[2]);
        }

        if (rotation) {
          object.rotation.set(rotation[0], rotation[1], rotation[2]);
        }

        if (scale) {
          object.scale.set(scale[0], scale[1], scale[2]);
        }

        object.updateMatrix();

        const tempGeometry = object.geometry.clone();
        tempGeometry.applyMatrix4(object.matrix);
        object.geometry = tempGeometry;
        object.renderOrder = Infinity;

        object.position.set(0, 0, 0);
        object.rotation.set(0, 0, 0);
        object.scale.set(1, 1, 1);

        gizmo.add(object);
      }
    }

    return gizmo;
  }

  updateMatrixWorld(force?: boolean) {
    const quaternion =
      this.mode === "scale" || this.space === "local"
        ? this.worldQuaternion
        : this.identityQuaternion;

    // Show only gizmos for current transform mode
    this.gizmo.translate.visible = this.mode === "translate";
    this.gizmo.rotate.visible = this.mode === "rotate";
    this.gizmo.scale.visible = this.mode === "scale";

    this.helper.translate.visible = this.mode === "translate";
    this.helper.rotate.visible = this.mode === "rotate";
    this.helper.scale.visible = this.mode === "scale";

    let handles = [];
    handles = handles.concat(this.picker[this.mode].children);
    handles = handles.concat(this.gizmo[this.mode].children);
    handles = handles.concat(this.helper[this.mode].children);

    for (let i = 0; i < handles.length; i++) {
      const handle = handles[i];

      // hide aligned to camera
      handle.visible = true;
      handle.rotation.set(0, 0, 0);
      handle.position.copy(this.worldPosition);

      let factor: number;

      if (this.isOrthographicCamera(this.camera)) {
        factor = (this.camera.top - this.camera.bottom) / this.camera.zoom;
      } else if (this.isPerspectiveCamera(this.camera)) {
        factor =
          this.worldPosition.distanceTo(this.cameraPosition) *
          Math.min(
            (1.9 * Math.tan((Math.PI * this.camera.fov) / 360)) /
              this.camera.zoom,
            7,
          );
      }

      handle.scale.set(1, 1, 1).multiplyScalar((factor * this.size) / 7);

      // TODO: simplify helpers and consider decoupling from gizmo
      if (handle.tag === "helper") {
        handle.visible = false;

        if (handle.name === "AXIS") {
          handle.position.copy(this.worldPositionStart);
          handle.visible = !!this.axis;

          if (this.axis === "X") {
            this.tempQuaternion.setFromEuler(this.tempEuler.set(0, 0, 0));
            handle.quaternion.copy(quaternion).multiply(this.tempQuaternion);

            if (
              Math.abs(
                this.alignVector
                  .copy(this.unitX)
                  .applyQuaternion(quaternion)
                  .dot(this.eye),
              ) > 0.9
            ) {
              handle.visible = false;
            }
          }

          if (this.axis === "Y") {
            this.tempQuaternion.setFromEuler(
              this.tempEuler.set(0, 0, Math.PI / 2),
            );
            handle.quaternion.copy(quaternion).multiply(this.tempQuaternion);

            if (
              Math.abs(
                this.alignVector
                  .copy(this.unitY)
                  .applyQuaternion(quaternion)
                  .dot(this.eye),
              ) > 0.9
            ) {
              handle.visible = false;
            }
          }

          if (this.axis === "Z") {
            this.tempQuaternion.setFromEuler(
              this.tempEuler.set(0, Math.PI / 2, 0),
            );
            handle.quaternion.copy(quaternion).multiply(this.tempQuaternion);

            if (
              Math.abs(
                this.alignVector
                  .copy(this.unitZ)
                  .applyQuaternion(quaternion)
                  .dot(this.eye),
              ) > 0.9
            ) {
              handle.visible = false;
            }
          }

          if (this.axis === "XYZE") {
            this.tempQuaternion.setFromEuler(
              this.tempEuler.set(0, Math.PI / 2, 0),
            );
            this.alignVector.copy(this.rotationAxis);
            handle.quaternion.setFromRotationMatrix(
              this.lookAtMatrix.lookAt(
                this.zeroVector,
                this.alignVector,
                this.unitY,
              ),
            );
            handle.quaternion.multiply(this.tempQuaternion);
            handle.visible = this.dragging;
          }

          if (this.axis === "E") {
            handle.visible = false;
          }
        } else if (handle.name === "START") {
          handle.position.copy(this.worldPositionStart);
          handle.visible = this.dragging;
        } else if (handle.name === "END") {
          handle.position.copy(this.worldPosition);
          handle.visible = this.dragging;
        } else if (handle.name === "DELTA") {
          handle.position.copy(this.worldPositionStart);
          handle.quaternion.copy(this.worldQuaternionStart);
          this.tempVector
            .set(1e-10, 1e-10, 1e-10)
            .add(this.worldPositionStart)
            .sub(this.worldPosition)
            .multiplyScalar(-1);
          this.tempVector.applyQuaternion(
            this.worldQuaternionStart.clone().invert(),
          );
          handle.scale.copy(this.tempVector);
          handle.visible = this.dragging;
        } else {
          handle.quaternion.copy(quaternion);

          if (this.dragging) {
            handle.position.copy(this.worldPositionStart);
          } else {
            handle.position.copy(this.worldPosition);
          }

          if (this.axis) {
            handle.visible = this.axis.search(handle.name) !== -1;
          }
        }

        // If updating helper, skip rest of the loop
        continue;
      }

      // Align handles to current local or world rotation
      handle.quaternion.copy(quaternion);

      if (this.mode === "translate" || this.mode === "scale") {
        // Hide translate and scale axis facing the camera
        const AXIS_HIDE_TRESHOLD = 0.99;
        const PLANE_HIDE_TRESHOLD = 0.2;
        const AXIS_FLIP_TRESHOLD = 0.0;

        if (handle.name === "X" || handle.name === "XYZX") {
          if (
            Math.abs(
              this.alignVector
                .copy(this.unitX)
                .applyQuaternion(quaternion)
                .dot(this.eye),
            ) > AXIS_HIDE_TRESHOLD
          ) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }

        if (handle.name === "Y" || handle.name === "XYZY") {
          if (
            Math.abs(
              this.alignVector
                .copy(this.unitY)
                .applyQuaternion(quaternion)
                .dot(this.eye),
            ) > AXIS_HIDE_TRESHOLD
          ) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }

        if (handle.name === "Z" || handle.name === "XYZZ") {
          if (
            Math.abs(
              this.alignVector
                .copy(this.unitZ)
                .applyQuaternion(quaternion)
                .dot(this.eye),
            ) > AXIS_HIDE_TRESHOLD
          ) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }

        if (handle.name === "XY") {
          if (
            Math.abs(
              this.alignVector
                .copy(this.unitZ)
                .applyQuaternion(quaternion)
                .dot(this.eye),
            ) < PLANE_HIDE_TRESHOLD
          ) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }

        if (handle.name === "YZ") {
          if (
            Math.abs(
              this.alignVector
                .copy(this.unitX)
                .applyQuaternion(quaternion)
                .dot(this.eye),
            ) < PLANE_HIDE_TRESHOLD
          ) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }

        if (handle.name === "XZ") {
          if (
            Math.abs(
              this.alignVector
                .copy(this.unitY)
                .applyQuaternion(quaternion)
                .dot(this.eye),
            ) < PLANE_HIDE_TRESHOLD
          ) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }

        // Flip translate and scale axis ocluded behind another axis
        if (handle.name.search("X") !== -1) {
          if (
            this.alignVector
              .copy(this.unitX)
              .applyQuaternion(quaternion)
              .dot(this.eye) < AXIS_FLIP_TRESHOLD
          ) {
            if (handle.tag === "fwd") {
              handle.visible = false;
            } else {
              handle.scale.x *= -1;
            }
          } else if (handle.tag === "bwd") {
            handle.visible = false;
          }
        }

        if (handle.name.search("Y") !== -1) {
          if (
            this.alignVector
              .copy(this.unitY)
              .applyQuaternion(quaternion)
              .dot(this.eye) < AXIS_FLIP_TRESHOLD
          ) {
            if (handle.tag === "fwd") {
              handle.visible = false;
            } else {
              handle.scale.y *= -1;
            }
          } else if (handle.tag === "bwd") {
            handle.visible = false;
          }
        }

        if (handle.name.search("Z") !== -1) {
          if (
            this.alignVector
              .copy(this.unitZ)
              .applyQuaternion(quaternion)
              .dot(this.eye) < AXIS_FLIP_TRESHOLD
          ) {
            if (handle.tag === "fwd") {
              handle.visible = false;
            } else {
              handle.scale.z *= -1;
            }
          } else if (handle.tag === "bwd") {
            handle.visible = false;
          }
        }
      } else if (this.mode === "rotate") {
        // Align handles to current local or world rotation
        this.tempQuaternion2.copy(quaternion);
        this.alignVector
          .copy(this.eye)
          .applyQuaternion(this.tempQuaternion.copy(quaternion).invert());

        if (handle.name.search("E") !== -1) {
          handle.quaternion.setFromRotationMatrix(
            this.lookAtMatrix.lookAt(this.eye, this.zeroVector, this.unitY),
          );
        }

        if (handle.name === "X") {
          this.tempQuaternion.setFromAxisAngle(
            this.unitX,
            Math.atan2(-this.alignVector.y, this.alignVector.z),
          );
          this.tempQuaternion.multiplyQuaternions(
            this.tempQuaternion2,
            this.tempQuaternion,
          );
          handle.quaternion.copy(this.tempQuaternion);
        }

        if (handle.name === "Y") {
          this.tempQuaternion.setFromAxisAngle(
            this.unitY,
            Math.atan2(this.alignVector.x, this.alignVector.z),
          );
          this.tempQuaternion.multiplyQuaternions(
            this.tempQuaternion2,
            this.tempQuaternion,
          );
          handle.quaternion.copy(this.tempQuaternion);
        }

        if (handle.name === "Z") {
          this.tempQuaternion.setFromAxisAngle(
            this.unitZ,
            Math.atan2(this.alignVector.y, this.alignVector.x),
          );
          this.tempQuaternion.multiplyQuaternions(
            this.tempQuaternion2,
            this.tempQuaternion,
          );
          handle.quaternion.copy(this.tempQuaternion);
        }
      }

      // Hide disabled axes
      handle.visible =
        handle.visible && (handle.name.indexOf("X") === -1 || this.showX);
      handle.visible =
        handle.visible && (handle.name.indexOf("Y") === -1 || this.showY);
      handle.visible =
        handle.visible && (handle.name.indexOf("Z") === -1 || this.showZ);
      handle.visible =
        handle.visible &&
        (handle.name.indexOf("E") === -1 ||
          (this.showX && this.showY && this.showZ));

      // highlight selected axis
      handle.material._opacity =
        handle.material._opacity || handle.material.opacity;
      handle.material._color =
        handle.material._color || handle.material.color.clone();

      handle.material.color.copy(handle.material._color);
      handle.material.opacity = handle.material._opacity;

      if (!this.enabled) {
        handle.material.opacity *= 0.5;
        handle.material.color.lerp(new Color(1, 1, 1), 0.5);
      } else if (this.axis) {
        if (handle.name === this.axis) {
          handle.material.opacity = 1.0;
          handle.material.color.lerp(new Color(1, 1, 1), 0.5);
        } else if (
          this.axis.split("").some(function (a) {
            return handle.name === a;
          })
        ) {
          handle.material.opacity = 1.0;
          handle.material.color.lerp(new Color(1, 1, 1), 0.5);
        } else {
          handle.material.opacity *= 0.25;
          handle.material.color.lerp(new Color(1, 1, 1), 0.5);
        }
      }
    }

    super.updateMatrixWorld(force);
  }
}
