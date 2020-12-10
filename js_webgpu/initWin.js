// JavaScript Document<script type="text/javascript">
var canvas, device, swapChain, docWidth, docHeight;

var depthTexture;
var renderPipeline;

var currentCanvas;

var swapchainFormat;

function initWin(w, h){
  (w) ? docWidth = w : docWidth = $(window).width();
  (h) ? docHeight = h : docHeight = $(window).height();
  $("#webgl-canvas").width(docWidth);
  $("#webgl-canvas").height(docHeight);

  canvas = document.getElementById("webgl-canvas");
  canvas.width = docWidth;
  canvas.height = docHeight;

  if (!navigator.gpu) {
    alert("WebGPU not supported! Please visit webgpu.io to see the current implementation status.");
    return false;
  }

  return true;
}

function RecreateSwapchain(adapter) {
  var context = canvas.getContext('gpupresent');

  swapchainFormat = context.getSwapChainPreferredFormat(adapter);
  swapChain = context.configureSwapChain({
    device,
    format: swapchainFormat,
  });

  depthTexture = device.createTexture({
    size: {
      width: canvas.width,
      height: canvas.height,
      depth: 1
    },
    format: "depth24plus-stencil8",
    usage: GPUTextureUsage.OUTPUT_ATTACHMENT
  });
}

$(window).resize(function() {
  initWin();
  if (device) {
    RecreateSwapchain();
  }
});

function frame() {
  tick();
  drawScene();
}

async function webGPUStart() {
  if (!initWin()) {
    return;
  }

  var adapter = await navigator.gpu.requestAdapter();
  device = await adapter.requestDevice();

  RecreateSwapchain(adapter);

  initUniforms(device, renderPipeline);
  await initTextures();

  renderPipeline = await GetRenderPipeline(device);
  initBuffers(device);

  currentCanvas = canvas;

  setDebugParam();

  interact();

  function doFrame() {
    if (currentCanvas !== canvas) return;

    frame();
    requestAnimationFrame(doFrame);
  }

  requestAnimationFrame(doFrame);
}