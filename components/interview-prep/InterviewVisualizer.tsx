"use client";

import React, { useEffect, useRef } from "react";

interface InterviewVisualizerProps {
  isActive: boolean;
  mode: "speaking" | "listening" | "idle";
}

const InterviewVisualizer: React.FC<InterviewVisualizerProps> = ({ isActive, mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const render = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      if (!isActive && mode === "idle") {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const color = mode === "speaking" ? "#3b82f6" : mode === "listening" ? "#34d399" : "#94a3b8";
      const amplitude = mode === "speaking" ? 40 : mode === "listening" ? 25 : 5;
      const speed = mode === "speaking" ? 0.15 : mode === "listening" ? 0.1 : 0.05;

      for (let l = 0; l < 3; l++) {
        ctx.beginPath();
        ctx.strokeStyle = l === 0 ? color : `${color}66`;
        ctx.lineWidth = 2;

        for (let x = 0; x < width; x += 5) {
          const y = height / 2 + Math.sin(x * 0.01 + time * speed + l) * amplitude * Math.sin((x / width) * Math.PI);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      time += 1;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, mode]);

  return <canvas ref={canvasRef} className="h-full w-full rounded-2xl bg-slate-50 dark:bg-slate-900/50" />;
};

export default InterviewVisualizer;
