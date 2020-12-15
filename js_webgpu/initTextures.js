var texture = {};
var textureOK = {};
var sampler;

function pad2(number) {
  return (parseInt(number) < 10 ? '0' : '') + parseInt(number)
}

async function initTextures() {
  sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "repeat",
    addressModeV: "repeat",
    addressModeW: "repeat",
  });

  initTextureAndSamplerBindGroupLayout();

  await loadTexture('jellyfish', 'images/jellyfish.png');

  texture['jellyfish'].bindGroup = device.createBindGroup({
      layout: jellyfishAndSamplerBindGroupLayout,
      entries: [{
        binding: 0,
        resource: sampler,
      }, {
        binding: 1,
        resource: texture['jellyfish'].createView(),
      }],
  });

  await loadTexture('luminescence', 'images/luminescence.png');

  for (var i=1; i <= 32; i++) {
    await loadTexture('caustics'+i, 'images/caustics/caustics7.'+pad2(i-1)+'.jpg');
    texture['caustics'+i].bindGroup = device.createBindGroup({
      layout: causticsBindGroupLayout,
      entries: [{
        binding: 0,
        resource: texture['caustics'+i].createView(),
      }],
    });
  }
}

async function loadTexture(label, path) {
  textureOK[label] = 0;

  var imageElement = new Image();
  imageElement.src = path;
  await new Promise(resolve => {imageElement.onload = () => resolve(imageElement)});
  const imageBitmap = await createImageBitmap(imageElement, { imageOrientation: 'flipY', premultiplyAlpha: 'none' });

  var size = {width: imageBitmap.width, height: imageBitmap.height, depth: 1};
  texture[label] = device.createTexture({
    size,
    format: 'bgra8unorm',
    usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.SAMPLED,
  });

  device.defaultQueue.copyImageBitmapToTexture(
    { imageBitmap },
    { texture: texture[label] },
    { width: imageBitmap.width, height: imageBitmap.height, depth: 1 }
  );

  textureOK[label] = 1;
}

var jellyfishAndSamplerBindGroupLayout;
var causticsBindGroupLayout;
function initTextureAndSamplerBindGroupLayout() {
  jellyfishAndSamplerBindGroupLayout = device.createBindGroupLayout({
    entries: [{
      // Sampler
      binding: 0,
      visibility: GPUShaderStage.FRAGMENT,
      type: "sampler"
    }, {
      // Texture views
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      type: "sampled-texture"
    }]
  });

  causticsBindGroupLayout = device.createBindGroupLayout({
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.FRAGMENT,
      type: "sampled-texture"
    }]
  });
}


function bindTextureBindGroup(passEncoder, name, i) {
  if(textureOK[name] === 1){
    passEncoder.setBindGroup(i, texture[name].bindGroup);
  }
}
