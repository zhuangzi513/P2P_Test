const WXAPI = require('apifm-wxapi')
const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const CONFIG = require('../../config.js')
import Poster from 'wxa-plugin-canvas/poster/poster'

Page({
  data: {
    userID: "",
    goodsId: "",
    createTabs: false,
    goodsDetail: {},
    selectSizePrice: 0,
    selectSizeOPrice: 0,
    totalScoreToPay: 0,
    goodsStatus: 0, //0: origin, 1: price offered, 2: locked, during deel, 3: saled, close
    hideShopPopup: true,
    propertyChildIds: "",
    propertyChildNames: "",
    showDialog: false,
    formData: {
      phone: '',
      price: '',
      email_ex: '',
      remark: ''
    }
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
    this.data.goodsId = e.id
    let goodsDetailSkuShowType = wx.getStorageSync('goodsDetailSkuShowType')
    if (!goodsDetailSkuShowType) {
      goodsDetailSkuShowType = 0
    }
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
    }, {
      tabs_name: 'Comments',
      view_id: 'reputation',
      topHeight: 0,
    }]
    if (hide_reputation == '1') {
      tabs = [{
        tabs_name: 'Introduction',
        view_id: 'swiper-container',
        topHeight: 0
      }, {
        tabs_name: 'Description',
        view_id: 'goods-des-info',
        topHeight: 0,
      }]
    } else {
      if (!this.data.reputation) {
        this.reputation(this.data.goodsId)
      }
    }
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
      path: '/pages/goods-details/index?id=' + this.data.goodsDetail.basicInfo.id + '&inviter_id=' + wx.getStorageSync('uid'),
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
  tobuy: function () {
    this.setData({ showDialog: true });
    if (this.data.goodsStatus > 2) {
	wx.showToast({
          title: 'already been locked',
          icon: 'none',
        })
	return
    }
    //wx.navigateTo({
    //  url: "/pages/order/order-details?id=" + this.data.goodsId 
    //})

  },

  hideDialog(reset = true) {
    this.setData({ showDialog: false });
    if (reset) {
      this.setData({
	      formData: { phone: '', price: '', email_ex:'', remark: '' }
      });
    }
  },

  onPhoneInput(e) {
    this.setData({ 'formData.phone': e.detail.value });
  },
  onPriceInput(e) {
    this.setData({ 'formData.price': e.detail.value });
  },
  onEmailExInput(e) {
    this.setData({ 'formData.email': e.detail.value });
  },
  onRemarkInput(e) {
    this.setData({ 'formData.remark': e.detail.value });
  },

  cancelDialog() {
    this.hideDialog(true);
  },

  submitDialog() {
    const { phone, price, email_ex, remark } = this.data.formData;
    if (!price) {
      wx.showToast({ title: 'no price', icon: 'none' });
      return;
    }
    if (!phone || !email_ex) {
      wx.showToast({ title: 'no contact', icon: 'none' });
      return;
    }
    wx.showToast({ title: 'successfully commited', icon: 'success' });
    const res = await WXAPI.commitBuy(phone, price, email_ex, remark, this.data.goodsId, this.data.userID);
    this.hideDialog(true);
    if (res.code == 0) {
      order_data = res.data
      wx.navigateTo({
        url: "/pages/order/order-details?id=" + order_data.orderID
      })
    }
  }
})

