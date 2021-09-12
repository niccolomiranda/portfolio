import { Renderer } from "https://unpkg.com/ogl@0.0.74/src/core/Renderer.js";
import { Program } from "https://unpkg.com/ogl@0.0.74/src/core/Program.js";
import { Texture } from "https://unpkg.com/ogl@0.0.74/src/core/Texture.js";
import { Triangle } from "https://unpkg.com/ogl@0.0.74/src/extras/Triangle.js";
import { Mesh } from "https://unpkg.com/ogl@0.0.74/src/core/Mesh.js";
import { Flowmap } from "https://unpkg.com/ogl@0.0.74/src/extras/Flowmap.js";
import { Vec2 } from "https://unpkg.com/ogl@0.0.74/src/math/Vec2.js";

class GLContext extends Rect {
  constructor(element) {
    super(element);
    this.element = element;
    this.renderer = new Renderer({ alpha: true });
    this.gl = this.renderer.gl;
    this.element.appendChild(this.gl.canvas);
  }

  onResize(e) {
    super.onResize(e);

    this.renderer.setSize(this.width, this.height);
    this.aspect = this.width / this.height;
  }
}

class GLImage extends GLContext {
  constructor(element) {
    super(element);

    this.texture = new Texture(this.gl);

    this.image = element.querySelector("img");
    this.image.crossOrigin = "anonymous";
    this.onLoad = this.onLoad.bind(this);
    if (this.image.naturalWidth) this.onLoad();
    this.image.addEventListener("load", this.onLoad);

    const texture = new Texture(this.gl, {
      wrapS: this.gl.REPEAT,
      wrapT: this.gl.REPEAT
    });
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => (texture.image = img);
    img.src =
      "https://h5fwhsu236.execute-api.us-east-2.amazonaws.com/ProxyBizarro?URL=https://www.shadertoy.com/media/a/85a6d68622b36995ccb98a89bbb119edf167c914660e4450d313de049320005c.png";

    // Variable inputs to control flowmap
    this.aspect = 1;
    this.mouse = new Vec2(-1);
    this.velocity = new Vec2();

    this.flowmap = new Flowmap(this.gl);

    this.geometry = new Triangle(this.gl);
    this.program = new Program(this.gl, {
      uniforms: {
        uTime: {
          value: 0
        },
        uTexture: {
          value: this.texture
        },
        uFlow: this.flowmap.uniform,
        uDithering: {
          value: texture
        }
      },
      vertex: `
        attribute vec2 position;
        attribute vec2 uv;

        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 0., 1.);
        }
      `,
      fragment: `
        precision highp float;

        uniform sampler2D uTexture;
        uniform sampler2D uFlow;
        uniform sampler2D uDithering;
        uniform float uTime;

        varying vec2 vUv;

          
        float luma(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
        }

        float luma(vec4 color) {
          return dot(color.rgb, vec3(0.299, 0.587, 0.114));
        }

        float dither8x8(vec2 position, float brightness) {
          int x = int(mod(position.x, 8.0));
          int y = int(mod(position.y, 8.0));
          int index = x + y * 8;
          float limit = 0.0;
        
          if (x < 8) {
            if (index == 0) limit = 0.015625;
            if (index == 1) limit = 0.515625;
            if (index == 2) limit = 0.140625;
            if (index == 3) limit = 0.640625;
            if (index == 4) limit = 0.046875;
            if (index == 5) limit = 0.546875;
            if (index == 6) limit = 0.171875;
            if (index == 7) limit = 0.671875;
            if (index == 8) limit = 0.765625;
            if (index == 9) limit = 0.265625;
            if (index == 10) limit = 0.890625;
            if (index == 11) limit = 0.390625;
            if (index == 12) limit = 0.796875;
            if (index == 13) limit = 0.296875;
            if (index == 14) limit = 0.921875;
            if (index == 15) limit = 0.421875;
            if (index == 16) limit = 0.203125;
            if (index == 17) limit = 0.703125;
            if (index == 18) limit = 0.078125;
            if (index == 19) limit = 0.578125;
            if (index == 20) limit = 0.234375;
            if (index == 21) limit = 0.734375;
            if (index == 22) limit = 0.109375;
            if (index == 23) limit = 0.609375;
            if (index == 24) limit = 0.953125;
            if (index == 25) limit = 0.453125;
            if (index == 26) limit = 0.828125;
            if (index == 27) limit = 0.328125;
            if (index == 28) limit = 0.984375;
            if (index == 29) limit = 0.484375;
            if (index == 30) limit = 0.859375;
            if (index == 31) limit = 0.359375;
            if (index == 32) limit = 0.0625;
            if (index == 33) limit = 0.5625;
            if (index == 34) limit = 0.1875;
            if (index == 35) limit = 0.6875;
            if (index == 36) limit = 0.03125;
            if (index == 37) limit = 0.53125;
            if (index == 38) limit = 0.15625;
            if (index == 39) limit = 0.65625;
            if (index == 40) limit = 0.8125;
            if (index == 41) limit = 0.3125;
            if (index == 42) limit = 0.9375;
            if (index == 43) limit = 0.4375;
            if (index == 44) limit = 0.78125;
            if (index == 45) limit = 0.28125;
            if (index == 46) limit = 0.90625;
            if (index == 47) limit = 0.40625;
            if (index == 48) limit = 0.25;
            if (index == 49) limit = 0.75;
            if (index == 50) limit = 0.125;
            if (index == 51) limit = 0.625;
            if (index == 52) limit = 0.21875;
            if (index == 53) limit = 0.71875;
            if (index == 54) limit = 0.09375;
            if (index == 55) limit = 0.59375;
            if (index == 56) limit = 1.0;
            if (index == 57) limit = 0.5;
            if (index == 58) limit = 0.875;
            if (index == 59) limit = 0.375;
            if (index == 60) limit = 0.96875;
            if (index == 61) limit = 0.46875;
            if (index == 62) limit = 0.84375;
            if (index == 63) limit = 0.34375;
          }
        
          return brightness < limit ? 0.0 : 1.0;
        }
        
        vec3 dither8x8(vec2 position, vec3 color) {
          return color * dither8x8(position, luma(color));
        }
        
        vec4 dither8x8(vec2 position, vec4 color) {
          return vec4(color.rgb * dither8x8(position, luma(color)), 1.0);
        }

        void main() {


          // R and G values are velocity in the x and y direction
          // B value is the velocity length
          vec3 flow = texture2D(uFlow, vUv).rgb;
          // Use flow to adjust the uv lookup of a texture
          vec2 uv = vUv;
          uv -= flow.b * 0.01;
          vec4 tex = texture2D(uTexture, uv);
          // Oscillate between raw values and the affected texture above
          //tex = mix(tex, flow * 0.5 + 0.5, smoothstep( -0.3, 0.7, sin(uTime)));
          vec4 dithered = dither8x8(gl_FragCoord.xy,texture2D(uTexture,uv));
          // float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));

          gl_FragColor = mix( tex, dithered *3., flow.b);

          // vec4 o = step(texture2D(uDithering, vUv/8.).g, texture2D(uTexture,vUv));
          // gl_FragColor = dither8x8(gl_FragCoord.xy,texture2D(uTexture,uv));
          //gl_FragColor.a = 1.0;
        }
      `
    });
    this.mesh = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });

    this.lastTime = false;
    this.lastMouse = new Vec2();

    this.onMouseMove = this.onMouseMove.bind(this);
    this.element.addEventListener("mousemove", this.onMouseMove);

    this.onFrame = this.onFrame.bind(this);
    gsap.ticker.add(this.onFrame);
  }

  onMouseMove(e) {
    // if (e.changedTouches && e.changedTouches.length) {
    //   e.x = e.changedTouches[0].offsetX;
    //   e.y = e.changedTouches[0].offsetY;
    // }
    // if (e.x === undefined) {
    // e.x = e.offsetX;
    // e.y = e.offsetY;
    // }

    const x = e.offsetX;
    const y = e.offsetY;

    // Get mouse value in 0 to 1 range, with y flipped
    this.mouse.set(
      x / this.gl.renderer.width,
      1.0 - y / this.gl.renderer.height
    );

    // Calculate velocity
    if (!this.lastTime) {
      // First frame
      this.lastTime = performance.now();
      this.lastMouse.set(x, y);
    }

    const deltaX = x - this.lastMouse.x;
    const deltaY = y - this.lastMouse.y;

    this.lastMouse.set(x, y);

    let time = performance.now();

    // Avoid dividing by 0
    let delta = Math.max(14, time - this.lastTime);
    this.lastTime = time;

    this.velocity.x = deltaX / delta;
    this.velocity.y = deltaY / delta;

    // Flag update to prevent hanging velocity values when not moving
    this.velocity.needsUpdate = true;
  }

  onLoad() {
    this.texture.image = this.image;
  }

  onFrame(t) {
    // Reset velocity when mouse not moving
    if (!this.velocity.needsUpdate) {
      this.mouse.set(-1);
      this.velocity.set(0);
    }
    this.velocity.needsUpdate = false;

    // Update flowmap inputs
    this.flowmap.aspect = this.aspect;
    this.flowmap.mouse.copy(this.mouse);

    // Ease velocity input, slower when fading out
    this.flowmap.velocity.lerp(this.velocity, this.velocity.len ? 0.5 : 0.1);

    this.flowmap.update();

    this.program.uniforms.uTime.value = t * 0.001;

    this.renderer.render({ scene: this.mesh });
  }
}

export { GLContext, GLImage };
