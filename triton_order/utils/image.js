function imageUtil (originalWidth, originalHeight) {
  return new Promise((resolve) => {
    wx.getSystemInfo({
      success: function (res) {
        const windowWidth = res.windowWidth
        let imageSize = {}
        imageSize.x = 0
        imageSize.y = 0
        imageSize.windowWidth = windowWidth
        imageSize.imageWidth = originalWidth
        imageSize.imageHeight = originalHeight
        if (originalWidth > windowWidth) {
          imageSize.imageWidth = windowWidth
          imageSize.imageHeight = windowWidth * originalHeight / originalWidth
        } else {
          imageSize.x = (windowWidth - originalWidth) / 2
        }
        resolve(imageSize)
      }
    })
  })
}

module.exports = {
  imageUtil: imageUtil
}
