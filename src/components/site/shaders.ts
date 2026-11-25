// Device shader. Each device is a baked sprite sheet of camera angles; pointer X picks
// the frame and the motion-vector map warps between neighbouring frames.

export const DEVICE_VERTEX = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;

uniform float time;
uniform float uTransition;
uniform float uRandom;

varying vec2 vUv;

vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  mat2 m = mat2(c, s, -s, c);
  return m * v;
}

void main() {
  vUv = uv;
  vec2 pos = position;

  float speed = 0.4;
  float timerScaler = time * speed;

  pos.xy += vec2(-0.5, 0.5);
  pos.xy *= 1. - (1. - uTransition) * 0.3 + cos(timerScaler + uRandom) * 0.02;
  pos.xy -= vec2(-0.5, 0.5);
  pos.y -= (1. - uTransition) * 0.4;

  pos.x += sin(timerScaler * 0.6 + uRandom) * 0.015;
  pos.x += sin(timerScaler + uRandom) * 0.01;
  pos.y += sin(timerScaler * 0.85 + cos(time) + uRandom) * 0.01;
  pos.y += sin(timerScaler * 1.05 + uRandom) * 0.01;
  pos.xy = rotate(pos.xy, sin(time * speed * 0.9 + uRandom) * 0.04 + (1. - uTransition) * 0.1);

  gl_Position = vec4(pos * 2.0, 0.0, 1.0);
}
`;

export const DEVICE_FRAGMENT = /* glsl */ `
precision highp float;

uniform sampler2D tDiffuse;
uniform sampler2D tAlpha;
uniform sampler2D tMotion;
uniform sampler2D tPosition;
uniform sampler2D tData;
uniform sampler2D tReel;
uniform sampler2D tGlass;
uniform sampler2D tImage1;
uniform sampler2D tImage2;

uniform float time;
uniform vec2 resolution;
uniform float uTransition;
uniform float uColumns;
uniform float uRows;
uniform float uDisplacementStrength;
uniform vec2 uMouse;
uniform vec3 uMaps;
uniform vec2 uClickUv;
uniform float uClickTime;
uniform float uInside;
uniform float uSmall;
uniform float uRandom;
uniform float uUseMask;
uniform float uUseImagesMask;
uniform vec3 uPositionScaleImage;
uniform vec3 uPositionOffsetImage;
uniform float uVelocity;
uniform float glass_uGridSize;
uniform float glass_uStrength;

varying vec2 vUv;

float range(float oldValue, float oldMin, float oldMax, float newMin, float newMax) {
  vec3 sub = vec3(oldValue, newMax, oldMax) - vec3(oldMin, newMin, oldMin);
  return sub.x * sub.y / sub.z + newMin;
}
vec2 range(vec2 oldValue, vec2 oldMin, vec2 oldMax, vec2 newMin, vec2 newMax) {
  return (oldValue - oldMin) * (newMax - newMin) / (oldMax - oldMin) + newMin;
}
float crange(float oldValue, float oldMin, float oldMax, float newMin, float newMax) {
  return clamp(range(oldValue, oldMin, oldMax, newMin, newMax), min(newMin, newMax), max(newMin, newMax));
}
vec2 crange(vec2 oldValue, vec2 oldMin, vec2 oldMax, vec2 newMin, vec2 newMax) {
  return clamp(range(oldValue, oldMin, oldMax, newMin, newMax), min(newMin, newMax), max(newMin, newMax));
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 getRGB(sampler2D tex, vec2 uv, float angle, float amount) {
  vec2 offset = vec2(cos(angle), sin(angle)) * amount;
  vec4 r = texture2D(tex, uv + offset);
  vec4 g = texture2D(tex, uv);
  vec4 b = texture2D(tex, uv - offset);
  return vec4(r.r + g.r * amount, g.g + r.b * amount, b.b + b.g * amount, g.a);
}

vec2 scaleUV(vec2 uv, vec2 scale) {
  return (uv - 0.5) / scale + 0.5;
}

float blendOverlay(float base, float blend) {
  return base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
}
vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
  vec3 o = vec3(blendOverlay(base.r, blend.r), blendOverlay(base.g, blend.g), blendOverlay(base.b, blend.b));
  return o * opacity + base * (1.0 - opacity);
}

vec2 getSubUV(vec2 dimensions, vec2 uv, float index) {
  float idx = index * (1.0 / dimensions.x);
  uv /= dimensions;
  uv.y += (1.0 / dimensions.y) * (dimensions.y - 1.0);
  uv.x += floor(fract(idx) * dimensions.x) / dimensions.x;
  uv.y -= floor(fract(idx / dimensions.y) * dimensions.y) / dimensions.y;
  return uv;
}

vec2 remap(vec2 d, float strength) {
  return crange(d, vec2(0.0), vec2(1.0), vec2(-1.0), vec2(1.0)) * strength;
}

vec4 getMap(sampler2D tMap, float blend, vec2 subUv, vec2 subUvNext, vec2 disp, vec2 dispNext) {
  vec4 color = texture2D(tMap, subUv - disp * blend);
  vec4 colorNext = texture2D(tMap, subUvNext + dispNext * (1.0 - blend));
  return mix(color, colorNext, blend);
}

vec2 getDisplacement(sampler2D tMotion, vec2 uv, float strength) {
  return remap(texture2D(tMotion, uv).rg, strength);
}

void main() {
  vec4 color = vec4(0.);

  vec2 dimensions = vec2(uColumns, uRows);
  float MAX_INDEX = uColumns * uRows - 1.0;

  float controller = mix(smoothstep(0.1, 0.4, uTransition), uMouse.x, smoothstep(0.2, 1.0, uTransition));
  float index = crange(controller, 0.0, 1.0, 1.0, MAX_INDEX);
  float blend = fract(index);

  vec2 uv = vUv;
  vec2 subUv = getSubUV(dimensions, uv, index);
  vec2 subUvNext = getSubUV(dimensions, uv, index + 1.0);

  float displacementStrength = uDisplacementStrength * 0.01;
  vec2 displacement = getDisplacement(tMotion, subUv, displacementStrength);
  vec2 displacementNext = getDisplacement(tMotion, subUvNext, displacementStrength);

  vec2 st = gl_FragCoord.xy / resolution.xy;

  vec3 position = getMap(tPosition, blend, subUv, subUvNext, displacement, displacementNext).rgb;

  float pulse = 0.;
  float tD = (1. - uTransition);
  float driver = 1.0 - clamp(uClickTime * 0.7, 0.0, 1.0);
  float t = -pow(driver, 4.0) * 4.0;
  float v = smoothstep(0.0, 1.0, position.y + sin(position.x * 4.0 + time + tD * 6.0) * mix(0.3, 0.1, abs(0.5 - position.x)) * 0.5 * smoothstep(0.0, 0.2, tD) + (1.0 - tD * 2.0));

  if (uInside > 0.0) {
    vec2 clickUv = getSubUV(dimensions, uClickUv, index);
    vec2 clickUvNext = getSubUV(dimensions, uClickUv, index + 1.0);
    vec4 clickPos = getMap(tPosition, blend, clickUv, clickUvNext, displacement, displacementNext);
    float gradient = length(position - clickPos.xyz) * mix(.35, 0.31, uSmall);
    pulse = sin(gradient * 15.0 - t + 3.8) * 0.5 + 0.5;
    float powMulti = mix(10.0, 6.0, uSmall);
    pulse = pow(pulse, powMulti - driver * powMulti);
    pulse += pow(pulse, (powMulti * 3.0) - driver * (powMulti * 1.5));
    pulse *= driver;
    pulse *= 1.0 - smoothstep(0.9, 1.0, driver);
    pulse *= 1.0 - clamp(gradient * 3.0, 0.0, 1.0);
    pulse *= 12.0;
    pulse *= dot(color.rgb, vec3(1.)) * 0.5 + 0.15;
    pulse += (1. - v);
  }
  pulse *= uInside;

  float pixellation = 400.;
  float maskAlpha = getMap(tAlpha, blend, subUv, subUvNext, displacement, displacementNext).r;
  float uvMix = pulse * 3. + (1.0 - v) * 50.0;
  uvMix = mix(0.0, uvMix, maskAlpha);
  uvMix *= step(0.02, uClickTime);
  uvMix *= 1.1;
  subUv = mix(subUv, floor(subUv * pixellation) / pixellation, uvMix);
  subUvNext = mix(subUvNext, floor(subUvNext * pixellation) / pixellation, uvMix);
  color = getMap(tDiffuse, blend, subUv, subUvNext, displacement, displacementNext);

  color.a = color.a * mix(1.0, pow(v, 5.0) + 0.2, step(0.2, 1.0 - uTransition)) * maskAlpha;

  if (uMaps.x > 0.5) {
    float glassMax = glass_uGridSize * glass_uGridSize - 1.0;
    float glassIndex = crange(uMouse.x, 0.0, 1.0, 1.0, glassMax);
    float glassBlend = fract(glassIndex);
    vec2 glassUv = getSubUV(vec2(glass_uGridSize), uv, glassIndex);
    vec2 glassUvNext = getSubUV(vec2(glass_uGridSize), uv, glassIndex + 1.0);
    vec3 glass = mix(texture2D(tGlass, glassUv).rgb, texture2D(tGlass, glassUvNext).rgb, glassBlend);
    color.rgb = pow(color.rgb, vec3(glass_uStrength));
    glass = pow(glass, vec3(glass_uStrength));
    color.rgb += glass;
    color.rgb = pow(color.rgb, vec3(0.45));
  }

  vec3 pulseColor = vec3(0.);
  if (uInside > 0.) {
    pulse *= dot(color.rgb, vec3(1.)) * 0.5 + 0.5;
    vec3 pc = rgb2hsv(vec3(1.0, 0.5, 0.0));
    pc.x += (-0.5 + smoothstep(0.4, 1.0, pulse)) * 0.1 - 0.08;
    pc = hsv2rgb(pc);
    pc = mix(pc, vec3(1.0), subUvNext.x * subUvNext.y * subUv.x * subUv.y);
    pc = pow(pulse, 3.0) * pc;
    color.rgb = pow(color.rgb, vec3(2.2));
    color.rgb += pc * mix(1.0, 0.15, uSmall);
    color.rgb *= mix(1.0, 2.0, pow(pulse, 4.0));
    color.rgb = pow(color.rgb, vec3(0.45));
  }

  vec3 hueShift = rgb2hsv(color.rgb);
  hueShift.x += color.a * 2.0;
  color.rgb = hsv2rgb(hueShift);

  if (uUseMask > 0.5) {
    float maskValue = getMap(tData, blend, subUv, subUvNext, displacement, displacementNext).r;
    vec2 maskedUV = scaleUV(st, vec2(0.8));
    maskedUV.x += (-0.5 + uMouse.x) * 0.2;
    maskedUV.y -= 0.05;
    maskedUV.y += mod(maskedUV.y, 0.012) * uVelocity * 0.9;

    uvMix = pulse * 1. + (1.0 - v) * 30.0;
    pixellation *= 0.2;
    maskedUV = mix(maskedUV, floor(maskedUV * pixellation) / pixellation, uvMix * 5.0);
    maskedUV *= 1.0 + pulse * 0.5;

    vec3 reel = getRGB(tReel, maskedUV, 0.2, 0.003 + uVelocity * 0.0005 + pulse * 0.02).rgb;
    reel *= mix(0.0, 1.0, smoothstep(0.0, 0.5, abs(0.5 - maskValue)));
    reel *= mix(0.5, 1.0, smoothstep(1.5, 0.0, length(position.rg - 0.5)));
    reel *= 0.9 + pow(pulse, 4.0) * 0.05;
    reel += maskedUV.x * maskedUV.y * 0.1;

    color.rgb = mix(color.rgb, reel, smoothstep(0.0, 0.2, maskValue));
    color.rgb *= 1.0 + reel.r * 0.1;
  }

  if (uUseImagesMask > 0.5) {
    float maskValue = getMap(tData, blend, subUv, subUvNext, displacement, displacementNext).r;

    vec2 imageUV = scaleUV(vUv, vec2(0.9, 0.4));
    imageUV = scaleUV(imageUV, uPositionScaleImage.xy);
    imageUV += uPositionOffsetImage.xy;

    vec2 image1Uv = imageUV;
    image1Uv.x -= mod(image1Uv.x - image1Uv.y * 0.1, 0.02) * smoothstep(0.0, 1.0, uMouse.x) * 5.0;
    image1Uv.x += (-0.5 + uMouse.x) * 0.3;
    vec3 image1 = getRGB(tImage1, image1Uv, 0.1, -0.05 * smoothstep(0.0, 1.0, uMouse.x)).rgb;

    vec2 image2Uv = imageUV;
    image2Uv.x += mod(image2Uv.x + image2Uv.y * 0.1, 0.02) * smoothstep(1.0, 0.0, uMouse.x + pulse * 0.05) * 5.0;
    image2Uv.x += (-0.5 + uMouse.x) * 0.3;
    vec3 image2 = getRGB(tImage2, image2Uv, 0.1, 0.05 * smoothstep(1.0, 0.0, uMouse.x) + pulse * 0.05).rgb;

    vec3 images = mix(image1, image2, smoothstep(0.3, 0.7, uMouse.x));
    images *= mix(1.0, 1.1, smoothstep(0.15, 0.0, abs(0.5 - uMouse.x)));
    images *= 1.0 + pow(pulse, 4.0) * 0.02;

    color.rgb = mix(color.rgb, images, smoothstep(0.0, 0.2, maskValue));
  }

  float lightMove = sin(vUv.x * 2.0 - uMouse.x * 6.0 - time * 0.1 + uRandom) + sin(vUv.y * 5.0 + time * 0.1 + uRandom) * 0.5;
  float lightStrength = 0.5 + smoothstep(1.0, 0.0, (vUv.x - lightMove)) * 0.5;
  color.rgb = blendOverlay(color.rgb, vec3(1.0), pow(lightStrength, 5.0) * 0.5);
  color.rgb *= mix(10.0, 1.0, smoothstep(0.0, 1.0, color.a));
  color.rgb += pulseColor * smoothstep(0.2, 0.5, color.a) * smoothstep(0.8, 0.5, color.a);

  vec3 rainbow = rgb2hsv(vec3(1.0, 0.15, 0.15));
  rainbow.x += pulse * 10.0 + v * 10.0 - vUv.x * 1.0 - tD * 10.0 - time;
  rainbow = hsv2rgb(rainbow);
  color.rgb = mix(color.rgb, rainbow, smoothstep(0.5, 0.0, abs(0.5 - color.a)) * tD);

  color.a *= smoothstep(0.1, 0.3, uTransition);

  gl_FragColor = vec4(clamp(color.rgb, 0.0, 1.0) * color.a, color.a);
}
`;
