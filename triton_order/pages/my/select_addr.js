const CLOUDFUNC = require('../../utils/cloud.js')

const app = getApp()
Page({
  data: {
    page: 1
  },
  selectTap: function(e) {
    console.log(e);
    var id = e.currentTarget.dataset.id;
    CLOUDFUNC.callCloudFunction('updateAddress', {
      token: wx.getStorageSync('token'),
      id: id,
      isDefault: 'true'
    }).then(function(res) {
      wx.navigateBack({})
    })
  },

  addAddess: function() {
    wx.navigateTo({
      url: "/pages/address-add/index"
    })
  },

  editAddess: function(e) {
    console.log(e);
    
    wx.navigateTo({
      url: "/pages/address-add/index?id=" + e.currentTarget.dataset.id
    })
  },

  onLoad() {
    
  },
  onShow: function() {
    this.initShippingAddress();
  },
  async initShippingAddress() {
    wx.showLoading({
      title: '',
    })
    const res = await CLOUDFUNC.callCloudFunction('queryAddress', {
      token: wx.getStorageSync('token')
    })
    wx.hideLoading()
    if (res.code == 0) {
      this.setData({
        addressList: res.data.result
      });
    } else if (res.code == 700) {
      this.setData({
        addressList: null
      });
    } else {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    }
  },
  onPullDownRefresh() {
    this.data.page = 1
    this.initShippingAddress()
    wx.stopPullDownRefresh()
  },
  deleteAddress(e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    wx.showModal({
      content: 'SURE ?',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '',
          })
          const delRes = await CLOUDFUNC.callCloudFunction('deleteAddress', { token: wx.getStorageSync('token'), id: id })
          wx.hideLoading()
          if (delRes.code != 0) {
            wx.showToast({
              title: delRes.msg,
              icon: 'none'
            })
          } else {
            wx.showToast({
              title: 'DELETED',
              icon: 'none'
            })
            this.data.addressList.splice(index, 1)
            this.setData({
              addressList: this.data.addressList
            })
          }
        }
      }
    })
  },
})
