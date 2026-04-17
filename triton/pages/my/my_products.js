const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const { callCloudFunction } = require('../../utils/cloud.js');

const APP = getApp()

Page({
  data: {
    inputVal: "",
    selectCurrent: 0,
    goods: [],
    loadingMoreHidden: true,
    pageSize: 20
  },
  toModifyTap: function(e) {
    console.log(e);
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/my/edit_product?id=${id}`,
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
    const res = callCloudFunction('my_goodsv2', {userID:getStorageSync('userID')});
    if (res.code === 0){
      that.setData({
        my_products: res.data.result
      })
    }      
    that.getNotice()
    this.readConfigVal()
    getApp().configLoadOK = () => {
      this.readConfigVal()
    }
  },
  readConfigVal() {
    const userName = wx.getStorageSync('userName')
    if (!userName) {
      return
    }
    this.categories()
    wx.setNavigationBarTitle({
      title: userName
    })
    this.setData({
      userName:wx.getStorageSync('userName')?wx.getStorageSync('userName'):'',
      show_buy_dynamic: wx.getStorageSync('show_buy_dynamic'),
      hidden_goods_index: wx.getStorageSync('hidden_goods_index'),
    })
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
    const res = await callCloudFunction('my_goodsv2', { userID: myUserId, page: this.data.curPage, pageSize: this.data.pageSize })
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
  }
})
