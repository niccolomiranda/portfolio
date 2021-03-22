import {
    Renderer,
    Camera,
    Program,
    Mesh,
    Triangle,
    Texture, Color
  } from "https://unpkg.com/ogl@0.0.65/src/index.mjs";
  
  import * as dat from 'https://unpkg.com/dat.gui@0.7.7/build/dat.gui.module.js'
  
  const GUI = new dat.GUI();
  
  class PaperCurtain {
    constructor(gl, {color,texture,amplitude,rippedFrequency,rippedAmplitude,curveFrequency,curveAmplitude,rippedDelta,rippedHeight} = {}) {
      const geometry = new Triangle(gl);
  
      const vertex = /* glsl */ `
        attribute vec2 uv;
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 0, 1);
        }
      `;
  
      const fragment = /* glsl */ `
          #define PI 3.1415926538
          #define NUM_OCTAVES 5
  
          precision highp float;
          uniform float uProgress;
          uniform float uMaxAmplitude;
          uniform float uRippedNoiseFrequency;
          uniform float uCurveNoiseFrequency;
          uniform float uRippedNoiseAmplitude;
          uniform float uCurveNoiseAmplitude;
          uniform float uAspect;
          uniform float uRippedDelta;
          uniform sampler2D uTexture;
          uniform float uRippedHeight;
          uniform vec3 uColor;
          varying vec2 vUv;
  
          // Simplex 2D noise
          //
          vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
          
          float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
              dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
          }
  
          float fbm(vec2 x) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100);
            // Rotate to reduce axial bias
              mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
            for (int i = 0; i < NUM_OCTAVES; ++i) {
              v += a * snoise(x);
              x = rot * x * 2.0 + shift;
              a *= 0.5;
            }
            return v;
          }
  
          void main() {
            vec2 aspectUv = vUv * vec2(uAspect, 1.);
  
  
            float amplitude = sin(uProgress * PI);
            float curve = amplitude * uMaxAmplitude *  sin(vUv.x * PI);
  
            float rippedNoise1 = fbm(aspectUv * uRippedNoiseFrequency) * uRippedNoiseAmplitude * amplitude;
            float curveNoise1 = snoise((aspectUv + vec2(-0.5)) * uCurveNoiseFrequency) * uCurveNoiseAmplitude * amplitude;
  
            float rippedNoise2 = fbm((aspectUv + vec2(uRippedDelta)) * uRippedNoiseFrequency) * uRippedNoiseAmplitude * amplitude;
            float curveNoise2 = snoise((aspectUv + vec2(uRippedDelta)) * uCurveNoiseFrequency) * uCurveNoiseAmplitude * amplitude;
  
            float colorLimit =  1. - (uProgress + curve - rippedNoise1 - curveNoise1 - ((uRippedHeight * .5) * amplitude));
            float rippedLimit =  1. - (uProgress + curve - rippedNoise2 - curveNoise2 + ((uRippedHeight * .5) * amplitude));
  
            gl_FragColor.rgb = vec3(1.0);
            gl_FragColor.a = 0.0;
  
            if(vUv.y > colorLimit) {
              gl_FragColor = vec4(uColor,1.);
            } else if(vUv.y > rippedLimit) {
              gl_FragColor = texture2D(uTexture, aspectUv);
            }
              
              
          }
      `;
  
      // Upload empty texture while source loading
      this.texture = new Texture(gl, {
        wrapS: gl.REPEAT,
        wrapT: gl.REPEAT
      });
  
      // update image value with source once loaded
      const img = new Image();
      img.crossOrigin = 'anonymous'
      img.src = texture;
      img.onload = () => (this.texture.image = img);
  
      const params = {
        color: new Color([color[0] / 255,color[1] / 255,color[2] / 255])
      }
  
      this.uniforms = {
        uProgress: { value: 0 },
        uMaxAmplitude: {
          value: amplitude
        },
        uAspect: {
          value:1
        },
        uTexture: {
          value: this.texture
        },
        uRippedNoiseFrequency: {
          value: rippedFrequency
        },
        uRippedNoiseAmplitude: {
          value: rippedAmplitude
        },
        uCurveNoiseFrequency: {
          value: curveFrequency
        },
        uCurveNoiseAmplitude: {
          value: curveAmplitude
        },
        uRippedHeight: {
          value: rippedHeight
        },
        uRippedDelta: {
          value: rippedDelta
        },
        uColor: {
          value: params.color
        }
      }
  
      const program = new Program(gl, {
          vertex,
          fragment,
          uniforms: this.uniforms,
          transparent:true 
      });
  
      this.mesh = new Mesh(gl, { geometry, program });
    
      GUI.add(this.uniforms.uMaxAmplitude, 'value').name('amplitude')
      GUI.add(this.uniforms.uRippedNoiseFrequency, 'value').name('ripped frequency').step(0.01)
      GUI.add(this.uniforms.uRippedNoiseAmplitude, 'value').name('ripped amplitude').step(0.01)
      GUI.add(this.uniforms.uCurveNoiseFrequency, 'value').name('curve frequency').step(0.01)
      GUI.add(this.uniforms.uCurveNoiseAmplitude, 'value').name('curve amplitude').step(0.01)
      GUI.add(this.uniforms.uRippedDelta, 'value').name('ripped delta').step(0.01)
      GUI.add(this.uniforms.uRippedHeight, 'value').name('ripped height').step(0.01)
      GUI.add(this.uniforms.uProgress, 'value').name('progress').min(0).max(1).step(0.01).listen()
      GUI.addColor(params, 'color').name('color').onChange((color)=>{
        const [x,y,z] = color
        this.uniforms.uColor.value = new Color(x / 255,y / 255,z / 255)
      })
    }
  }
  
  
  
  
  export default class PaperCurtainEffect {
    constructor(canvas, {
      color=[29,29,29],
      ease = 'power3.inOut',
      duration = 2,
      texture = '',
      amplitude = 0.25,
      rippedFrequency= 3.5,
      rippedAmplitude= 0.05,
      curveFrequency= 1,
      curveAmplitude= 1,
      rippedDelta= 1,
      rippedHeight= 0.07
    } = {}) {
      this.canvas = canvas
  
      this.initGL()
  
      // watch canvas target size
      this.onCanvasResizeHandler = this.onCanvasResize.bind(this)
  
      this.resizeObserver = new ResizeObserver(this.onCanvasResizeHandler)
      this.resizeObserver.observe(this.canvas)
  
      this.curtain = new PaperCurtain(this.gl, {color,texture,amplitude,rippedFrequency,rippedAmplitude,curveFrequency,curveAmplitude,rippedDelta,rippedHeight})
  
      // frame loop
      this.onFrameHandler = this.onFrame.bind(this)
      requestAnimationFrame(this.onFrameHandler)
  
      this.isLooping = false
      this.ease = ease
      this.duration = duration
  
      GUI.add(this,'in')
      GUI.add(this,'out')
      GUI.add(this,'isLooping')
      GUI.add(this, 'ease')
      GUI.add(this, 'duration')
    }
  
    destroy() {
      this.resizeObserver.unobserve(this.canvas)
    }
  
    onCanvasResize(entries) {
      // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
      const entry = entries[0]
      this.canvasSize = {
        width: entry.contentRect.width,
        height: entry.contentRect.height
      }
  
      this.resizeGL()
    }
  
    initGL() {
      //  renderer
      this.renderer = new Renderer({canvas: this.canvas, antialias: true, alpha:true,dpr: devicePixelRatio});
      this.gl = this.renderer.gl;
  
      // camera
      this.camera = new Camera(this.gl);
      this.camera.position.z = 5;
    }
  
    in() {
      this.tl = gsap.fromTo(this.curtain.uniforms.uProgress, {
        value: 0
      }, {
        value: 1,
        duration: this.duration,
        ease: this.ease
      })
    }
  
    out() {
      this.tl = gsap.fromTo(this.curtain.uniforms.uProgress, {
        value: 1
      }, {
        value: 0,
        duration: this.duration,
        ease: this.ease
      })
    }
  
    resizeGL() {
      this.renderer.setSize(this.canvasSize.width, this.canvasSize.height);
      this.curtain.uniforms.uAspect.value = this.canvasSize.width/this.canvasSize.height;
    }
  
    onFrame() {
      // render
      this.renderer.render({ scene : this.curtain.mesh});
  
      if(this.isLooping) {
        this.time = (this.time ?? 0) + 0.01
  
        this.curtain.uniforms.uProgress.value = (Math.sin(this.time) + 1) * 0.5
      }
  
  
  
      requestAnimationFrame(this.onFrameHandler)
    }
  }
  