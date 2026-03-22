import { useEffect, useRef } from "react";

type Pointer = { x: number; y: number; tX: number; tY: number };

function compileShader(gl: WebGLRenderingContext, source: string, type: number): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** WebGL backdrop: flowing lattice / interference — tuned for the simulator view. */
export function SimulatorCircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<Pointer>({ x: 0, y: 0, tX: 0, tY: 0 });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    const vs = `
      precision mediump float;
      attribute vec2 a_position;
      varying vec2 vUv;
      void main() {
        vUv = 0.5 * (a_position + 1.0);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision mediump float;
      varying vec2 vUv;
      uniform float u_time;
      uniform float u_ratio;
      uniform vec2 u_pointer;

      float lattice(vec2 uv, float t) {
        vec2 g = uv * 18.0;
        float lx = sin(g.x + t * 0.4) * sin(g.y * 0.7 - t * 0.35);
        float ly = sin(g.y + t * 0.45) * sin(g.x * 0.65 + t * 0.2);
        return 0.5 + 0.5 * (lx + ly);
      }

      void main() {
        vec2 uv = vUv;
        uv.x *= u_ratio;
        vec2 p = vUv - u_pointer;
        p.x *= u_ratio;
        float pulse = 0.35 * exp(-3.0 * dot(p, p));
        float t = u_time * 0.0012;
        float n = lattice(uv, t);
        n = pow(n, 2.2);
        n += pulse;
        n *= 0.55 + 0.45 * sin(t * 2.0 + length(uv - vec2(0.5)) * 6.0);
        vec3 c1 = vec3(0.0, 0.85, 0.95);
        vec3 c2 = vec3(0.55, 0.2, 1.0);
        vec3 c3 = vec3(0.15, 1.0, 0.55);
        vec3 col = mix(c1, c2, 0.45 + 0.35 * sin(t + uv.y * 4.0));
        col = mix(col, c3, 0.25 * sin(t * 1.7 + uv.x * 5.0));
        float vign = smoothstep(1.15, 0.25, length(vUv - 0.5));
        float alpha = 0.42 * n * vign;
        gl_FragColor = vec4(col * n * vign, alpha);
      }
    `;

    const vShader = compileShader(gl, vs, gl.VERTEX_SHADER);
    const fShader = compileShader(gl, fs, gl.FRAGMENT_SHADER);
    if (!vShader || !fShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);

    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRatio = gl.getUniformLocation(program, "u_ratio");
    const uPointer = gl.getUniformLocation(program, "u_pointer");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uRatio, canvas.width / canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      pointer.current.tX = e.clientX;
      pointer.current.tY = e.clientY;
    };

    window.addEventListener("pointermove", onMove);

    const loop = () => {
      const t = performance.now();
      pointer.current.x += (pointer.current.tX - pointer.current.x) * 0.12;
      pointer.current.y += (pointer.current.tY - pointer.current.y) * 0.12;
      gl.uniform1f(uTime, t);
      gl.uniform2f(
        uPointer,
        pointer.current.x / window.innerWidth,
        1.0 - pointer.current.y / window.innerHeight,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frameRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vShader);
      gl.deleteShader(fShader);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden
    />
  );
}
