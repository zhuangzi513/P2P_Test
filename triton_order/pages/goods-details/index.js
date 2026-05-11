const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const CONFIG = require('../../config.js')
const CLOUDFUNC = require('../../utils/cloud.js');

import Poster from 'wxa-plugin-canvas/poster/poster'

Page({
  data: {
    userID: "",
    goodsID: "",
    createTabs: false,
    goodsDetail: {},
    selectSizePrice: 0,
    selectSizeOPrice: 0,
    goodsStatus: 0
  },
  onLoad(e) {
    if (e && e.inviter_id) {
      wx.setStorageSync('referrer', e.inviter_id)
    }

    if (e && e.scene) {
      const scene = decodeURIComponent(e.scene)
      if (scene && scene.split(',').length >= 2) {
        e.id = scene.split(',')[0]
        wx.setStorageSync('referrer', scene.split(',')[1])
      }
    }
    this.getGoodsDetail(e.id)
  },
  onShow() {
  },
  async goodsFavCheck() {
    const res = await CLOUDFUNC.callCloudFunction('goodsFavCheck', { userID: wx.getStorageSync('userID'), goodsID: this.data.goodsID})
    if (res && res.faved) {
      this.setData({
        faved: true
      })
    } else {
      this.setData({
        faved: false
      })
    }
  },
  async addFav() {
        if (this.data.faved) {
          const res = await CLOUDFUNC.callCloudFunction('goodsFavDelete', {userID: wx.getStorageSync('userID'), goodID: this.data.goodsID});
          this.goodsFavCheck()
        } else {
          const res = await CLOUDFUNC.callCloudFunction('goodsFavPut', {userID: wx.getStorageSync('userID'), goodID: this.data.goodsID});
          this.goodsFavCheck()
        }
  },
  async getGoodsDetail(goodsID) {
    const res = await CLOUDFUNC.callCloudFunction('getGoodsInfo', {userID : wx.getStorageSync('userID'),  goodsID: goodsID});
    if (res && res.goodsInfo) {
      this.setData({
        userID: wx.getStorageSync('userID'),
        goodsID: goodsID,
        goodsDetail:res.goodsInfo});
    } else {
      wx.showToast({
        title: 'FAILED get goodsInfo',
        icon: 'none',
      })
    }
  },
  onShareAppMessage() {
    let _data = {
      title: this.data.goodsDetail.basicInfo.name,
      path: '/pages/goods-details/index?id=' + this.data.goodsDetail.basicInfo.id + '&inviter_id=' + this.data.userID,
      success: function (res) {
	wx.showToast({
          title: 'successfully shared',
          icon: 'none',
        })
      },
      fail: function (res) {
	wx.showToast({
          title: 'failed shared',
          icon: 'none',
        })
      }
    }
    return _data
  },
  onShareTimeline() {
    let title = this.data.goodsDetail.basicInfo ? this.data.goodsDetail.basicInfo.name : ''
    let query = 'id=' + this.data.goodsID + '&inviter_id=' + wx.getStorageSync('userID')
    return {
      title,
      query,
      imageUrl: (this.data.goodsDetail.pics && this.data.goodsDetail.pics[0]) ? this.data.goodsDetail.pics[0].pic : ''
    }
  },
  async likeIt() {
  },

  previewImage2(e) {
    const url = e.currentTarget.dataset.url
    const urls = []
    this.data.goodsDetail.pics.forEach(ele => {
      urls.push(ele.pic)
    })
    wx.previewImage({
      current: url,
      urls
    })
  },
  backToHome() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  tobuy: function () {
    if (this.data.goodsDetail.goodsStatus > 2) {
	wx.showToast({
          title: 'already been locked',
          icon: 'none',
        })
	return
    }
    const ownerID = this.data.goodsDetail.ownerID;
    const buyerID = this.data.userID;
    const goodsID = this.data.goodsID;
    const bankerID = this.data.goodsDetail.bankerID;
    CLOUDFUNC.callCloudFunction('newOrder', {ownerId: ownerID, bankerId:bankerID, buyerId:buyerID, goodsId:goodsID}).then(res => {
      if (res && res.orderId) {
        wx.navigateTo({
          url: "/pages/orders/order-type0-details?id=" + res.orderId
        })
      }
    });
  }
})

