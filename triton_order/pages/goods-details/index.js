const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const CONFIG = require('../../config.js')
const { callCloudFunction } = require('../../utils/cloud.js');
import Poster from 'wxa-plugin-canvas/poster/poster'

Page({
  data: {
    userID: "",
    goodsID: "",
    createTabs: false,
    goodsDetail: {},
    selectSizePrice: 0,
    selectSizeOPrice: 0,
    goodsStatus: 0, //0: origin, 1: price offered, 2: locked, during deel, 3: saled, close
  },
  bindscroll(e) {
    if (this.data.tabclicked) {
      return
    }
    this.getTopHeightFunction()
    var tabsHeight = this.data.tabsHeight
    if (this.data.tabs[0].topHeight-tabsHeight<=0 && 0 < this.data.tabs[1].topHeight-tabsHeight) {
      this.setData({
        active: this.data.tabs[0].tabs_name
      })
    } else if (this.data.tabs.length == 2) {
      this.setData({
        active: this.data.tabs[1].tabs_name
      })
    } else if (this.data.tabs[1].topHeight-tabsHeight<=0 && 0 < this.data.tabs[2].topHeight-tabsHeight) {
      this.setData({
        active: this.data.tabs[1].tabs_name
      })
    } else if (this.data.tabs[2].topHeight-tabsHeight<=0) {
      this.setData({
        active: this.data.tabs[2].tabs_name
      })
    }
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
    this.data.goodsID = e.id
    getApp().configLoadOK = () => {
      this.readConfigVal()
    }
    this.setData({
      userID : wx.getStorageSync('userID'),
      customerServiceType: CONFIG.customerServiceType
    })
    this.readConfigVal()
    this.getGoodsDetail(this.data.goodsID)
    getApp().initNickAvatarUrlPOP(this)
  },
  readConfigVal() {
    const hide_reputation = wx.getStorageSync('hide_reputation')
    let tabs = [{
      tabs_name: 'Introduction',
      view_id: 'swiper-container',
      topHeight: 0
    }, {
      tabs_name: 'Description',
      view_id: 'goods-des-info',
      topHeight: 0,
    }]
    this.setData({
      hide_reputation,
      tabs
    })
  },
  onShow() {
    this.setData({
      createTabs: true
    })

    var query = wx.createSelectorQuery();
    query.select('#tabs').boundingClientRect((rect) => {
      var tabsHeight = rect.height
      this.setData({
        tabsHeight:tabsHeight
      })
    }).exec()

    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.goodsFavCheck()
      }
    })
  },
  getTopHeightFunction() {
    var that = this
    var tabs = that.data.tabs
    tabs.forEach((element, index) => {
      var viewId = "#" + element.view_id
      that.getTopHeight(viewId, index)
    });
  },
  getTopHeight(viewId, index) {
    var query = wx.createSelectorQuery();
    query.select(viewId).boundingClientRect((rect) => {
      if (!rect) {
        return
      }
      let top = rect.top
      var tabs = this.data.tabs
      tabs[index].topHeight = top
      this.setData({
        tabs: tabs
      })
    }).exec()
  },
  async goodsFavCheck() {
    const res = await callCloudFunction('goodsFavCheck', { userID: wx.getStorageSync('userID'), goodsID: this.data.goodsID})
    if (res.code == 0) {
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
          const res = await callCloudFunction('goodsFavDelete', {userID: wx.getStorageSync('userID'), goodID: this.data.goodsID});
          if (res.code == 0) {
            this.goodsFavCheck()
          }
        } else {
          const res = await callCloudFunction('goodsFavPut', {userID: wx.getStorageSync('userID'), goodID: this.data.goodsID});
          if (res.code == 0) {
            this.goodsFavCheck()
          }
        }
  },
  async getGoodsDetail(goodsID) {
    const userID = wx.getStorageSync('userID')
    const that = this;
    const goodsDetailRes = await callCloudFunction('goodsDetail', {userID : userID,  goodsID: goodsID});
    if (goodsDetailRes.code == 0) {
      if (!goodsDetailRes.data.pics || goodsDetailRes.data.pics.length == 0) {
        goodsDetailRes.data.pics = [{
          pic: goodsDetailRes.data.basicInfo.pic
        }]
      }
      const _data = {
        goodsDetail: goodsDetailRes.data,
        selectSizePrice: goodsDetailRes.data.basicInfo.minPrice,
        selectSizeOPrice: goodsDetailRes.data.basicInfo.originalPrice,
        goodsStatus: goodsDetailRes.data.basicInfo.goodsStaus
      }
      that.data.goodsDetail = goodsDetailRes.data;
      if (goodsDetailRes.data.basicInfo.videoId) {
        that.getVideoSrc(goodsDetailRes.data.basicInfo.videoId);
      }
      
      that.setData(_data)
    }
  },
  stepChange(event) {
    this.setData({
      buyNumber: event.detail
    })
  },
  onShareAppMessage() {
    let _data = {
      title: this.data.goodsDetail.basicInfo.name,
      path: '/pages/goods-details/index?id=' + this.data.goodsDetail.basicInfo.id + '&inviter_id=' + wx.getStorageSync('userID'),
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
    let title = this.data.goodsDetail.basicInfo.name
    let query = 'id=' + this.data.goodsDetail.basicInfo.id + '&inviter_id=' + wx.getStorageSync('userID')
    return {
      title,
      query,
      imageUrl: this.data.goodsDetail.basicInfo.pic
    }
  },
  getVideoSrc: function (videoId) {
    var that = this;
    callCloudFunction('videoDetail', {videoID:videoId}).then(res=> {
      if (res.code == 0) {
        that.setData({
          videoMp4Src: res.data.fdMp4
        });
      }
    })

  },
  closePop() {
    this.setData({
      posterShow: false
    })
  },
  async likeIt() {
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: [url]
    })
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
  onTabsChange(e) {
    var index = e.detail.index
    this.setData({
      toView: this.data.tabs[index].view_id,
      tabclicked: true
    })
    setTimeout(() => {
      this.setData({
        tabclicked: false
      })
    }, 1000);
  },
  backToHome() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  tobuy: function () {
    if (this.data.goodsStatus > 2) {
	wx.showToast({
          title: 'already been locked',
          icon: 'none',
        })
	return
    }
    wx.navigateTo({
      url: "/pages/order/order-details?id=" + this.data.goodsID 
    })
  }
})

