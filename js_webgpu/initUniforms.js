var mWorld = new M4x4.$();
var mViewInv = new M4x4.$();
var mProjection = new M4x4.$();
var mWorldView = new M4x4.$();
var mWorldViewProj = new M4x4.$();
var mTemp = new M4x4.$();

var joint0 = new M4x4.$();
var joint1 = new M4x4.$();
var joint2 = new M4x4.$();
var joint3 = new M4x4.$();
var joint0InvTranspose = new M4x4.$();

//  PerFrameData {
//    mat4 uWorld;
//    mat4 uViewInv;
//    mat4 uWorldView;
//    mat4 uWorldViewProj;
//  }
var uniformBufferPerFrame;
var arrayBufferPerFrame;

// CurrentTime {
// float uCurrentTime;
// }
var uniformBufferCurrentGlobalTime;
var arrayBufferCurrentGlobalTime;

var bindGroupPerFrame;

// PerInstanceData {
//  mat4 uJoint0;
//  mat4 uJoint1;
//  mat4 uJoint2;
//  mat4 uJoint3;
//  mat4 uJoint0InvTranspose;
//  float uCurrentJellyfishTime;
// }
var currentFishCount = 0;
var uniformBufferAllFishes;
var bindGroupPerFish;
var arrayBufferAllFishes;

var perFrameBindGroupLayout;
function createPerFrameBindGroupLayout(device) {
  perFrameBindGroupLayout = device.createBindGroupLayout({
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      type: "uniform-buffer",
      minBufferBindingSize: 4 * 16 * 4
    },
    {
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      type: "uniform-buffer",
      minBufferBindingSize: 4
    }]
  });
}

var perFishBindGroupLayout;
function createPerFishBindGroupLayout(device) {
  perFishBindGroupLayout = device.createBindGroupLayout({
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      type: "uniform-buffer",
      minBufferBindingSize: 324,
      hasDynamicOffset: true,
    }]
  });
}

function initUniforms(device, renderPipeline) {
  uniformBufferCurrentGlobalTime = device.createBuffer({
    size: 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  uniformBufferPerFrame = device.createBuffer({
    size: 4 * 16 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  arrayBufferPerFrame = new Float32Array(1 + 4 * 16);
  arrayBufferCurrentGlobalTime = new Float32Array(1);

  createPerFrameBindGroupLayout(device);
  createPerFishBindGroupLayout(device);

  bindGroupPerFrame = device.createBindGroup({
    layout: perFrameBindGroupLayout,
    entries: [{
      binding: 0,
      resource: {
        buffer: uniformBufferPerFrame,
        offset: 0,
        size: 4 * 16 * 4,
      }
    },
    {
      binding: 1,
      resource: {
        buffer: uniformBufferCurrentGlobalTime,
        offset: 0,
        size: 4,
      }
    }]
  });
}

function uploadUniforms() {
  device.defaultQueue.writeBuffer(uniformBufferPerFrame, 0, arrayBufferPerFrame, 0, 64 * 4);
  device.defaultQueue.writeBuffer(
    uniformBufferCurrentGlobalTime, 0, arrayBufferCurrentGlobalTime, 0, 4);
  device.defaultQueue.writeBuffer(uniformBufferAllFishes, 0, arrayBufferAllFishes, 0, arrayBufferAllFishes.byteLength);
}

function setMatrixUniforms(passEncoder) {
  // Set necessary matrices
  M4x4.mul(mView,mWorld,mWorldView);
  M4x4.mul(mProjection,mWorldView,mWorldViewProj);
  M4x4.inverseOrthonormal(mView,mViewInv);

  // Set Uniforms
  arrayBufferPerFrame.set(mWorld, 0);
  arrayBufferPerFrame.set(mViewInv, 16);
  arrayBufferPerFrame.set(mWorldView, 32);
  arrayBufferPerFrame.set(mWorldViewProj, 48);

  passEncoder.setBindGroup(0, bindGroupPerFrame);
}

function setTimeUniform(currentTime) {
  arrayBufferCurrentGlobalTime[0] = currentTime;
}

function allocateJellyFishUniformBuffer(fishCount) {
  if (currentFishCount !== fishCount && fishCount > 0) {
    const bufSize = (fishCount - 1) * 512 + 324;
    uniformBufferAllFishes = device.createBuffer({
      size: bufSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    arrayBufferAllFishes = new Float32Array(bufSize / 4);

    bindGroupPerFish = device.createBindGroup({
      layout: perFishBindGroupLayout,
      entries: [{
        binding: 0,
        resource: {
          buffer: uniformBufferAllFishes,
          offset: 0,
          size: 4 * 16 * 5 + 4
        }
      }]
    });

    currentFishCount = fishCount;
  }
}

function setPerFishUniforms(passEncoder, i, jellyfishTime) {
  const baseFloat32Offset = i * 512 / 4;
  arrayBufferAllFishes.set(joint0, baseFloat32Offset);
  arrayBufferAllFishes.set(joint1, baseFloat32Offset + 16);
  arrayBufferAllFishes.set(joint2, baseFloat32Offset + 32);
  arrayBufferAllFishes.set(joint3, baseFloat32Offset + 48);

  M4x4.inverseOrthonormal(joint0,joint0InvTranspose);
  M4x4.transpose(joint0InvTranspose,joint0InvTranspose);
  arrayBufferAllFishes.set(joint0InvTranspose, baseFloat32Offset + 64);

  arrayBufferAllFishes[baseFloat32Offset + 80] = jellyfishTime;

  passEncoder.setBindGroup(1, bindGroupPerFish, [512 * i]);
}
