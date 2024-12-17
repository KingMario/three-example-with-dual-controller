import {
  BoxGeometry,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
} from "three";

export class ColoredCube extends Object3D {
  constructor(
    public faceColor: number,
    public edgeColor: number,
  ) {
    super();

    this.createElements();
  }

  private createElements() {
    // Create a geometry and a material then combine them into a mesh
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial({ color: this.faceColor });
    const cube = new Mesh(geometry, material);

    // Create edges for the cube
    const edges = new EdgesGeometry(geometry);
    const lineMaterial = new LineBasicMaterial({ color: this.edgeColor });
    const lineSegments = new LineSegments(edges, lineMaterial);

    // Add the cube and edges to this Object3D
    this.add(cube);
    this.add(lineSegments);
  }
}
