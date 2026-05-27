const TOOLS = require('../../utils/tools.js')
const APP = getApp()

const CLOUDFUNC = require('../../utils/cloud.js');

Page({
  data: {
    bankerInfo: {
      nick: '',
      score: '',
      avatar: ''
    },
    bankerID: -1,
    activeTab: 'recommend',
    allGoods: [],
    displayGoods: [],
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
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab, curPage: 1 })
    if (tab === 'recommend') {
      this.getGoodsList(false)
    } else {
      this.filterGoods()
    }
  },
  filterGoods() {
    const tab = this.data.activeTab
    let filtered = this.data.allGoods
    if (tab === 'fixed') {
      filtered = this.data.allGoods.filter(g => g.fixedprice === true)
    } else if (tab === 'negotiable') {
      filtered = this.data.allGoods.filter(g => !g.fixedprice || g.fixedprice !== true)
    }
    this.setData({ displayGoods: filtered })
  },
  onLoad: function(options) {
    const bankerID = options.banker_id ? Number(options.banker_id) : -1;
    this.setData({ bankerID: bankerID })
    wx.showShareMenu({
      withShareTicket: true,
    })
    this.getBankerInfo(bankerID)
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

  async getBankerInfo(bankerID) {
    try {
      const res = await CLOUDFUNC.callCloudFunction('getUserInfo', { userID: bankerID });
      if (res && res.userInfo) {
        this.setData({
          bankerInfo: {
            nick: res.userInfo.nick || '',
            score: res.userInfo.score || '',
            avatar: res.userInfo.avatar || ''
          }
        })
      }
    } catch (err) {
      console.log('getBankerInfo failed:', err)
    }
  },

  async getGoodsList(append) {
    wx.showLoading({ title: '' })
    const res = await CLOUDFUNC.callCloudFunction('goodsStatics', { userID: this.data.userID, bankerID: this.data.bankerID, pageNo: this.data.curPage, pageSize: this.data.pageSize });
    wx.hideLoading()
    if (res.code != 0) {
      let newData = { loadingMoreHidden: false }
      if (!append) { newData.allGoods = [] }
      this.setData(newData);
      return
    }
    let goods = [];
    if (append) { goods = this.data.allGoods }
    for (var i = 0; i < res.goods.length; i++) {
      const item = res.goods[i];
      goods.push({
        id: item.goods_id,
        name: item.goods_info?.name || '',
        price: item.goods_info?.price || '0',
        fixedprice: item.goods_info?.fixedprice || false,
        characteristic: item.goods_info?.characteristic || '',
        pic: (item.goods_info?.imageList && item.goods_info.imageList[0]) ? item.goods_info.imageList[0].url : ''
      });
    }
    this.setData({
      loadingMoreHidden: true,
      allGoods: goods,
    });
    this.filterGoods()
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
