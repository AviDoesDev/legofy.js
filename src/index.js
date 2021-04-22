const Canvas = require('canvas');
const path = require('path');

const brick = path.join(__dirname,'..','images','brick.png');
const defaultOpts = { format: 'jpeg', quality: 'good', brick }
const pixelIntervalPreset = { fast: 8, good: 5, best: 3, nearest: 2, bilinear: 1 }

// Make a function to get the average color from given image data array
// with given sample rate.
const makeGetAverageColor = pixelInterval => data => {
  let rgb = [0, 0, 0]

  for (let i = 0; i < data.length; i++) {
    if (i % (pixelInterval * 4) < 4) rgb[i % 4] += data[i]
  }

  return rgb.map(channel => Math.floor(channel / (data.length / pixelInterval / 4)))
}

// Make a function to render a brick at a point using given brick, average
// color function and context.
const makeRenderBrick = (brick, getAverageColor, ctx) => (x, y) => {
  const { data } = ctx.getImageData(x, y, brick.width, brick.height)
  const color = getAverageColor(data)

  ctx.clearRect(x, y, brick.width, brick.height)
  ctx.drawImage(brick, x, y)
  ctx.fillStyle = formatColor(color)
  ctx.fillRect(x, y, brick.width, brick.height)
}

// Format given RGB array as a string.
const formatColor = ([r, g, b]) => `rgb(${r},${g},${b})`

// Make an `Image` object with given source.
const img = async (src) => await Canvas.loadImage(src);

// Get the size in bricks of an image.
const size = (image, brick) =>
  [ image.width / brick.width, image.height / brick.height ].map(Math.floor)

const render = async (opts, src) => {
  const image = await img(src)
  const brick = await img(opts.brick)
  const [ xCount, yCount ] = size(image, brick)
  const canvas = Canvas.createCanvas(xCount * brick.width, yCount * brick.height)
  const ctx = canvas.getContext('2d')
  const pixelInterval = opts.pixelInterval || pixelIntervalPreset[opts.quality]
  const getAverageColor = makeGetAverageColor(pixelInterval)
  const renderBrick = makeRenderBrick(brick, getAverageColor, ctx)

  ctx.patternQuality = opts.patternQuality || opts.quality
  ctx.filter = opts.filterQuality || opts.quality
  ctx.globalCompositeOperation = 'hard-light'
  ctx.drawImage(image, 0, 0)

  for (let x = 0; x < xCount; x++) {
    for (let y = 0; y < yCount; y++) {
      renderBrick(x * brick.width, y * brick.height)
    }
  }

  return canvas.toBuffer();
}

module.exports = async (img,opts = {}) => {
  const options = Object.assign({}, defaultOpts, opts)
  return await render(options, img);
}
