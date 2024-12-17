# Three.js TypeScript Example

This project demonstrates the use of Three.js with TypeScript for better maintenance and type safety. The official Three.js `TransformControls` from JavaScript has been converted to TypeScript. This project is based on `three.js@0.124.0`.

## Features

- **TransformControls in TypeScript**: The original `TransformControls` from Three.js has been converted to TypeScript, providing better type safety and maintainability.
- **DualController**: A custom `DualController` class that combines both translation and rotation functions of the `TransformControls`.

## Project Structure

- `src/ColoredCube.ts`: Defines the `ColoredCube` class, which creates a colored cube with edges.
- `src/DualController.ts`: Defines the `DualController` class, which combines translation and rotation controls.
- `src/TransformControls/`: Contains the TypeScript implementation of the `TransformControls`, including gizmo constants and helper classes.
- `src/main.ts`: The main entry point of the application, setting up the scene, camera, renderer, and controls.

## Getting Started

1. Install dependencies:

    ```sh
    yarn install
    ```

1. Run the development server:

    ```sh
    yarn dev
    ```

1. Open your browser and navigate to http://localhost:5173 to see the example in action.

## License

This project is licensed under the MIT License.
