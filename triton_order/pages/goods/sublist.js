const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const APP = getApp()

const CLOUDFUNC = require('../../utils/cloud.js');

Page({
  data: {
    userName:'',
    userID:-1,
    goodsRecommend: [],
    bankers: [],
    goods: [],
    loadingMoreHidden: true,
    curPage: 1,
    pageSize: 20
  },
  toDetailsTap: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/goods-details/index?id=${id}`,
    })
  },
  onLoad: function(e) {
    wx.showShareMenu({
      withShareTicket: true,
    })
    this.getGoodsList()
  },
  readConfigVal() {
    const userName = wx.getStorageSync('userName')
    const userID = wx.getStorageSync('userName')
    wx.setNavigationBarTitle({
      title: userName
    })
    this.setData({
      userID  : userID   ? userID   : -1,
      userName: userName ? userName : 'who are you',
    })
  },
  onShow: function(e){
    this.setData({
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject
    })
    TOOLS.showTabBarBadge()
    this.setData({ curPage: 1 })
    this.getGoodsList(0)
  },

  async getGoodsList(append) {
    wx.showLoading({
      title: ''
    })
    const res = await CLOUDFUNC.callCloudFunction('goodsStatics', { bankerID: userID, pageNo: this.data.curPage, pageSize: this.data.pageSize });
    wx.hideLoading()
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
      const item = res.goods[i];
      // 转换数据结构以适配前端显示
      goods.push({
        id: item.goods_id,
        name: item.goods_info?.name || '',
        price: item.goods_info?.price || '0',
        pic: (item.goods_info?.imageList && item.goods_info.imageList[0]) ? item.goods_info.imageList[0].url : '',
        color: item.goods_info?.color || '',
        sizeX: item.goods_info?.sizeX || '',
        sizeY: item.goods_info?.sizeY || '',
        sizeZ: item.goods_info?.sizeZ || ''
      });
    }
    this.setData({
      loadingMoreHidden: true,
      goods: goods,
    });
  },
  onShareAppMessage: function() {
    return {
      title: '"' + wx.getStorageSync('userName') + '" ' + wx.getStorageSync('share_profile'),
      path: '/pages/index/index?inviter_id=' + wx.getStorageSync('userID')
    }
  },
  onShareTimeline() {    
    return {
      title: '"' + wx.getStorageSync('userName') + '" ' + wx.getStorageSync('share_profile'),
      query: 'inviter_id=' + wx.getStorageSync('userID'),
      imageUrl: wx.getStorageSync('share_pic')
    }
  },
  onReachBottom: function() {
    this.setData({
      curPage: this.data.curPage + 1
    });
    this.getGoodsList(0, true)
  },
  onPullDownRefresh: function() {
    this.setData({
      curPage: 1
    });
    this.getGoodsList(0)
    wx.stopPullDownRefresh()
  }
})
