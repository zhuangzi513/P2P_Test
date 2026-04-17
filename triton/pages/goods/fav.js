const AUTH = require('../../utils/auth')
const { callCloudFunction } = require('../../utils/cloud.js');

Page({
  data: {
  },
  onLoad: function (options) {
    this.goodsFavList()
  },
  onShow: function () {
  },
  async goodsFavList() {
    wx.showLoading({
      title: '加载中',
    })
    const _data = {
      userID: wx.getStorageSync('userID'),
      page: 1,
      pageSize: 10000,
    }    
    const res = await callCloudFunction('goodsFavList', _data);
    wx.hideLoading()
    if (res.code == 0) {
      res.data.forEach(ele => {
        if (ele.type == 1 && ele.json) {
          ele.json = JSON.parse(ele.json)
        }
      })
      this.setData({
        goods: res.data,
      })
    } else {
      this.setData({
        goods: null
      })
    }
  },
  async removeFav(e){
    const idx = e.currentTarget.dataset.idx
    const fav = this.data.goods[idx]
    const res = await callCloudFunction('goodsFavDeleteV2', {
      userID: wx.getStorageSync('userID'),
      goodsId: fav.goodsId,
      type: fav.type
    })
    if (res.code == 0) {
      wx.showToast({
        title: '取消收藏',
        icon: 'success'
      })
      this.goodsFavList()
    } else {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    }
  },
})
