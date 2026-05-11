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
    if (res && res.token) {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  },
  async loginAsCustomer() {
    const res = await AUTH.loginAsCustomer()
    console.log('res', res)
    if (res && res.token) {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  }
})
