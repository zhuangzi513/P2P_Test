const CLOUDFUNC = require('../../utils/cloud.js');

Page({
  data: {
    page: 1,
    orderType: 0,
    userID: 0,
    isBanker: false,
    total: -1,
    badges: [0, 0, 0, 0, 0],
    orderList
  },
  cancelOrderTap: function(e) {
    const that = this;
    const orderId = e.currentTarget.dataset.item.orderID;
    wx.showModal({
      title: 'ARE YOU SURE?',
      content: '',
      success: function(res) {
        if (res.confirm) {
          CLOUDFUNC.callCloudFunction('updateOrderInfo', { orderID:orderId, orderStatus:9}).then(result => {
            if (result.code == 0) {
              that.orderList()
              that.getOrderStatistics()
            }
          });

          }
        }
    })
  },
  onLoad: function(options) {
    if (options && options.type) {
        this.setData({
          orderType: options.type,
          userID: wx.getStorageSync('userID'), 
          isBanker: wx.getStorageSync('isBanker')
        });
      }      
    }
    
    this.getOrderStatistics();
  },
  onReady: function() {

  },
  getOrderStatistics() {
    CLOUDFUNC.callCloudFunction('orderStatistics', {userID:wx.getStorageSync('userID'), orderType:orderType, isBanker:isBanker, pageNo:this.data.page}).then(res=> {
      if (res.code == 0) {
        this.setData({
          orderList:res.orders, 
          total:res.total 
        })
      }
    });

  },
  onShow: function() {
  },
  onPullDownRefresh: function () {
    this.data.page = 1
    this.getOrderStatistics()
    this.orderList()
    wx.stopPullDownRefresh()
  },
  onReachBottom() {
    this.setData({
      page: this.data.page + 1
    });
    this.orderList()
  },
  async orderList(){
    wx.showLoading({
      title: '',
    })
    var postData = {
      userID: this.data.userID,
      orderType: this.data.orderType,
      isBanker: this.data.isBanker,
      pageNo: this.data.page,
      pageSize: 20
    };
    const res = await CLOUDFUNC.callCloudFunction('orderStatistics', postData);
    wx.hideLoading()
    if (res.code == 0) {
      if (this.data.page == 1) {
        this.setData({
          orderList: res.orders
        })
      } else {
        this.setData({
          orderList: this.data.orderList.concat(res.orders)
        })
      }
    } else {
      if (this.data.page == 1) {
        this.setData({
          orderList: null
        })
      } else {
        wx.showToast({
          title: 'NO MORE',
          icon: 'none'
        })
      }
    }
  },
  goOrderDetail(e) {
    const item = e.currentTarget.dataset.item
    if (item.orderType == 0) {
      wx.navigateTo({
        url: '/pages/orders/order-type0-details?id=' + item.orderID
      })
    } else if (item.orderType == 1) {
      wx.navigateTo({
        url: '/pages/orders/order-type1-details?id=' + item.orderID
      })
    }
  }
})
