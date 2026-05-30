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
          orderType: Number(options.type),
          userID: wx.getStorageSync('userID'), 
          isBanker: wx.getStorageSync('isBanker')
        });
    }      
    console.log(options);
    this.getOrderStatistics(options.type);
  },
    
  onReady: function() {

  },
  getOrderStatistics(orderType) {
    if (!orderType)
      orderType = this.data.orderType;

    CLOUDFUNC.callCloudFunction('orderStatics',
                                {
				  userID:wx.getStorageSync('userID'),
				  orderType:orderType,
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
    const item = e.currentTarget.dataset.item;
    const index = e.currentTarget.dataset.index;
    
    console.log('点击订单，index:', index, 'item:', JSON.stringify(item));
    
    // 兼容不同的字段名
    const orderId = item.order_id || item.orderId || item.id;
    const orderType = item.order_type !== undefined ? item.order_type : (item.orderType || 0);
    
    console.log('orderId:', orderId, 'orderType:', orderType);
    
    if (!orderId) {
      wx.showToast({ title: '订单ID为空', icon: 'none' });
      return;
    }
    
    // 根据 orderType 跳转，默认跳转到 type0
    const url = (orderType == 1) ? '/pages/orders/order-type1-details?id=' + orderId : '/pages/orders/order-type0-details?id=' + orderId;
    
    console.log('跳转URL:', url);
    wx.navigateTo({ url });
  }
})
