const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const CLOUDFUNC = require('../../utils/cloud.js');

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
    callCloudFunction('goodsStatics', {userID:getStorageSync('userID')}).then(res=> {
      if (res.code === 0){
        that.setData({
          my_products: res.data
        })
      }   
    })
   
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
    this.setData({
      userName:wx.getStorageSync('userName') ,
      userID:wx.getStorageSync('userID')
    })
  },
  onShow: function(e){
    this.setData({
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject 
    })
  },
  async getMyGoodsList(myUserId, append) {
    const res = await callCloudFunction('goodsStatics', { userID: myUserId, pageSize: this.data.pageSize })
    if (res.code != 0) {
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
    for (var i = 0; i < res.goods.length; i++) {
      const item = res.goods[i]
      goods.push(item);
    }
    this.setData({
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
