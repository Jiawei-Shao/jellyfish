function drawScene() {
  const textureView = swapChain.getCurrentTexture().createView();
  const renderPassDescriptor = {
    colorAttachments: [{
      attachment: textureView,
      loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
    }],
    depthStencilAttachment: {
      attachment: depthTexture.createView(),

      depthLoadValue: 1.0,
      depthStoreOp: "store",
      stencilLoadValue: 0,
      stencilStoreOp: "store",
    }
  };

  mProjection = M4x4.makePerspective(localParam.camera.fov, canvas.width / canvas.height, localParam.camera.near, localParam.camera.far);

  mWorld = M4x4.makeTranslate3(0,0,0);
  mView = M4x4.makeTranslate3(0,0,0);

  mView = M4x4.translate3(localParam.camera.translate[0],0,0,mView);
  mView = M4x4.translate3(0,-localParam.camera.translate[1],0,mView);
  mView = M4x4.translate3(0,0,localParam.camera.translate[2],mView);
  mView = M4x4.rotate(localParam.camera.rotate[0],V3.$(1,0,0),mView);
  mView = M4x4.rotate(localParam.camera.rotate[1],V3.$(0,1,0),mView);

  localParam.camera.eye = V3.$(-mViewInv[12],-mViewInv[13],-mViewInv[14]);

  readDebugParam();
  simulate();
  drawJellyfish(renderPassDescriptor);
}