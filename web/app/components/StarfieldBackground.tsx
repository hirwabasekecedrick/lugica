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

    const colors = [
      "rgba(255, 255, 255, ",
      "rgba(224, 231, 255, ", // slight blue/white
      "rgba(217, 249, 157, ", // slight green/lime tint
      "rgba(243, 232, 255, ", // slight purple tint
    ];

    const initStars = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const starCount = Math.floor((width * height) / 4500); // density relative to screen size

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
          vx: (Math.random() - 0.5) * 0.25, // slow drifting movement
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

        // Update position
        star.x += star.vx;
        star.y += star.vy;

        // Wrap around screen edges
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        // Twinkle opacity oscillation
        star.opacity += star.twinkleSpeed;
        if (star.opacity > 0.9 || star.opacity < 0.15) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${Math.max(0.1, Math.min(1, star.opacity))})`;
        ctx.shadowBlur = star.size > 1.8 ? 6 : 0;
        ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
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

      {/* Ambient Cosmic Radial Gradients matching reference image */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 25% 90%, rgba(76, 29, 149, 0.45) 0%, rgba(30, 10, 60, 0.15) 45%, transparent 70%),
            radial-gradient(circle at 85% 95%, rgba(22, 163, 74, 0.18) 0%, transparent 50%),
            radial-gradient(circle at 50% 10%, rgba(30, 27, 75, 0.3) 0%, transparent 60%)
          `
        }}
      />
    </div>
  );
}
