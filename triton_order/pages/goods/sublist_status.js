const TOOLS = require('../../utils/tools.js')
const APP = getApp()
const ORDER_STATUS = require('../../utils/order_status.js')

const CLOUDFUNC = require('../../utils/cloud.js');

Page({
  data: {
    activeTab: 'pending',
    allOrders: [],
    displayGoods: [],
    loadingMoreHidden: true,
    curPage: 1,
    pageSize: 20
  },
  toDetailsTap: function(e) {
    const id = e.currentTarget.dataset.id
    const orderType = e.currentTarget.dataset.type
    if (orderType === 0) {
      wx.navigateTo({
        url: `/pages/orders/order-type0-details?id=${id}`,
      })
    } else {
      wx.navigateTo({
        url: `/pages/orders/order-type1-details?id=${id}`,
      })
    }
  },
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.filterOrders()
  },
  filterOrders() {
    const tab = this.data.activeTab
    let filtered = this.data.allOrders
    if (tab === 'pending') {
      // 待确认：order_status == 1 (CONFIRM)，入库单和出库单都是 1
      filtered = this.data.allOrders.filter(g => g.order_status === 1)
    } else if (tab === 'active') {
      // 进行中：order_status != DONE 且不是待确认状态
      // 入库单 DONE=8, 出库单 DONE=5
      filtered = this.data.allOrders.filter(g => {
        const isDone = (g.order_type === 0 && g.order_status === ORDER_STATUS.ORDERSTATUS_ENUM0.DONE) ||
                       (g.order_type === 1 && g.order_status === ORDER_STATUS.ORDERSTATUS_ENUM1.DONE)
        return g.order_status !== 1 && !isDone
      })
    }
    this.setData({ displayGoods: filtered })
  },
  onLoad: function(options) {
    wx.showShareMenu({
      withShareTicket: true,
    })
    this.getOrderList(false)
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
    this.getOrderList(false)
  },

  async getOrderList(append) {
    wx.showLoading({ title: '' })
    const userID = wx.getStorageSync('userID')
    
    // 同时获取入库单(order_type=0)和出库单(order_type=1)
    const [res0, res1] = await Promise.all([
      CLOUDFUNC.callCloudFunction('orderStatics', { 
        userID: userID, 
        isBanker: true,
        orderType: '0', 
        pageNo: this.data.curPage, 
        pageSize: this.data.pageSize 
      }),
      CLOUDFUNC.callCloudFunction('orderStatics', { 
        userID: userID, 
        isBanker: true,
        orderType: '1', 
        pageNo: this.data.curPage, 
        pageSize: this.data.pageSize 
      })
    ]);
    wx.hideLoading()
    
    let orders = [];
    if (append) { orders = this.data.allOrders }
    
    // 解析入库单 (order_type=0)
    if (res0 && res0.orders) {
      const list0 = res0.orders || [];
      for (var i = 0; i < list0.length; i++) {
        const item = list0[i];
        const orderStatus = item.order_details?.order_status;
        orders.push({
          id: item.order_id || item._id,
          name: item.order_details?.goodsName || item.order_details?.name || '',
          price: item.order_details?.price || '0',
          order_type: 0,
          orderTypeText: '入库单',
          order_status: orderStatus,
          statusText: ORDER_STATUS.getStatusText0(orderStatus),
          pic: (item.order_details?.imageList && item.order_details.imageList[0]) 
               ? item.order_details.imageList[0].url 
               : (item.order_details?.pic || '')
        });
      }
    }
    
    // 解析出库单 (order_type=1)
    if (res1 && res1.orders) {
      const list1 = res1.orders || [];
      for (var j = 0; j < list1.length; j++) {
        const item = list1[j];
        const orderStatus = item.order_details?.order_status;
        orders.push({
          id: item.order_id || item._id,
          name: item.order_details?.goodsName || item.order_details?.name || '',
          price: item.order_details?.price || '0',
          order_type: 1,
          orderTypeText: '出库单',
          order_status: orderStatus,
          statusText: ORDER_STATUS.getStatusText1(orderStatus),
          pic: (item.order_details?.imageList && item.order_details.imageList[0]) 
               ? item.order_details.imageList[0].url 
               : (item.order_details?.pic || '')
        });
      }
    }
    
    this.setData({
      loadingMoreHidden: true,
      allOrders: orders,
    });
    this.filterOrders()
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
    this.getOrderList(true)
  },
  onPullDownRefresh: function() {
    this.setData({ curPage: 1 });
    this.getOrderList(false)
    wx.stopPullDownRefresh()
  }
})
