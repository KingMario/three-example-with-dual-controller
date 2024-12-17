import { Object3D, Quaternion, Raycaster, Vector3, Camera } from "three";
import { TransformControlsGizmo } from "./TransformControlsGizmo";
import { TransformControlsPlane } from "./TransformControlsPlane";
import { TransformationMode, TransformationSpace, InnerPointer } from "./types";

export class TransformControls extends Object3D {
  readonly type = "TransformControls";
  readonly isTransformControls: true;

  object?: Object3D;
  enabled = true;
  axis?: string;
  mode: TransformationMode = "translate";
  space: TransformationSpace = "world";

  visible = false;
  size = 1;
  dragging = false;

  showX = true;
  showY = true;
  showZ = true;

  translationSnap?: number;
  rotationSnap?: number;
  scaleSnap?: number;

  positionStart = new Vector3();
  quaternionStart = new Quaternion();
  scaleStart = new Vector3();

  private pointStart = new Vector3();
  private pointEnd = new Vector3();
  private offset = new Vector3();
  private rotationAxis = new Vector3();
  private startNorm = new Vector3();
  private endNorm = new Vector3();
  private rotationAngle = 0;

  private tempVector = new Vector3();
  private tempVector2 = new Vector3();
  private unit = {
    X: new Vector3(1, 0, 0),
    Y: new Vector3(0, 1, 0),
    Z: new Vector3(0, 0, 1),
  };

  private tempQuaternion = new Quaternion();

  private gizmo = new TransformControlsGizmo();
  private plane = new TransformControlsPlane();
  private raycaster = new Raycaster();

  private parentPosition = new Vector3();
  private parentQuaternion = new Quaternion();
  private parentQuaternionInv = new Quaternion();
  private parentScale = new Vector3();

  private worldPosition = new Vector3();
  private worldPositionStart = new Vector3();

  private worldQuaternion = new Quaternion();
  private worldQuaternionStart = new Quaternion();
  private worldQuaternionInv = new Quaternion();

  private worldScale = new Vector3();
  private worldScaleStart = new Vector3();

  private cameraPosition = new Vector3();
  private cameraQuaternion = new Quaternion();
  private cameraScale = new Vector3();

  private eye = new Vector3();

  private changeEvent = { type: "change" };
  private mouseDownEvent = { type: "mouseDown", mode: this.mode };
  private mouseUpEvent = { type: "mouseUp", mode: this.mode };
  private objectChangeEvent = { type: "objectChange" };

  private getPointer(event: PointerEvent | TouchEvent): InnerPointer {
    if (
      this.domElement.ownerDocument.pointerLockElement &&
      event instanceof PointerEvent
    ) {
      return {
        x: 0,
        y: 0,
        button: event.button,
      };
    } else {
      const {
        clientX,
        clientY,
        button = undefined,
      } = event instanceof TouchEvent
        ? { ...event.changedTouches[0] }
        : {
            clientX: event.clientX,
            clientY: event.clientY,
            button: event.button,
          };

      const { left, top, width, height } =
        this.domElement.getBoundingClientRect();

      return {
        x: ((clientX - left) / width) * 2 - 1,
        y: (-(clientY - top) / height) * 2 + 1,
        button,
      };
    }
  }

  pointerHover = (pointer: InnerPointer) => {
    if (this.object === undefined || this.dragging === true) {
      return;
    }

    this.raycaster.setFromCamera(pointer, this.camera);

    const intersect = this.intersectObjectWithRay(this.gizmo.picker[this.mode]);

    if (intersect) {
      this.axis = intersect.object.name;
    } else {
      this.axis = null;
    }
  };

  pointerDown = (pointer: InnerPointer) => {
    if (
      this.object === undefined ||
      this.dragging === true ||
      pointer.button !== 0
    ) {
      return;
    }

    if (this.axis) {
      this.raycaster.setFromCamera(pointer, this.camera);

      const planeIntersect = this.intersectObjectWithRay(this.plane, true);

      if (planeIntersect) {
        let space = this.space;

        if (this.mode === "scale") {
          space = "local";
        } else if (
          this.axis === "E" ||
          this.axis === "XYZE" ||
          this.axis === "XYZ"
        ) {
          space = "world";
        }

        if (space === "local" && this.mode === "rotate") {
          if (this.axis === "X" && this.rotationSnap) {
            this.object.rotation.x =
              Math.round(this.object.rotation.x / this.rotationSnap) *
              this.rotationSnap;
          }
          if (this.axis === "Y" && this.rotationSnap) {
            this.object.rotation.y =
              Math.round(this.object.rotation.y / this.rotationSnap) *
              this.rotationSnap;
          }
          if (this.axis === "Z" && this.rotationSnap) {
            this.object.rotation.z =
              Math.round(this.object.rotation.z / this.rotationSnap) *
              this.rotationSnap;
          }
        }

        this.object.updateMatrixWorld();
        this.object.parent.updateMatrixWorld();

        this.positionStart.copy(this.object.position);
        this.quaternionStart.copy(this.object.quaternion);
        this.scaleStart.copy(this.object.scale);

        this.object.matrixWorld.decompose(
          this.worldPositionStart,
          this.worldQuaternionStart,
          this.worldScaleStart,
        );

        this.pointStart.copy(planeIntersect.point).sub(this.worldPositionStart);
      }

      this.dragging = true;
      this.mouseDownEvent.mode = this.mode;
      this.dispatchEvent(this.mouseDownEvent);
    }
  };

  pointerMove = (pointer: InnerPointer) => {
    let space = this.space;

    if (this.mode === "scale") {
      space = "local";
    } else if (
      this.axis === "E" ||
      this.axis === "XYZE" ||
      this.axis === "XYZ"
    ) {
      space = "world";
    }

    if (
      this.object === undefined ||
      this.axis === null ||
      this.dragging === false ||
      pointer.button !== -1
    ) {
      return;
    }

    this.raycaster.setFromCamera(pointer, this.camera);

    const planeIntersect = this.intersectObjectWithRay(this.plane, true);

    if (!planeIntersect) {
      return;
    }

    this.pointEnd.copy(planeIntersect.point).sub(this.worldPositionStart);

    if (this.mode === "translate") {
      // Apply translate
      this.offset.copy(this.pointEnd).sub(this.pointStart);

      if (space === "local" && this.axis !== "XYZ") {
        this.offset.applyQuaternion(this.worldQuaternionInv);
      }

      if (this.axis.indexOf("X") === -1) {
        this.offset.x = 0;
      }
      if (this.axis.indexOf("Y") === -1) {
        this.offset.y = 0;
      }
      if (this.axis.indexOf("Z") === -1) {
        this.offset.z = 0;
      }

      if (space === "local" && this.axis !== "XYZ") {
        this.offset
          .applyQuaternion(this.quaternionStart)
          .divide(this.parentScale);
      } else {
        this.offset
          .applyQuaternion(this.parentQuaternionInv)
          .divide(this.parentScale);
      }

      this.object.position.copy(this.offset).add(this.positionStart);

      // Apply translation snap
      if (this.translationSnap) {
        if (space === "local") {
          this.object.position.applyQuaternion(
            this.tempQuaternion.copy(this.quaternionStart).invert(),
          );

          if (this.axis.search("X") !== -1) {
            this.object.position.x =
              Math.round(this.object.position.x / this.translationSnap) *
              this.translationSnap;
          }

          if (this.axis.search("Y") !== -1) {
            this.object.position.y =
              Math.round(this.object.position.y / this.translationSnap) *
              this.translationSnap;
          }

          if (this.axis.search("Z") !== -1) {
            this.object.position.z =
              Math.round(this.object.position.z / this.translationSnap) *
              this.translationSnap;
          }

          this.object.position.applyQuaternion(this.quaternionStart);
        }

        if (space === "world") {
          if (this.object.parent) {
            this.object.position.add(
              this.tempVector.setFromMatrixPosition(
                this.object.parent.matrixWorld,
              ),
            );
          }

          if (this.axis.search("X") !== -1) {
            this.object.position.x =
              Math.round(this.object.position.x / this.translationSnap) *
              this.translationSnap;
          }

          if (this.axis.search("Y") !== -1) {
            this.object.position.y =
              Math.round(this.object.position.y / this.translationSnap) *
              this.translationSnap;
          }

          if (this.axis.search("Z") !== -1) {
            this.object.position.z =
              Math.round(this.object.position.z / this.translationSnap) *
              this.translationSnap;
          }

          if (this.object.parent) {
            this.object.position.sub(
              this.tempVector.setFromMatrixPosition(
                this.object.parent.matrixWorld,
              ),
            );
          }
        }
      }
    } else if (this.mode === "scale") {
      if (this.axis.search("XYZ") !== -1) {
        let d = this.pointEnd.length() / this.pointStart.length();

        if (this.pointEnd.dot(this.pointStart) < 0) {
          d *= -1;
        }

        this.tempVector2.set(d, d, d);
      } else {
        this.tempVector.copy(this.pointStart);
        this.tempVector2.copy(this.pointEnd);

        this.tempVector.applyQuaternion(this.worldQuaternionInv);
        this.tempVector2.applyQuaternion(this.worldQuaternionInv);

        this.tempVector2.divide(this.tempVector);

        if (this.axis.search("X") === -1) {
          this.tempVector2.x = 1;
        }

        if (this.axis.search("Y") === -1) {
          this.tempVector2.y = 1;
        }

        if (this.axis.search("Z") === -1) {
          this.tempVector2.z = 1;
        }
      }

      // Apply scale
      this.object.scale.copy(this.scaleStart).multiply(this.tempVector2);

      if (this.scaleSnap) {
        if (this.axis.search("X") !== -1) {
          this.object.scale.x =
            Math.round(this.object.scale.x / this.scaleSnap) * this.scaleSnap ||
            this.scaleSnap;
        }

        if (this.axis.search("Y") !== -1) {
          this.object.scale.y =
            Math.round(this.object.scale.y / this.scaleSnap) * this.scaleSnap ||
            this.scaleSnap;
        }

        if (this.axis.search("Z") !== -1) {
          this.object.scale.z =
            Math.round(this.object.scale.z / this.scaleSnap) * this.scaleSnap ||
            this.scaleSnap;
        }
      }
    } else if (this.mode === "rotate") {
      this.offset.copy(this.pointEnd).sub(this.pointStart);

      const ROTATION_SPEED =
        2000 /
        this.worldPosition.distanceTo(
          this.tempVector.setFromMatrixPosition(this.camera.matrixWorld),
        );

      if (this.axis === "E") {
        this.rotationAxis.copy(this.eye);
        this.rotationAngle = this.pointEnd.angleTo(this.pointStart);

        this.startNorm.copy(this.pointStart).normalize();
        this.endNorm.copy(this.pointEnd).normalize();

        this.rotationAngle *=
          this.endNorm.cross(this.startNorm).dot(this.eye) < 0 ? 1 : -1;
      } else if (this.axis === "XYZE") {
        this.rotationAxis.copy(this.offset).cross(this.eye).normalize();
        this.rotationAngle =
          this.offset.dot(
            this.tempVector.copy(this.rotationAxis).cross(this.eye),
          ) * ROTATION_SPEED;
      } else if (this.axis === "X" || this.axis === "Y" || this.axis === "Z") {
        this.rotationAxis.copy(this.unit[this.axis]);

        this.tempVector.copy(this.unit[this.axis]);

        if (space === "local") {
          this.tempVector.applyQuaternion(this.worldQuaternion);
        }

        this.rotationAngle =
          this.offset.dot(this.tempVector.cross(this.eye).normalize()) *
          ROTATION_SPEED;
      }

      // Apply rotation snap
      if (this.rotationSnap) {
        this.rotationAngle =
          Math.round(this.rotationAngle / this.rotationSnap) *
          this.rotationSnap;
      }

      // Apply rotate
      if (space === "local" && this.axis !== "E" && this.axis !== "XYZE") {
        this.object.quaternion.copy(this.quaternionStart);
        this.object.quaternion
          .multiply(
            this.tempQuaternion.setFromAxisAngle(
              this.rotationAxis,
              this.rotationAngle,
            ),
          )
          .normalize();
      } else {
        this.rotationAxis.applyQuaternion(this.parentQuaternionInv);
        this.object.quaternion.copy(
          this.tempQuaternion.setFromAxisAngle(
            this.rotationAxis,
            this.rotationAngle,
          ),
        );
        this.object.quaternion.multiply(this.quaternionStart).normalize();
      }
    }

    this.dispatchEvent(this.changeEvent);
    this.dispatchEvent(this.objectChangeEvent);
  };

  pointerUp = (pointer: InnerPointer) => {
    if (pointer.button !== 0) {
      return;
    }

    if (this.dragging && this.axis !== null) {
      this.mouseUpEvent.mode = this.mode;
      this.dispatchEvent(this.mouseUpEvent);
    }

    this.dragging = false;
    this.axis = null;
  };

  onPointerUp = (event: PointerEvent) => {
    if (!this.enabled) {
      return;
    }

    this.domElement.style.touchAction = "";
    this.domElement.ownerDocument.removeEventListener(
      "pointermove",
      this.onPointerMove,
      false,
    );

    this.pointerUp(this.getPointer(event));
  };

  onPointerHover = (event: PointerEvent) => {
    if (!this.enabled) {
      return;
    }

    switch (event.pointerType) {
      case "mouse":
      case "pen":
        this.pointerHover(this.getPointer(event));
        break;
    }
  };

  onPointerDown = (event: PointerEvent) => {
    if (!this.enabled) {
      return;
    }

    this.domElement.style.touchAction = "none"; // disable touch scroll
    this.domElement.ownerDocument.addEventListener(
      "pointermove",
      this.onPointerMove,
      false,
    );

    this.pointerHover(this.getPointer(event));
    this.pointerDown(this.getPointer(event));
  };

  onPointerMove = (event) => {
    if (!this.enabled) {
      return;
    }

    this.pointerMove(this.getPointer(event));
  };

  constructor(
    public camera: Camera,
    private domElement: HTMLElement,
  ) {
    super();

    this.add(this.gizmo);
    this.add(this.plane);

    // Define properties with getters/setter
    // Setting the defined property will automatically trigger change event
    // Defined properties are passed down to gizmo and plane
    this.defineProperty("camera", this.camera);
    this.defineProperty("object", undefined);
    this.defineProperty("enabled", true);
    this.defineProperty("axis", null);
    this.defineProperty("mode", "translate");
    this.defineProperty("translationSnap", null);
    this.defineProperty("rotationSnap", null);
    this.defineProperty("scaleSnap", null);
    this.defineProperty("space", "world");
    this.defineProperty("size", 1);
    this.defineProperty("dragging", false);
    this.defineProperty("showX", true);
    this.defineProperty("showY", true);
    this.defineProperty("showZ", true);
    this.defineProperty("worldPosition", this.worldPosition);
    this.defineProperty("worldPositionStart", this.worldPositionStart);
    this.defineProperty("worldQuaternion", this.worldQuaternion);
    this.defineProperty("worldQuaternionStart", this.worldQuaternionStart);
    this.defineProperty("cameraPosition", this.cameraPosition);
    this.defineProperty("cameraQuaternion", this.cameraQuaternion);
    this.defineProperty("pointStart", this.pointStart);
    this.defineProperty("pointEnd", this.pointEnd);
    this.defineProperty("rotationAxis", this.rotationAxis);
    this.defineProperty("rotationAngle", this.rotationAngle);
    this.defineProperty("eye", this.eye);

    domElement.addEventListener("pointerdown", this.onPointerDown, false);
    domElement.addEventListener("pointermove", this.onPointerHover, false);
    this.domElement.ownerDocument.addEventListener(
      "pointerup",
      this.onPointerUp,
      false,
    );
  }

  private defineProperty(propName: string, defaultValue: any) {
    let propValue = defaultValue;

    Object.defineProperty(this, propName, {
      get: () => (propValue !== undefined ? propValue : defaultValue),

      set: (value) => {
        if (propValue !== value) {
          propValue = value;
          this.plane[propName] = value;
          this.gizmo[propName] = value;

          this.dispatchEvent({ type: propName + "-changed", value: value });
          this.dispatchEvent(this.changeEvent);
        }
      },
    });

    this[propName] = defaultValue;
    this.plane[propName] = defaultValue;
    this.gizmo[propName] = defaultValue;
  }

  private intersectObjectWithRay(object: Object3D, includeInvisible?: boolean) {
    const allIntersections = this.raycaster.intersectObject(object, true);

    for (let i = 0; i < allIntersections.length; i++) {
      if (allIntersections[i].object.visible || includeInvisible) {
        return allIntersections[i];
      }
    }

    return false;
  }

  updateMatrixWorld() {
    if (this.object !== undefined) {
      this.object.updateMatrixWorld();

      if (this.object.parent === null) {
        console.error(
          "TransformControls: The attached 3D object must be a part of the scene graph.",
        );
      } else {
        this.object.parent.matrixWorld.decompose(
          this.parentPosition,
          this.parentQuaternion,
          this.parentScale,
        );
      }

      this.object.matrixWorld.decompose(
        this.worldPosition,
        this.worldQuaternion,
        this.worldScale,
      );

      this.parentQuaternionInv.copy(this.parentQuaternion).invert();
      this.worldQuaternionInv.copy(this.worldQuaternion).invert();
    }

    this.camera.updateMatrixWorld();
    this.camera.matrixWorld.decompose(
      this.cameraPosition,
      this.cameraQuaternion,
      this.cameraScale,
    );

    this.eye.copy(this.cameraPosition).sub(this.worldPosition).normalize();

    Object3D.prototype.updateMatrixWorld.call(this);
  }

  attach(object: Object3D) {
    this.object = object;
    this.visible = true;

    return this;
  }

  detach() {
    this.object = undefined;
    this.visible = false;
    this.axis = null;

    return this;
  }

  dispose() {
    this.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.domElement.removeEventListener("pointermove", this.onPointerHover);
    this.domElement.ownerDocument.removeEventListener(
      "pointermove",
      this.onPointerMove,
    );
    this.domElement.ownerDocument.removeEventListener(
      "pointerup",
      this.onPointerUp,
    );

    this.traverse(function (child) {
      if ((child as any).geometry) {
        (child as any).geometry.dispose();
      }
      if ((child as any).material) {
        (child as any).material.dispose();
      }
    });
  }
}
