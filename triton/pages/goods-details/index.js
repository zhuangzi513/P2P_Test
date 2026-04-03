const WXAPI = require('apifm-wxapi')
const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const CONFIG = require('../../config.js')
import Poster from 'wxa-plugin-canvas/poster/poster'

Page({
  data: {
    createTabs: false, //绘制tabs
    goodsDetail: {},
    hasMoreSelect: false,
    selectSizePrice: 0,
    selectSizeOPrice: 0,
    totalScoreToPay: 0,
    shopNum: 0,
    hideShopPopup: true,
    buyNumber: 0,
    buyNumMin: 1,
    buyNumMax: 0,
    propertyChildIds: "",
    propertyChildNames: "",
    canSubmit: false,
    shopType: "addShopCar",
  },
  bindscroll(e) {
    if (this.data.tabclicked) {
      return
    }
    this.getTopHeightFunction()
    var tabsHeight = this.data.tabsHeight //顶部距离（tabs高度）
    if (this.data.tabs[0].topHeight-tabsHeight<=0 && 0 < this.data.tabs[1].topHeight-tabsHeight) { //临界值，根据自己的需求来调整
      this.setData({
        active: this.data.tabs[0].tabs_name //设置当前标签栏
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
    // e.id = 122843
    // 读取分享链接中的邀请人编号
    if (e && e.inviter_id) {
      wx.setStorageSync('referrer', e.inviter_id)
    }
    // 读取小程序码中的邀请人编号
    if (e && e.scene) {
      const scene = decodeURIComponent(e.scene) // 处理扫码进商品详情页面的逻辑
      if (scene && scene.split(',').length >= 2) {
        e.id = scene.split(',')[0]
        wx.setStorageSync('referrer', scene.split(',')[1])
      }
    }
    this.data.goodsId = e.id
    let goodsDetailSkuShowType = wx.getStorageSync('goodsDetailSkuShowType')
    if (!goodsDetailSkuShowType) {
      goodsDetailSkuShowType = 0
    }
    // 补偿写法
    getApp().configLoadOK = () => {
      this.readConfigVal()
    }
    this.setData({
      goodsDetailSkuShowType,
      curuid: wx.getStorageSync('uid'),
      customerServiceType: CONFIG.customerServiceType
    })
    this.readConfigVal()
    this.getGoodsDetail(this.data.goodsId)
    this.shippingCartInfo()
    this.goodsAddition()
    // 弹出编辑昵称头像框
    getApp().initNickAvatarUrlPOP(this)
  },
  readConfigVal() {
    // 读取系统参数
    const hide_reputation = wx.getStorageSync('hide_reputation')
    let tabs = [{
      tabs_name: '商品简介',
      view_id: 'swiper-container',
      topHeight: 0
    }, {
      tabs_name: '商品详情',
      view_id: 'goods-des-info',
      topHeight: 0,
    }, {
      tabs_name: '商品评价',
      view_id: 'reputation',
      topHeight: 0,
    }]
    if (hide_reputation == '1') {
      // 隐藏评价
      tabs = [{
        tabs_name: '商品简介',
        view_id: 'swiper-container',
        topHeight: 0
      }, {
        tabs_name: '商品详情',
        view_id: 'goods-des-info',
        topHeight: 0,
      }]
    } else {
      // 读取评价
      if (!this.data.reputation) { // 保证只读取一次
        this.reputation(this.data.goodsId)
      }
    }
    this.setData({
      hide_reputation,
      tabs
    })
  },
  async goodsAddition() {
    const res = await WXAPI.goodsAddition(this.data.goodsId)
    if (res.code == 0) {
      this.setData({
        goodsAddition: res.data,
        hasMoreSelect: true,
      })
    }
  },
  async shippingCartInfo() {
    const number = await TOOLS.showTabBarBadge(true)
    this.setData({
      shopNum: number
    })
  },
  onShow() {
    this.setData({
      createTabs: true //绘制tabs
    })
    //计算tabs高度
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
    const res = await WXAPI.goodsFavCheck(wx.getStorageSync('token'), this.data.goodsId)
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
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        if (this.data.faved) {
          WXAPI.goodsFavDelete(wx.getStorageSync('token'), '', this.data.goodsId).then(res => {
            this.goodsFavCheck()
          })
        } else {
          WXAPI.goodsFavPut(wx.getStorageSync('token'), this.data.goodsId).then(res => {
            this.goodsFavCheck()
          })
        }
      } else {
        wx.navigateTo({
          url: '/pages/login/index',
        })
      }
    })
  },
  async getGoodsDetail(goodsId) {
    const token = wx.getStorageSync('token')
    const that = this;
    const goodsDetailRes = await WXAPI.goodsDetail(goodsId, token ? token : '')
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
        totalScoreToPay: goodsDetailRes.data.basicInfo.minScore,
        buyNumMax: goodsDetailRes.data.basicInfo.stores,
        buyNumber: (goodsDetailRes.data.basicInfo.stores > 0) ? 1 : 0
      }
      if (goodsDetailRes.data.properties) {
        _data.hasMoreSelect = true
      }
      that.data.goodsDetail = goodsDetailRes.data;
      if (goodsDetailRes.data.basicInfo.videoId) {
        that.getVideoSrc(goodsDetailRes.data.basicInfo.videoId);
      }
      
      that.setData(_data)
    }
  },
  tobuy: function () {
    this.setData({
      shopType: "tobuy"
    });
    wx.navigateTo({
      url: '/pages/want/index',
    })
  },
  stepChange(event) {
    this.setData({
      buyNumber: event.detail
    })
  },
  onShareAppMessage() {
    let _data = {
      title: this.data.goodsDetail.basicInfo.name,
      path: '/pages/goods-details/index?id=' + this.data.goodsDetail.basicInfo.id + '&inviter_id=' + wx.getStorageSync('uid'),
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
    return _data
  },
  onShareTimeline() {
    let title = this.data.goodsDetail.basicInfo.name
    let query = 'id=' + this.data.goodsDetail.basicInfo.id + '&inviter_id=' + wx.getStorageSync('uid')
    return {
      title,
      query,
      imageUrl: this.data.goodsDetail.basicInfo.pic
    }
  },
  reputation: function (goodsId) {
    var that = this;
    WXAPI.goodsReputationV2({
      goodsId: goodsId
    }).then(function (res) {
      if (res.code == 0) {
        res.data.result.forEach(ele => {
          if (ele.goods.goodReputation == 0) {
            ele.goods.goodReputation = 1
          } else if (ele.goods.goodReputation == 1) {
            ele.goods.goodReputation = 3
          } else if (ele.goods.goodReputation == 2) {
            ele.goods.goodReputation = 5
          }
        })
        that.setData({
          reputation: res.data
        });
      } else {
        if (that.data.tabs && that.data.tabs.length == 3) {
          const tabs = that.data.tabs
          tabs.splice(2, 1)
          that.setData({
            tabs
          })
        }
      }
    })
  },
  getVideoSrc: function (videoId) {
    var that = this;
    WXAPI.videoDetail(videoId).then(function (res) {
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
      current: url, // 当前显示图片的http链接
      urls: [url] // 需要预览的图片http链接列表
    })
  },
  previewImage2(e) {
    const url = e.currentTarget.dataset.url
    const urls = []
    this.data.goodsDetail.pics.forEach(ele => {
      urls.push(ele.pic)
    })
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls // 需要预览的图片http链接列表
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
  customerService() {
    wx.openCustomerServiceChat({
      extInfo: {url: wx.getStorageSync('customerServiceChatUrl')},
      corpId: wx.getStorageSync('customerServiceChatCorpId'),
      showMessageCard: true,
      sendMessageTitle: this.data.goodsDetail.basicInfo.name,
      sendMessagePath: '/pages/goods-details/index?id=' + this.data.goodsDetail.basicInfo.id,
      sendMessageImg: this.data.goodsDetail.basicInfo.pic,
      success: res => {},
      fail: err => {
        console.error(err)
      }
    })
  },
})

