const AUTH = require('../../utils/auth')
Page({
  data: {
    checked: false
  },
  onLoad(options) {
  },
  onShow() {
  },
  async loginAsBanker() {
    const res = await AUTH.loginAsBanker()
    if (res.code == 10000) {
      wx.showModal({
        content: 'CONTENTS BANKER',
        showCancel: false
      })
      return
    }
    if (res.code != 0) {
      return
    }
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },
  async loginAsCustomer() {
    const res = await AUTH.loginAsCustomer()
    if (res.code == 10000) {
      wx.showModal({
        content: 'CONTENTS CUSTOMRER',
        showCancel: false
      })
      return
    }
    if (res.code != 0) {
      return
    }
    wx.reLaunch({
      url: '/pages/index/index',
    })
  }
})
