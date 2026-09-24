"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  opacity: number;
  twinkleSpeed: number;
  vx: number;
  vy: number;
  color: string;
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      initStars();
    };

    // Color palette: #EEFABD, #A0D585, #6984A9, #263B6A
    const colors = [
      "rgba(255, 255, 255, ",
      "rgba(238, 250, 189, ", // #EEFABD pale yellow/lime tint
      "rgba(160, 213, 133, ", // #A0D585 sage green tint
      "rgba(105, 132, 169, ", // #6984A9 slate blue tint
    ];

    const initStars = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const starCount = Math.floor((width * height) / 4500);

      stars = Array.from({ length: Math.max(120, starCount) }, () => {
        const size = Math.random() < 0.85 ? Math.random() * 1.5 + 0.5 : Math.random() * 2.2 + 1.2;
        const opacity = Math.random() * 0.7 + 0.2;
        const colorPrefix = colors[Math.floor(Math.random() * colors.length)];
        
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          size,
          baseOpacity: opacity,
          opacity,
          twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          color: colorPrefix,
        };
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // Render stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        star.opacity += star.twinkleSpeed;
        if (star.opacity > 0.9 || star.opacity < 0.15) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${Math.max(0.1, Math.min(1, star.opacity))})`;
        ctx.shadowBlur = star.size > 1.8 ? 6 : 0;
        ctx.shadowColor = "rgba(238, 250, 189, 0.8)";
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dynamic starfield canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Ambient Cosmic Radial Gradients using palette: #263B6A, #6984A9, #A0D585, #EEFABD */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 25% 85%, rgba(38, 59, 106, 0.75) 0%, rgba(15, 23, 42, 0.4) 45%, transparent 75%),
            radial-gradient(circle at 85% 90%, rgba(160, 213, 133, 0.22) 0%, rgba(238, 250, 189, 0.1) 35%, transparent 60%),
            radial-gradient(circle at 50% 15%, rgba(105, 132, 169, 0.35) 0%, transparent 65%)
          `
        }}
      />
    </div>
  );
}
