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
    if (!this.data.checked) {
      this.showModal('loginAsCustomer')
      return
    }
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
    if (!this.data.checked) {
      this.showModal('loginAsCustomer')
      return
    }
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
