import { DEVICES, deviceMaps, type DeviceName, type Quality } from "./data";
import { DEVICE_FRAGMENT, DEVICE_VERTEX } from "./shaders";
import { pointer, scroll, smoothstep } from "./runtime";

type TextureKey = "tDiffuse" | "tAlpha" | "tMotion" | "tData" | "tPosition" | "tGlass" | "tImage1" | "tImage2" | "tReel";

const UNITS: TextureKey[] = ["tDiffuse", "tAlpha", "tMotion", "tData", "tPosition", "tGlass", "tImage1", "tImage2", "tReel"];

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // Custom screen images may come from another host; WebGL needs CORS for those.
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export interface RendererOptions {
  mode: "images" | "reel";
  video?: HTMLVideoElement | null;
}

/** Renders one baked device (sprite sheet + motion vectors) into a canvas. */
export class DeviceRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private uniforms = new Map<string, WebGLUniformLocation | null>();
  private textures = new Map<TextureKey, WebGLTexture>();
  private random = Math.random() * 1000;
  private mouse = { x: 0.5, y: 0.5 };
  private device: DeviceName | null = null;
  private loadToken = 0;

  transition = 0;
  clickTime = 1e6;
  inside = 0;
  clickUv = { x: 0.5, y: 0.5 };
  ready = false;

  constructor(
    private canvas: HTMLCanvasElement,
    readonly options: RendererOptions,
  ) {
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) throw new Error("WebGL unavailable");
    this.gl = gl;
    this.program = this.createProgram();

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // x, y, u, v for a unit plane centred on the origin
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-0.5, -0.5, 0, 0, 0.5, -0.5, 1, 0, -0.5, 0.5, 0, 1, 0.5, 0.5, 1, 1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(this.program, "position");
    const uv = gl.getAttribLocation(this.program, "uv");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(uv);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    UNITS.forEach((key, unit) => {
      const tex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(this.loc(key), unit);
      this.textures.set(key, tex);
    });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  private createProgram() {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader error");
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, DEVICE_VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, DEVICE_FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link error");
    gl.useProgram(program);
    return program;
  }

  private loc(name: string) {
    if (!this.uniforms.has(name)) this.uniforms.set(name, this.gl.getUniformLocation(this.program, name));
    return this.uniforms.get(name)!;
  }

  private upload(key: TextureKey, source: TexImageSource) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + UNITS.indexOf(key));
    gl.bindTexture(gl.TEXTURE_2D, this.textures.get(key)!);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }

  /** `screens` replaces the two images shown on the device screen (grid mode). */
  async setDevice(device: DeviceName, quality: Quality, screens?: [string, string]) {
    const token = ++this.loadToken;
    const maps = deviceMaps(device, quality);
    const entries: [TextureKey, string | undefined][] = [
      ["tDiffuse", maps.diffuse],
      ["tAlpha", maps.alpha],
      ["tMotion", maps.motion],
      ["tData", maps.data],
      ["tPosition", maps.position],
      ["tGlass", maps.glass],
    ];
    const images: (HTMLImageElement | null)[] = await Promise.all(entries.map(([, src]) => (src ? loadImage(src) : Promise.resolve(null))));
    if (this.options.mode === "images") {
      // A custom screen that fails to load (missing, or no CORS) falls back to the baked one.
      const screen = (custom: string | undefined, fallback: string) =>
        custom ? loadImage(custom).catch(() => loadImage(fallback)) : loadImage(fallback);
      const [s1, s2] = await Promise.all([screen(screens?.[0], maps.image1), screen(screens?.[1] || screens?.[0], maps.image2)]);
      entries.push(["tImage1", undefined], ["tImage2", undefined]);
      images.push(s1, s2);
    }
    if (token !== this.loadToken) return false;
    entries.forEach(([key], i) => {
      const img = images[i];
      if (img) this.upload(key, img);
    });
    this.device = device;
    this.ready = true;
    return true;
  }

  render(timeMs: number, dtMs: number) {
    if (!this.device) return;
    const gl = this.gl;
    const cfg = DEVICES[this.device];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (w === 0 || h === 0) return;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);

    // Ease the pointer and add a slow sway so the device never sits perfectly still.
    const target = smoothstep(0.1, 0.9, pointer.x + 0.1 * Math.sin(0.001 * timeMs));
    const hz = dtMs / (1000 / 60);
    const k = 1 - Math.pow(1 - 0.08, hz);
    this.mouse.x += (target - this.mouse.x) * k;
    this.mouse.y += (pointer.y - this.mouse.y) * k;
    this.clickTime += dtMs / 1200;
    if (this.inside > 0) this.inside = Math.max(0, this.inside - 0.01 * hz);

    const video = this.options.video;
    const useReel = this.options.mode === "reel" && video && video.readyState >= 2;
    if (useReel) this.upload("tReel", video);

    gl.uniform1f(this.loc("time"), timeMs / 1000);
    gl.uniform2f(this.loc("resolution"), w, h);
    gl.uniform1f(this.loc("uTransition"), this.transition);
    gl.uniform1f(this.loc("uColumns"), cfg.columns);
    gl.uniform1f(this.loc("uRows"), cfg.rows);
    gl.uniform1f(this.loc("uDisplacementStrength"), cfg.displacement);
    gl.uniform2f(this.loc("uMouse"), this.mouse.x, this.mouse.y);
    gl.uniform3f(this.loc("uMaps"), cfg.glass ? 1 : 0, 0, 0);
    gl.uniform2f(this.loc("uClickUv"), this.clickUv.x, this.clickUv.y);
    gl.uniform1f(this.loc("uClickTime"), this.clickTime);
    gl.uniform1f(this.loc("uInside"), this.inside);
    gl.uniform1f(this.loc("uSmall"), 0);
    gl.uniform1f(this.loc("uRandom"), this.random);
    gl.uniform1f(this.loc("uUseMask"), useReel ? 1 : 0);
    gl.uniform1f(this.loc("uUseImagesMask"), this.options.mode === "images" ? 1 : 0);
    gl.uniform3f(this.loc("uPositionScaleImage"), cfg.scaleImage[0], cfg.scaleImage[1], 1);
    gl.uniform3f(this.loc("uPositionOffsetImage"), cfg.offsetImage[0], cfg.offsetImage[1], 0);
    gl.uniform1f(this.loc("uVelocity"), scroll.velocity);
    gl.uniform1f(this.loc("glass_uGridSize"), 8);
    gl.uniform1f(this.loc("glass_uStrength"), 2.2);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Starts the hover ripple from a point given in canvas UV space (y up). */
  hover(u: number, v: number) {
    this.clickUv = { x: u, y: v };
    this.clickTime = 0;
    this.inside = 1;
  }

  dispose() {
    this.loadToken++;
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
