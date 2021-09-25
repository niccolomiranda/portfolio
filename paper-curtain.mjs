//Niccolo Miranda 2021. All rights reserved.
//This repo resources cannot be used or build upon
//in personal or commercial projects such as websites,
//web apps and web templates intended for sale. It is
//not allowed to take the resource "as-is" and sell it,
//redistribute, re-publish it, or sell "pluginized" versions of it.
//Free plugins built using this resource should have a visible mention
//and link to the original work.

import { Renderer } from "https://unpkg.com/ogl@0.0.74/src/core/Renderer.js";
import { Program } from "https://unpkg.com/ogl@0.0.74/src/core/Program.js";
import { Texture } from "https://unpkg.com/ogl@0.0.74/src/core/Texture.js";
import { Triangle } from "https://unpkg.com/ogl@0.0.74/src/extras/Triangle.js";
import { Mesh } from "https://unpkg.com/ogl@0.0.74/src/core/Mesh.js";
import { Vec2 } from "https://unpkg.com/ogl@0.0.74/src/math/Vec2.js";
import { Color } from "https://unpkg.com/ogl@0.0.74/src/math/Color.js";

//import * as dat from 'https://unpkg.com/dat.gui@0.7.7/build/dat.gui.module.js'

//const GUI = new dat.GUI();
//GUI.hide()

class PaperCurtain {
  constructor(gl, {color,background,backgroundOpacity,texture,amplitude,rippedFrequency,rippedAmplitude,curveFrequency,curveAmplitude,rippedDelta,rippedHeight,horizontal} = {}) {
    this.gl = gl
    
    const geometry = new Triangle(gl);

    const vertex = /* glsl */ `
      attribute vec2 uv;
      attribute vec2 position;
      varying vec2 vUv;
      varying vec2 vImageUv;

      uniform vec2 uRatio;

      float map(float value, float min1, float max1, float min2, float max2) {
        return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
      }

      void main() {
          vUv = uv;
          vImageUv = vec2(
            map(uv.x, 0.0, 1.0, 0.5 - uRatio.x / 2.0, 0.5 + uRatio.x / 2.0),
            map(uv.y, 0.0, 1.0, 0.5 - uRatio.y / 2.0, 0.5 + uRatio.y / 2.0)
          );
          gl_Position = vec4(position, 0, 1);
      }
    `;

    const fragment = /* glsl */ `
        #define PI 3.1415926538
        #define NUM_OCTAVES 5

        precision highp float;
        uniform float uHorizontal;
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
        uniform sampler2D uImage;
        uniform vec3 uBackground;
        uniform float uBackgroundOpacity;
        uniform bool uInverted;
        varying vec2 vUv;
        varying vec2 vImageUv;

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
          float curve = amplitude * uMaxAmplitude *  sin((uHorizontal == 1. ? (1. - vUv.x) : vUv.y) * PI);

          float rippedNoise1 = fbm(aspectUv * uRippedNoiseFrequency) * uRippedNoiseAmplitude * amplitude;
          float curveNoise1 = snoise((aspectUv + vec2(-0.5)) * uCurveNoiseFrequency) * uCurveNoiseAmplitude * amplitude;

          float rippedNoise2 = fbm((aspectUv + vec2(uRippedDelta)) * uRippedNoiseFrequency) * uRippedNoiseAmplitude * amplitude;
          float curveNoise2 = snoise((aspectUv + vec2(uRippedDelta)) * uCurveNoiseFrequency) * uCurveNoiseAmplitude * amplitude;

          float colorLimit =  1. - (uProgress + curve - rippedNoise1 - curveNoise1 - ((uRippedHeight * .5) * amplitude));
          float rippedLimit =  1. - (uProgress + curve - rippedNoise2 - curveNoise2 + ((uRippedHeight * .5) * amplitude));

          gl_FragColor.rgb = uBackground;
          gl_FragColor.a = uBackgroundOpacity;

          if( (uHorizontal == 1. ? (1. - vUv.x) : vUv.y) > colorLimit) {
            vec4 image = texture2D(uImage, uInverted ? vec2(0.,1.) - vImageUv : vImageUv );
            if(image.a > 0.) {
              gl_FragColor = image;
            } else {
              gl_FragColor = vec4(uColor,1.);
            }
          } else if( (uHorizontal == 1. ? (1. - vUv.x) : vUv.y) > rippedLimit) {
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
    img.onload = () => (this.texture.image = img);
    img.src = texture;
    

    const params = {
      color: new Color(color)
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
      uImage: {
        value: new Texture(this.gl)
      },
      uRatio: {
        value: new Vec2(0,0)
      },
      uColor: {
        value: params.color
      },
      uBackground: {
        value: new Color(background)
      },
      uBackgroundOpacity: {
        value: backgroundOpacity
      },
      uInverted: {
        value: false
      },
      uHorizontal: {
         value: horizontal ? 1 : 0
      }
    }

    const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: this.uniforms,
        transparent:true 
    });

    this.mesh = new Mesh(gl, { geometry, program });
  }

  setBackground(color,opacity) {
    this.uniforms.uBackground.value = new Color(color)
    this.uniforms.uBackgroundOpacity.value = opacity
  }

  setColor(color) {
    this.uniforms.uColor.value = new Color(color)
  }

  setInverted(value) {
    this.uniforms.uInverted.value = value
  }

  setImage(src) {
    const texture = new Texture(this.gl, {
      wrapS: this.gl.REPEAT,
      wrapT: this.gl.REPEAT
    });

    

    const img = new Image();
    img.crossOrigin = 'anonymous'
    const promise = new Promise((resolve,reject) => {
      img.onload = () => {
        texture.image = img
        const naturalRatio = img.naturalWidth/img.naturalHeight
        const viewportRatio = window.innerWidth/window.innerHeight
        const width = viewportRatio > naturalRatio ? window.innerWidth : window.innerHeight * naturalRatio
        const height = width / naturalRatio
        const ratio = new Vec2(
          window.innerWidth / width,
          window.innerHeight / height
        )
        this.uniforms.uRatio.value = ratio
        this.uniforms.uImage.value = texture
  
        resolve()
      }
    })


    img.src = src;
    

    return promise
  }
}




export default class PaperCurtainEffect {
  constructor(canvas, {
    color="#292929",
    background= "#292929",
    backgroundOpacity= 0,
    ease = 'power2.inOut',
    duration = 2,
    texture = '',
    amplitude = 0.25,
    rippedFrequency= 3.5,
    rippedAmplitude= 0.05,
    curveFrequency= 1,
    curveAmplitude= 1,
    rippedDelta= 1,
    rippedHeight= 0.07,
    horizontal = false
  } = {}) {
    this.canvas = canvas

    this.initGL()

    // watch canvas target size
    this.onCanvasResizeHandler = this.onCanvasResize.bind(this)

    this.resizeObserver = new ResizeObserver(this.onCanvasResizeHandler)
    this.resizeObserver.observe(this.canvas)

    this.curtain = new PaperCurtain(this.gl, {color,background,backgroundOpacity,texture,amplitude,rippedFrequency,rippedAmplitude,curveFrequency,curveAmplitude,rippedDelta,rippedHeight,horizontal})

    // frame loop
    this.onFrameHandler = this.onFrame.bind(this)
    gsap.ticker.add(this.onFrameHandler)
    //requestAnimationFrame(this.onFrameHandler)

    this.isLooping = false
    this.ease = ease
    this.duration = duration
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
    this.renderer = new Renderer({canvas: this.canvas, antialias: true, alpha:true,dpr: 1});
    this.gl = this.renderer.gl;
  }

  in() {
    if(this.tl) this.tl.kill()
    this.tl = gsap.to(this.curtain.uniforms.uProgress, {
      value: 1,
      duration: this.duration,
      ease: this.ease,
      onComplete:()=>{
        document.body.dispatchEvent(new Event('paper-curtain'))
      }
    })
  }

  out() {
    if(this.tl) this.tl.kill()
    this.tl = gsap.to(this.curtain.uniforms.uProgress, {
      value: 0,
      duration: this.duration,
      ease: this.ease,
      onComplete:()=>{
        document.body.dispatchEvent(new Event('paper-curtain'))
      }
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



    //requestAnimationFrame(this.onFrameHandler)
  }
}
