import { useEffect, useRef } from "react";

export default function Scene() {
  const canvas = useRef<HTMLCanvasElement>();

  useEffect(() => {
    const SceneClass = require("./SceneClass").default;

    const Scene = new SceneClass({
      canvas: canvas.current,
      onPreloadDone: () => {
        console.log("loaded");
      },
    });

    return () => Scene.dispose();
  });

  return (
    <canvas
      style={{
        width: "100vw",
        height: "100vh",
      }}
      ref={canvas}
    ></canvas>
  );
}
