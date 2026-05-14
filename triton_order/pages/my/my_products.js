const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const CLOUDFUNC = require('../../utils/cloud.js');

const APP = getApp()

Page({
  data: {
    userID:'',
    inputVal: "",
    selectCurrent: 0,
    goods: [],
    loadingMoreHidden: true,
    pageSize: 20,
    curPage: 1,
    total: -1
  },
  toModifyTap: function(e) {
    console.log(e);
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/my/edit_product?id=${id}`,
    })
  },
  onLoad: function(e) {
    this.getMyGoodsList(wx.getStorageSync('userID'), false);
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
    const res = await CLOUDFUNC.callCloudFunction('goodsStatics', { userID: wx.getStorageSync('userID'), pageSize: this.data.pageSize })
    let goods = [];
    if (append) {
      goods = this.data.goods
    }
    if (!res || !res.goods) {
      this.setData({ loadingMoreHidden: false });
      return;
    }
    for (var i = 0; i < res.goods.length; i++) {
      const item = res.goods[i]
      console.log(item);
      goods.push(item);
    }
    this.setData({
      goods: goods,
      total: res.total
    });
  },
  onPullDownRefresh: function() {
    this.setData({
      curPage: 1
    });
    this.getMyGoodsList(wx.getStorageSync('userID'), true)
    wx.stopPullDownRefresh()
  },
  onReachBottom() {
    this.setData({
      curPage: this.data.curPage + 1
    });
    this.getMyGoodsList(wx.getStorageSync('userID'), true)
  },
})
