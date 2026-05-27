const TOOLS = require('../../utils/tools.js')
const APP = getApp()

const CLOUDFUNC = require('../../utils/cloud.js');

Page({
  data: {
    bankerName: '',
    bankerID: -1,
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
  onLoad: function(options) {
    const bankerID = options.banker_id ? Number(options.banker_id) : -1;
    this.setData({ bankerID: bankerID })
    wx.showShareMenu({
      withShareTicket: true,
    })
    this.getGoodsList(false)
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
    this.getGoodsList(false)
  },

  async getGoodsList(append) {
    wx.showLoading({ title: '' })
    const res = await CLOUDFUNC.callCloudFunction('goodsStatics', { userID: this.data.bankerID, pageNo: this.data.curPage, pageSize: this.data.pageSize });
    wx.hideLoading()
    if (res.code != 0) {
      let newData = { loadingMoreHidden: false }
      if (!append) { newData.goods = [] }
      this.setData(newData);
      return
    }
    let goods = [];
    if (append) { goods = this.data.goods }
    for (var i = 0; i < res.goods.length; i++) {
      const item = res.goods[i];
      goods.push({
        id: item.goods_id,
        name: item.goods_info?.name || '',
        price: item.goods_info?.price || '0',
        characteristic: item.goods_info?.characteristic || '',
        pic: (item.goods_info?.imageList && item.goods_info.imageList[0]) ? item.goods_info.imageList[0].url : ''
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
    this.setData({ curPage: this.data.curPage + 1 });
    this.getGoodsList(true)
  },
  onPullDownRefresh: function() {
    this.setData({ curPage: 1 });
    this.getGoodsList(false)
    wx.stopPullDownRefresh()
  }
})
