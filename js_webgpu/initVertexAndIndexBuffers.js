var vertexPositionBuffer = {};
var vertexNormalBuffer = {};
var vertexColorBuffer = {};
var vertexTextureCoordBuffer = {};
var vertexIndexBuffer = {};
var skinWeightBuffer = {};
var bufferOK = {};

function initBuffers(device){
  loadObject(device, 'jellyfish0','meshes/jellyfish0.json');
  loadObject(device, 'jellyfish1','meshes/jellyfish1.json');
  loadObject(device, 'jellyfish2','meshes/jellyfish2.json');
  loadObject(device, 'jellyfish3','meshes/jellyfish3.json');
}

function loadObject(device, name, file){
  var request = new XMLHttpRequest();
  request.open("GET", file);
  request.onreadystatechange = function() {
    if (request.readyState == 4) {
      initBuffer(device, name, JSON.parse(request.responseText));
      bufferOK[name] = 1;
    }
  };
  request.send();
}

function initBuffer(device, name, data) {
  const vertexPositionData = new Float32Array(data.vertexPositions);
  const vertexPositionsBuffer = device.createBuffer({
    size: vertexPositionData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(vertexPositionsBuffer.getMappedRange()).set(vertexPositionData);
  vertexPositionsBuffer.unmap();
  vertexPositionBuffer[name] = vertexPositionsBuffer;
  vertexPositionBuffer[name].itemSize = 3;
  vertexPositionBuffer[name].numItems = data.vertexPositions.length / 3;

  const vertexNormalData = new Float32Array(data.vertexNormals);
  const vertexNormalsBuffer = device.createBuffer({
    size: vertexNormalData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(vertexNormalsBuffer.getMappedRange()).set(vertexNormalData);
  vertexNormalsBuffer.unmap();
  vertexNormalBuffer[name] = vertexNormalsBuffer;
  vertexNormalBuffer[name].itemSize = 3;
  vertexNormalBuffer[name].numItems = data.vertexNormals.length / 3;

  const vertexColorData = new Float32Array(data.vertexColors);
  const vertexColorsBuffer = device.createBuffer({
    size: vertexColorData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(vertexColorsBuffer.getMappedRange()).set(vertexColorData);
  vertexColorsBuffer.unmap();
  vertexColorBuffer[name] = vertexColorsBuffer;
  vertexColorBuffer[name].itemSize = 3;
  vertexColorBuffer[name].numItems = data.vertexColors.length / 3;

  const vertexTextureCoordData = new Float32Array(data.vertexTextureCoords);
  const vertexTextureCoordsBuffer = device.createBuffer({
    size: vertexTextureCoordData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(vertexTextureCoordsBuffer.getMappedRange()).set(vertexTextureCoordData);
  vertexTextureCoordsBuffer.unmap();
  vertexTextureCoordBuffer[name] = vertexTextureCoordsBuffer;
  vertexTextureCoordBuffer[name].itemSize = 3;
  vertexTextureCoordBuffer[name].numItems = data.vertexTextureCoords.length / 3;

  weightData = [];
  for(var i=0; i<data.vertexPositions.length; i=i+3){
    var ypos = -data.vertexPositions[i+1]/3;
    var w0 = Math.max(Math.min(-ypos+1,1),0);
    var w1 = Math.max(Math.min(ypos,-ypos+2),0);
    var w2 = Math.max(Math.min(ypos-1,-ypos+3),0);
    var w3 = Math.max(Math.min(ypos-2,1),0);
    weightData.push(w0);
    weightData.push(w1);
    weightData.push(w2);
    weightData.push(w3);
  }
  const skinWeightData = new Float32Array(weightData);
  const skinWeightsBuffer = device.createBuffer({
    size: skinWeightData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(skinWeightsBuffer.getMappedRange()).set(skinWeightData);
  skinWeightsBuffer.unmap();
  skinWeightBuffer[name] = skinWeightsBuffer;
  skinWeightBuffer[name].itemSize = 4;
  skinWeightBuffer[name].numItems = weightData.length / 4;

  const vertexIndexData = new Uint16Array(data.indices);
  const vertexIndicesBuffer = device.createBuffer({
    size: vertexIndexData.byteLength,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true,
  });
  new Uint16Array(vertexIndicesBuffer.getMappedRange()).set(vertexIndexData);
  vertexIndicesBuffer.unmap();
  vertexIndexBuffer[name] = vertexIndicesBuffer;
  vertexIndexBuffer[name].itemSize = 1;
  vertexIndexBuffer[name].numItems = data.indices.length;
}

function drawBuffer(passEncoder, name) {
  if(vertexPositionBuffer[name]){
    passEncoder.setVertexBuffer(0, vertexPositionBuffer[name]);
    passEncoder.setVertexBuffer(1, vertexNormalBuffer[name]);
    passEncoder.setVertexBuffer(2, vertexColorBuffer[name]);
    passEncoder.setVertexBuffer(3, vertexTextureCoordBuffer[name]);
    passEncoder.setVertexBuffer(4, skinWeightBuffer[name]);
    passEncoder.setIndexBuffer(vertexIndexBuffer[name], "uint16");

    passEncoder.drawIndexed(vertexIndexBuffer[name].numItems);
  }
}