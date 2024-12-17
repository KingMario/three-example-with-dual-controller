import {
  MathUtils,
  Matrix4,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector3,
} from "three";
import { TransformControls } from "./TransformControls";

export class DualController {
  private translateControls: TransformControls;
  private rotateControls: TransformControls;

  private attachedObject: Object3D | null = null;
  private originalMatrix: Matrix4 | null = null;
  private eventTarget: EventTarget = new EventTarget();

  public translation: {
    vector: [number, number, number];
    distance: number;
  } | null = null;
  public rotation: {
    axis: [[number, number, number], [number, number, number]];
    angle: number;
  } | null = null;

  constructor(
    private scene: Scene,
    private camera: PerspectiveCamera | OrthographicCamera,
    private domElement: HTMLCanvasElement,
  ) {
    // Create TransformControls for translation and rotation
    this.translateControls = this.createTransformControls("translate");
    this.rotateControls = this.createTransformControls("rotate");

    // Disable orbit controls while transforming
    this.addDraggingChangedListeners();
  }

  // Create TransformControls with specified mode
  private createTransformControls(
    mode: "translate" | "rotate",
  ): TransformControls {
    const transformControls = new TransformControls(
      this.camera,
      this.domElement,
    );

    transformControls.name = `${mode}Controls`;
    transformControls.mode = mode;
    transformControls.space = "local";
    if (mode === "rotate") {
      transformControls.size *= 0.6;
    }
    this.scene.add(transformControls);

    transformControls.addEventListener("objectChange", this.onTransformEnd);

    return transformControls;
  }

  // Add event listeners for dragging-changed events
  private addDraggingChangedListeners() {
    this.translateControls.addEventListener(
      "dragging-changed",
      this.onDraggingChanged,
    );
    this.rotateControls.addEventListener(
      "dragging-changed",
      this.onDraggingChanged,
    );
  }

  // Remove event listeners for dragging-changed events
  private removeDraggingChangedListeners() {
    this.translateControls.removeEventListener(
      "dragging-changed",
      this.onDraggingChanged,
    );
    this.rotateControls.removeEventListener(
      "dragging-changed",
      this.onDraggingChanged,
    );
  }

  // Event handler for dragging-changed events
  private onDraggingChanged = (event: any) => {
    if (event.target.name === "translateControls") {
      this.rotateControls.enabled = !event.value;
    } else {
      this.translateControls.enabled = !event.value;
    }
  };

  // Event handler for transform end events
  private onTransformEnd = () => {
    if (this.attachedObject && this.originalMatrix) {
      const currentWorldPosition = new Vector3();
      this.attachedObject.getWorldPosition(currentWorldPosition);

      const originalWorldPosition = new Vector3();
      this.originalMatrix.decompose(
        originalWorldPosition,
        new Quaternion(),
        new Vector3(),
      );

      const translationVector = currentWorldPosition
        .clone()
        .sub(originalWorldPosition)
        .normalize();
      const distance = currentWorldPosition.distanceTo(originalWorldPosition);

      this.translation = {
        vector: [translationVector.x, translationVector.y, translationVector.z],
        distance: distance,
      };

      // Calculate rotation
      const currentQuaternion = new Quaternion();
      this.attachedObject.getWorldQuaternion(currentQuaternion);

      const originalQuaternion = new Quaternion();
      this.originalMatrix.decompose(
        new Vector3(),
        originalQuaternion,
        new Vector3(),
      );
      // relative quaternion
      const { x, y, z, w } = currentQuaternion
        .clone()
        .multiply(originalQuaternion.clone().invert());

      // Calculate the angle in degrees
      const angleInDegrees = MathUtils.radToDeg(2 * Math.acos(w));

      // Calculate the rotation axis
      const s = Math.sqrt(1 - w * w);
      let rotationAxis = new Vector3();
      if (s < 1e-5) {
        // If s is close to zero, the axis is not important, so we can use any axis
        rotationAxis.set(1, 0, 0);
      } else {
        rotationAxis.set(x / s, y / s, z / s).normalize();
      }

      this.rotation = {
        axis: [currentWorldPosition.toArray(), rotationAxis.toArray()],
        angle: angleInDegrees,
      };

      // Emit transform event
      const event = new CustomEvent("transform", {
        detail: {
          translation: this.translation,
          rotation: this.rotation,
        },
      });
      this.eventTarget.dispatchEvent(event);
    }
  };

  // Add event listener
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ) {
    this.eventTarget.addEventListener(type, listener, options);
  }

  // Remove event listener
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: EventListenerOptions | boolean,
  ) {
    this.eventTarget.removeEventListener(type, listener, options);
  }

  // Attach an object to the transform controls
  attach(object: Object3D) {
    this.attachedObject = object;
    this.originalMatrix = object.matrix.clone();
    this.translateControls.attach(this.attachedObject);
    this.rotateControls.attach(this.attachedObject);
  }

  // Detach the currently attached object
  detach() {
    this.translateControls.detach();
    this.rotateControls.detach();
    this.attachedObject = null;
    this.originalMatrix = null;
    this.translation = null;
    this.rotation = null;
  }

  // Destroy the controller and clean up resources
  destroy() {
    this.removeDraggingChangedListeners();
    this.translateControls.removeEventListener(
      "objectChange",
      this.onTransformEnd,
    );
    this.rotateControls.removeEventListener(
      "objectChange",
      this.onTransformEnd,
    );

    this.translateControls.dispose();
    this.rotateControls.dispose();
  }
}
