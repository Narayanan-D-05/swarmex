"use client"

import React, { useEffect, useRef } from "react"

export function MeshGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const particles: Particle[] = []
    const particleCount = 4

    class Particle {
      x: number
      y: number
      radius: number
      color: string
      vx: number
      vy: number

      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.radius = Math.random() * 400 + 400
        const colors = ["#0ea5e9", "#f97316", "#22c55e", "#a855f7"]
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        if (this.x < -this.radius) this.x = width + this.radius
        if (this.x > width + this.radius) this.x = -this.radius
        if (this.y < -this.radius) this.y = height + this.radius
        if (this.y > height + this.radius) this.y = -this.radius
      }

      draw(ctx: CanvasRenderingContext2D) {
        const gradient = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.radius
        )
        gradient.addColorStop(0, `${this.color}15`)
        gradient.addColorStop(1, "transparent")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    let animationFrameId: number

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      particles.forEach((p) => {
        p.update()
        p.draw(ctx)
      })
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none opacity-50 blur-3xl"
    />
  )
}
