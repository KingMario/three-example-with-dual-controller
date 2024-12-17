import {
  MeshBasicMaterial,
  DoubleSide,
  LineBasicMaterial,
  CylinderBufferGeometry,
  BoxBufferGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  Line,
  OctahedronBufferGeometry,
  PlaneBufferGeometry,
  TorusBufferGeometry,
  SphereBufferGeometry,
} from "three";

const gizmoMaterial = new MeshBasicMaterial({
  depthTest: false,
  depthWrite: false,
  transparent: true,
  side: DoubleSide,
  fog: false,
  toneMapped: false,
});

export const matInvisible = gizmoMaterial.clone();
matInvisible.opacity = 0.15;

export const matHelper = gizmoMaterial.clone();
matHelper.opacity = 0.33;

export const matRed = gizmoMaterial.clone();
matRed.color.set(0xff0000);

export const matGreen = gizmoMaterial.clone();
matGreen.color.set(0x00ff00);

export const matBlue = gizmoMaterial.clone();
matBlue.color.set(0x0000ff);

export const matYellow = gizmoMaterial.clone();
matYellow.color.set(0xffff00);

export const matWhiteTransparent = gizmoMaterial.clone();
matWhiteTransparent.opacity = 0.25;

export const matYellowTransparent = matWhiteTransparent.clone();
matYellowTransparent.color.set(0xffff00);

export const matCyanTransparent = matWhiteTransparent.clone();
matCyanTransparent.color.set(0x00ffff);

export const matMagentaTransparent = matWhiteTransparent.clone();
matMagentaTransparent.color.set(0xff00ff);

export const gizmoLineMaterial = new LineBasicMaterial({
  depthTest: false,
  depthWrite: false,
  transparent: true,
  linewidth: 1,
  fog: false,
  toneMapped: false,
});

export const matLineRed = gizmoLineMaterial.clone();
matLineRed.color.set(0xff0000);

export const matLineGreen = gizmoLineMaterial.clone();
matLineGreen.color.set(0x00ff00);

export const matLineBlue = gizmoLineMaterial.clone();
matLineBlue.color.set(0x0000ff);

export const matLineCyan = gizmoLineMaterial.clone();
matLineCyan.color.set(0x00ffff);

export const matLineMagenta = gizmoLineMaterial.clone();
matLineMagenta.color.set(0xff00ff);

export const matLineYellow = gizmoLineMaterial.clone();
matLineYellow.color.set(0xffff00);

export const matLineGray = gizmoLineMaterial.clone();
matLineGray.color.set(0x787878);

export const matLineYellowTransparent = matLineYellow.clone();
matLineYellowTransparent.opacity = 0.25;

export const arrowGeometry = new CylinderBufferGeometry(
  0,
  0.05,
  0.2,
  12,
  1,
  false,
);

export const scaleHandleGeometry = new BoxBufferGeometry(0.125, 0.125, 0.125);

export const lineGeometry = new BufferGeometry();
lineGeometry.setAttribute(
  "position",
  new Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3),
);

export function CircleGeometry(radius: number, arc: number) {
  const geometry = new BufferGeometry();
  const vertices = [];

  for (let i = 0; i <= 64 * arc; ++i) {
    vertices.push(
      0,
      Math.cos((i / 32) * Math.PI) * radius,
      Math.sin((i / 32) * Math.PI) * radius,
    );
  }

  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));

  return geometry;
}

export function TranslateHelperGeometry() {
  const geometry = new BufferGeometry();

  geometry.setAttribute(
    "position",
    new Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3),
  );

  return geometry;
}

export const gizmoTranslate = {
  X: [
    [
      new Mesh(arrowGeometry, matRed),
      [1, 0, 0],
      [0, 0, -Math.PI / 2],
      null,
      "fwd",
    ],
    [
      new Mesh(arrowGeometry, matRed),
      [1, 0, 0],
      [0, 0, Math.PI / 2],
      null,
      "bwd",
    ],
    [new Line(lineGeometry, matLineRed)],
  ],
  Y: [
    [new Mesh(arrowGeometry, matGreen), [0, 1, 0], null, null, "fwd"],
    [
      new Mesh(arrowGeometry, matGreen),
      [0, 1, 0],
      [Math.PI, 0, 0],
      null,
      "bwd",
    ],
    [new Line(lineGeometry, matLineGreen), null, [0, 0, Math.PI / 2]],
  ],
  Z: [
    [
      new Mesh(arrowGeometry, matBlue),
      [0, 0, 1],
      [Math.PI / 2, 0, 0],
      null,
      "fwd",
    ],
    [
      new Mesh(arrowGeometry, matBlue),
      [0, 0, 1],
      [-Math.PI / 2, 0, 0],
      null,
      "bwd",
    ],
    [new Line(lineGeometry, matLineBlue), null, [0, -Math.PI / 2, 0]],
  ],
  XYZ: [
    [
      new Mesh(
        new OctahedronBufferGeometry(0.1, 0),
        matWhiteTransparent.clone(),
      ),
      [0, 0, 0],
      [0, 0, 0],
    ],
  ],
  XY: [
    [
      new Mesh(
        new PlaneBufferGeometry(0.295, 0.295),
        matYellowTransparent.clone(),
      ),
      [0.15, 0.15, 0],
    ],
    [
      new Line(lineGeometry, matLineYellow),
      [0.18, 0.3, 0],
      null,
      [0.125, 1, 1],
    ],
    [
      new Line(lineGeometry, matLineYellow),
      [0.3, 0.18, 0],
      [0, 0, Math.PI / 2],
      [0.125, 1, 1],
    ],
  ],
  YZ: [
    [
      new Mesh(
        new PlaneBufferGeometry(0.295, 0.295),
        matCyanTransparent.clone(),
      ),
      [0, 0.15, 0.15],
      [0, Math.PI / 2, 0],
    ],
    [
      new Line(lineGeometry, matLineCyan),
      [0, 0.18, 0.3],
      [0, 0, Math.PI / 2],
      [0.125, 1, 1],
    ],
    [
      new Line(lineGeometry, matLineCyan),
      [0, 0.3, 0.18],
      [0, -Math.PI / 2, 0],
      [0.125, 1, 1],
    ],
  ],
  XZ: [
    [
      new Mesh(
        new PlaneBufferGeometry(0.295, 0.295),
        matMagentaTransparent.clone(),
      ),
      [0.15, 0, 0.15],
      [-Math.PI / 2, 0, 0],
    ],
    [
      new Line(lineGeometry, matLineMagenta),
      [0.18, 0, 0.3],
      null,
      [0.125, 1, 1],
    ],
    [
      new Line(lineGeometry, matLineMagenta),
      [0.3, 0, 0.18],
      [0, -Math.PI / 2, 0],
      [0.125, 1, 1],
    ],
  ],
};
export const gizmoRotate = {
  X: [
    [new Line(CircleGeometry(1, 0.5), matLineRed)],
    [
      new Mesh(new OctahedronBufferGeometry(0.04, 0), matRed),
      [0, 0, 0.99],
      null,
      [1, 3, 1],
    ],
  ],
  Y: [
    [
      new Line(CircleGeometry(1, 0.5), matLineGreen),
      null,
      [0, 0, -Math.PI / 2],
    ],
    [
      new Mesh(new OctahedronBufferGeometry(0.04, 0), matGreen),
      [0, 0, 0.99],
      null,
      [3, 1, 1],
    ],
  ],
  Z: [
    [new Line(CircleGeometry(1, 0.5), matLineBlue), null, [0, Math.PI / 2, 0]],
    [
      new Mesh(new OctahedronBufferGeometry(0.04, 0), matBlue),
      [0.99, 0, 0],
      null,
      [1, 3, 1],
    ],
  ],
  E: [
    [
      new Line(CircleGeometry(1.25, 1), matLineYellowTransparent),
      null,
      [0, Math.PI / 2, 0],
    ],
    [
      new Mesh(
        new CylinderBufferGeometry(0.03, 0, 0.15, 4, 1, false),
        matLineYellowTransparent,
      ),
      [1.17, 0, 0],
      [0, 0, -Math.PI / 2],
      [1, 1, 0.001],
    ],
    [
      new Mesh(
        new CylinderBufferGeometry(0.03, 0, 0.15, 4, 1, false),
        matLineYellowTransparent,
      ),
      [-1.17, 0, 0],
      [0, 0, Math.PI / 2],
      [1, 1, 0.001],
    ],
    [
      new Mesh(
        new CylinderBufferGeometry(0.03, 0, 0.15, 4, 1, false),
        matLineYellowTransparent,
      ),
      [0, -1.17, 0],
      [Math.PI, 0, 0],
      [1, 1, 0.001],
    ],
    [
      new Mesh(
        new CylinderBufferGeometry(0.03, 0, 0.15, 4, 1, false),
        matLineYellowTransparent,
      ),
      [0, 1.17, 0],
      [0, 0, 0],
      [1, 1, 0.001],
    ],
  ],
  XYZE: [
    [new Line(CircleGeometry(1, 1), matLineGray), null, [0, Math.PI / 2, 0]],
  ],
};
export const gizmoScale = {
  X: [
    [new Mesh(scaleHandleGeometry, matRed), [0.8, 0, 0], [0, 0, -Math.PI / 2]],
    [new Line(lineGeometry, matLineRed), null, null, [0.8, 1, 1]],
  ],
  Y: [
    [new Mesh(scaleHandleGeometry, matGreen), [0, 0.8, 0]],
    [
      new Line(lineGeometry, matLineGreen),
      null,
      [0, 0, Math.PI / 2],
      [0.8, 1, 1],
    ],
  ],
  Z: [
    [new Mesh(scaleHandleGeometry, matBlue), [0, 0, 0.8], [Math.PI / 2, 0, 0]],
    [
      new Line(lineGeometry, matLineBlue),
      null,
      [0, -Math.PI / 2, 0],
      [0.8, 1, 1],
    ],
  ],
  XY: [
    [
      new Mesh(scaleHandleGeometry, matYellowTransparent),
      [0.85, 0.85, 0],
      null,
      [2, 2, 0.2],
    ],
    [
      new Line(lineGeometry, matLineYellow),
      [0.855, 0.98, 0],
      null,
      [0.125, 1, 1],
    ],
    [
      new Line(lineGeometry, matLineYellow),
      [0.98, 0.855, 0],
      [0, 0, Math.PI / 2],
      [0.125, 1, 1],
    ],
  ],
  YZ: [
    [
      new Mesh(scaleHandleGeometry, matCyanTransparent),
      [0, 0.85, 0.85],
      null,
      [0.2, 2, 2],
    ],
    [
      new Line(lineGeometry, matLineCyan),
      [0, 0.855, 0.98],
      [0, 0, Math.PI / 2],
      [0.125, 1, 1],
    ],
    [
      new Line(lineGeometry, matLineCyan),
      [0, 0.98, 0.855],
      [0, -Math.PI / 2, 0],
      [0.125, 1, 1],
    ],
  ],
  XZ: [
    [
      new Mesh(scaleHandleGeometry, matMagentaTransparent),
      [0.85, 0, 0.85],
      null,
      [2, 0.2, 2],
    ],
    [
      new Line(lineGeometry, matLineMagenta),
      [0.855, 0, 0.98],
      null,
      [0.125, 1, 1],
    ],
    [
      new Line(lineGeometry, matLineMagenta),
      [0.98, 0, 0.855],
      [0, -Math.PI / 2, 0],
      [0.125, 1, 1],
    ],
  ],
  XYZX: [
    [
      new Mesh(
        new BoxBufferGeometry(0.125, 0.125, 0.125),
        matWhiteTransparent.clone(),
      ),
      [1.1, 0, 0],
    ],
  ],
  XYZY: [
    [
      new Mesh(
        new BoxBufferGeometry(0.125, 0.125, 0.125),
        matWhiteTransparent.clone(),
      ),
      [0, 1.1, 0],
    ],
  ],
  XYZZ: [
    [
      new Mesh(
        new BoxBufferGeometry(0.125, 0.125, 0.125),
        matWhiteTransparent.clone(),
      ),
      [0, 0, 1.1],
    ],
  ],
};

export const pickerTranslate = {
  X: [
    [
      new Mesh(
        new CylinderBufferGeometry(0.2, 0, 1, 4, 1, false),
        matInvisible,
      ),
      [0.6, 0, 0],
      [0, 0, -Math.PI / 2],
    ],
  ],
  Y: [
    [
      new Mesh(
        new CylinderBufferGeometry(0.2, 0, 1, 4, 1, false),
        matInvisible,
      ),
      [0, 0.6, 0],
    ],
  ],
  Z: [
    [
      new Mesh(
        new CylinderBufferGeometry(0.2, 0, 1, 4, 1, false),
        matInvisible,
      ),
      [0, 0, 0.6],
      [Math.PI / 2, 0, 0],
    ],
  ],
  XYZ: [[new Mesh(new OctahedronBufferGeometry(0.2, 0), matInvisible)]],
  XY: [
    [new Mesh(new PlaneBufferGeometry(0.4, 0.4), matInvisible), [0.2, 0.2, 0]],
  ],
  YZ: [
    [
      new Mesh(new PlaneBufferGeometry(0.4, 0.4), matInvisible),
      [0, 0.2, 0.2],
      [0, Math.PI / 2, 0],
    ],
  ],
  XZ: [
    [
      new Mesh(new PlaneBufferGeometry(0.4, 0.4), matInvisible),
      [0.2, 0, 0.2],
      [-Math.PI / 2, 0, 0],
    ],
  ],
};
export const pickerRotate = {
  X: [
    [
      new Mesh(new TorusBufferGeometry(1, 0.1, 4, 24), matInvisible),
      [0, 0, 0],
      [0, -Math.PI / 2, -Math.PI / 2],
    ],
  ],
  Y: [
    [
      new Mesh(new TorusBufferGeometry(1, 0.1, 4, 24), matInvisible),
      [0, 0, 0],
      [Math.PI / 2, 0, 0],
    ],
  ],
  Z: [
    [
      new Mesh(new TorusBufferGeometry(1, 0.1, 4, 24), matInvisible),
      [0, 0, 0],
      [0, 0, -Math.PI / 2],
    ],
  ],
  E: [[new Mesh(new TorusBufferGeometry(1.25, 0.1, 2, 24), matInvisible)]],
  XYZE: [[new Mesh(new SphereBufferGeometry(0.7, 10, 8), matInvisible)]],
};
export const pickerScale = {
  X: [
    [
      new Mesh(
        new CylinderBufferGeometry(0.2, 0, 0.8, 4, 1, false),
        matInvisible,
      ),
      [0.5, 0, 0],
      [0, 0, -Math.PI / 2],
    ],
  ],
  Y: [
    [
      new Mesh(
        new CylinderBufferGeometry(0.2, 0, 0.8, 4, 1, false),
        matInvisible,
      ),
      [0, 0.5, 0],
    ],
  ],
  Z: [
    [
      new Mesh(
        new CylinderBufferGeometry(0.2, 0, 0.8, 4, 1, false),
        matInvisible,
      ),
      [0, 0, 0.5],
      [Math.PI / 2, 0, 0],
    ],
  ],
  XY: [
    [
      new Mesh(scaleHandleGeometry, matInvisible),
      [0.85, 0.85, 0],
      null,
      [3, 3, 0.2],
    ],
  ],
  YZ: [
    [
      new Mesh(scaleHandleGeometry, matInvisible),
      [0, 0.85, 0.85],
      null,
      [0.2, 3, 3],
    ],
  ],
  XZ: [
    [
      new Mesh(scaleHandleGeometry, matInvisible),
      [0.85, 0, 0.85],
      null,
      [3, 0.2, 3],
    ],
  ],
  XYZX: [
    [new Mesh(new BoxBufferGeometry(0.2, 0.2, 0.2), matInvisible), [1.1, 0, 0]],
  ],
  XYZY: [
    [new Mesh(new BoxBufferGeometry(0.2, 0.2, 0.2), matInvisible), [0, 1.1, 0]],
  ],
  XYZZ: [
    [new Mesh(new BoxBufferGeometry(0.2, 0.2, 0.2), matInvisible), [0, 0, 1.1]],
  ],
};

export const helperTranslate = {
  START: [
    [
      new Mesh(new OctahedronBufferGeometry(0.01, 2), matHelper),
      null,
      null,
      null,
      "helper",
    ],
  ],
  END: [
    [
      new Mesh(new OctahedronBufferGeometry(0.01, 2), matHelper),
      null,
      null,
      null,
      "helper",
    ],
  ],
  DELTA: [
    [
      new Line(TranslateHelperGeometry(), matHelper),
      null,
      null,
      null,
      "helper",
    ],
  ],
  X: [
    [
      new Line(lineGeometry, matHelper.clone()),
      [-1e3, 0, 0],
      null,
      [1e6, 1, 1],
      "helper",
    ],
  ],
  Y: [
    [
      new Line(lineGeometry, matHelper.clone()),
      [0, -1e3, 0],
      [0, 0, Math.PI / 2],
      [1e6, 1, 1],
      "helper",
    ],
  ],
  Z: [
    [
      new Line(lineGeometry, matHelper.clone()),
      [0, 0, -1e3],
      [0, -Math.PI / 2, 0],
      [1e6, 1, 1],
      "helper",
    ],
  ],
};
export const helperRotate = {
  AXIS: [
    [
      new Line(lineGeometry, matHelper.clone()),
      [-1e3, 0, 0],
      null,
      [1e6, 1, 1],
      "helper",
    ],
  ],
};
export const helperScale = {
  X: [
    [
      new Line(lineGeometry, matHelper.clone()),
      [-1e3, 0, 0],
      null,
      [1e6, 1, 1],
      "helper",
    ],
  ],
  Y: [
    [
      new Line(lineGeometry, matHelper.clone()),
      [0, -1e3, 0],
      [0, 0, Math.PI / 2],
      [1e6, 1, 1],
      "helper",
    ],
  ],
  Z: [
    [
      new Line(lineGeometry, matHelper.clone()),
      [0, 0, -1e3],
      [0, -Math.PI / 2, 0],
      [1e6, 1, 1],
      "helper",
    ],
  ],
};
