async function InitGLSLang() {
  var glslangModule = await import('https://unpkg.com/@webgpu/glslang@0.0.15/dist/web-devel/glslang.js');
  var glslang = await glslangModule.default();
  return glslang;
}

function GetShaderString(shaderElementID) {
  var shaderScript = document.getElementById(shaderElementID);
  if (!shaderScript) {
    return null;
  }

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }

  return str;
}

async function GetRenderPipeline(device) {
  var vsGLSL = GetShaderString("jellyfish-vs");
  var fsGLSL = GetShaderString("jellyfish-fs");

  if (!vsGLSL || !fsGLSL) {
    return;
  }

  var glslang = await InitGLSLang();

  var vsModule = device.createShaderModule({
    code: glslang.compileGLSL(vsGLSL, "vertex"),
    source: vsGLSL,
    transform: source => glslang.compileGLSL(source, "vertex"),
  });

  var fsModule = device.createShaderModule({
    code: glslang.compileGLSL(fsGLSL, "fragment"),
    source: fsGLSL,
    transform: source => glslang.compileGLSL(source, "fragment"),
  });

  const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [perFrameBindGroupLayout, perFishBindGroupLayout, jellyfishAndSamplerBindGroupLayout, causticsBindGroupLayout] });
  var renderPipeline = device.createRenderPipeline({
    layout: pipelineLayout,

    vertexStage: {
      module: vsModule,
      entryPoint: "main",
    },
    fragmentStage: {
      module: fsModule,
      entryPoint: "main",
    },

    primitiveTopology: "triangle-list",

    colorStates: [{
      format: swapchainFormat,
      alphaBlend: {
        operation: "add",
        srcFactor: "src-alpha",
        dstFactor: "one-minus-src-alpha",
      },
      colorBlend: {
        operation: "add",
        srcFactor: "src-alpha",
        dstFactor: "one-minus-src-alpha",
      }
    }],

    depthStencilState: {
      depthWriteEnabled: true,
      depthCompare: "less-equal",
      format: "depth24plus-stencil8",
    },

    vertexState: {
      vertexBuffers: [{
        arrayStride: 12,
        stepMode: "vertex",
          attributes: [{
          shaderLocation: 0,
          offset: 0,
          format: "float3"
        }]
      },
      {
        arrayStride: 12,
        stepMode: "vertex",
        attributes: [{
          shaderLocation: 1,
          offset: 0,
          format: "float3"
        }]
      },
      {
        arrayStride: 12,
        stepMode: "vertex",
          attributes: [{
          shaderLocation: 2,
          offset: 0,
          format: "float3"
        }]
      },
      {
        arrayStride: 12,
        stepMode: "vertex",
        attributes: [{
          shaderLocation: 3,
          offset: 0,
          format: "float3"
        }]
      },
      {
        arrayStride: 16,
        stepMode: "vertex",
        attributes: [{
          shaderLocation: 4,
          offset: 0,
          format: "float4"
        }]
      },
    ]}
  });

  return renderPipeline;
}