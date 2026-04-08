const WXAPI = require('apifm-wxapi')
const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const APP = getApp()

Page({
  data: {
    inputVal: "",
    loadingHidden: false, // loading
    selectCurrent: 0,
    categories: [],
    goods: [],
    loadingMoreHidden: true,
    coupons: [],
    curPage: 1,
    pageSize: 20
  },
  toModifyTap: function(e) {
    console.log(e);
    const id = e.currentTarget.dataset.id
    const supplytype = e.currentTarget.dataset.supplytype
    const yyId = e.currentTarget.dataset.yyid
    if (supplytype == 'vop_jd') {
      wx.navigateTo({
        url: `/pages/goods-details/vop?id=${yyId}&goodsId=${id}`,
      })
    } else {
      wx.navigateTo({
        url: `/pages/my/edit_product?id=${id}`,
      })
    }
  },
  tapBanner(e) {
    const item = e.currentTarget.dataset.item
    if (item.linkType == 1) {
      wx.navigateToMiniProgram({
        appId: item.appid,
        path: item.linkUrl || '',
      })
    } else {
      if (item.linkUrl) {
        wx.navigateTo({
          url: item.linkUrl
        })
      }
    }
  },
  adClick: function(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({
        url
      })
    }
  },
  bindTypeTap: function(e) {
    this.setData({
      selectCurrent: e.index
    })
  },
  onLoad: function(e) {
    wx.showShareMenu({
      withShareTicket: true,
    })
    const that = this
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        TOOLS.showTabBarBadge()
      } else {
        getApp().loginOK = () => {
          TOOLS.showTabBarBadge()
        }
      }
    })
    this.initBanners()
    // https://www.yuque.com/apifm/nu0f75/wg5t98
    WXAPI.my_goodsv2().then(res => {
      if (res.code === 0){
        that.setData({
          my_products: res.data.result
        })
      }      
    })
    that.getNotice()
    this.readConfigVal()
    getApp().configLoadOK = () => {
      this.readConfigVal()
    }
  },
  readConfigVal() {
    const mallName = wx.getStorageSync('mallName')
    if (!mallName) {
      return
    }
    this.categories()
    wx.setNavigationBarTitle({
      title: mallName
    })
    this.setData({
      mallName:wx.getStorageSync('mallName')?wx.getStorageSync('mallName'):'',
      show_buy_dynamic: wx.getStorageSync('show_buy_dynamic'),
      hidden_goods_index: wx.getStorageSync('hidden_goods_index'),
    })
  },
  async initBanners(){
    const _data = {}
    const res1 = await WXAPI.banners({
      type: 'index'
    })
    if (res1.code == 700) {
      wx.showModal({
        title: 'NOTE',
        content: 'PLS ADD PIC BACKEND',
        showCancel: false
      })
    } else {
      _data.banners = res1.data
    }
    this.setData(_data)
  },
  onShow: function(e){
    this.setData({
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject 
    })
    const refreshIndex = wx.getStorageSync('refreshIndex')
    if (refreshIndex) {
      this.onPullDownRefresh()
      wx.removeStorageSync('refreshIndex')
    }
  },
  async getMyGoodsList(myUserId, append) {
    if (categoryId == 0) {
      categoryId = "";
    }
    wx.showLoading({
      title: ''
    })
    // https://www.yuque.com/apifm/nu0f75/wg5t98
    const res = await WXAPI.my_goodsv2({
      userId: myUserId,
      page: this.data.curPage,
      pageSize: this.data.pageSize
    })
    wx.hideLoading()
    if (res.code == 404 || res.code == 700) {
      let newData = {
        loadingMoreHidden: false
      }
      if (!append) {
        newData.goods = []
      }
      this.setData(newData);
      return
    }
    let goods = [];
    if (append) {
      goods = this.data.goods
    }
    for (var i = 0; i < res.data.result.length; i++) {
      const item = res.data.result[i]
      const hidden_goods_index = wx.getStorageSync('hidden_goods_index')
      if (hidden_goods_index.indexOf(item.id) != -1) {
        continue
      }
      goods.push(item);
    }
    this.setData({
      loadingMoreHidden: true,
      goods: goods,
    });
  },
  onPullDownRefresh: function() {
    this.setData({
      curPage: 1
    });
    this.getMyGoodsList(userID)
    wx.stopPullDownRefresh()
  },
  goSearch(){
    wx.navigateTo({
      url: '/pages/search/index'
    })
  }
})
