const CLOUDFUNC = require('../../utils/cloud.js');

Page({
  data: {
    page: 1,
    orderType: 0,
    userID: 0,
    isBanker: false,
    total: -1,
    badges: [0, 0, 0, 0, 0],
    orderList:[]
  },
  cancelOrderTap: function(e) {
    const that = this;
    const orderId = e.currentTarget.dataset.item.orderID;
    wx.showModal({
      title: 'ARE YOU SURE?',
      content: '',
      success: function(res) {
        if (res.confirm) {
          CLOUDFUNC.callCloudFunction('updateOrderInfo', { orderID:orderId, field:'order_status', value:9}).then(result => {
              that.orderList()
              that.getOrderStatistics()
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
    this.getOrderStatistics();
  },
    
  onReady: function() {

  },
  getOrderStatistics() {
    CLOUDFUNC.callCloudFunction('orderStatics',
                                {
				  userID:wx.getStorageSync('userID'),
				  orderType:this.data.orderType,
				  isBanker:this.data.isBanker,
				  pageNo:this.data.page
				}).then(res=> {
      if (res && res.orders) {
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
    this.setData({ page: 1 })
    this.getOrderStatistics()
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
    const res = await CLOUDFUNC.callCloudFunction('orderStatics', postData);
    wx.hideLoading()
    if (res && res.orders) {
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
    console.log('item:', item)
    console.log('e:', e)
    if (item.order_type == 0) {
      wx.navigateTo({
        url: '/pages/orders/order-type0-details?id=' + item.order_id,
      })
    } else if (item.order_type == 1) {
      wx.navigateTo({
        url: '/pages/orders/order-type1-details?id=' + item.order_id,
      })
    }
  }
})
