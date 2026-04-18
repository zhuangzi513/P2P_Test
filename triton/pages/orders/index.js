const { callCloudFunction } = require('../../utils/cloud.js');

Page({
  data: {
    page: 1,
    tabIndex: 0,
    statusType: [
      {
        status: 9999,
        label: '全部'
      },
      {
        status: 0,
        label: '待付款'
      },
      {
        status: 1,
        label: '待发货'
      },
      {
        status: 2,
        label: '待收货'
      },
      {
        status: 3,
        label: '待评价'
      },
    ],
    status: 9999,
    hasRefund: false,
    badges: [0, 0, 0, 0, 0]
  },
  statusTap: function(e) {
    const index = e.detail.index
    const status = this.data.statusType[index].status
    this.setData({
      page: 1,
      status
    });
    this.orderList();
  },
  cancelOrderTap: function(e) {
    const that = this;
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: 'ARE YOU SURE?',
      content: '',
      success: function(res) {
        if (res.confirm) {
          callCloudFunction('orderClose', { userID:wx.getStorageSync('userID'), orderID:orderId}).then(result => {
            if (result.code == 0) {
              that.data.page = 1
              that.orderList()
              that.getOrderStatistics()
            }
          });

          }
        }
    })
  },
  toPayTap: function(e) {
    if (this.data.payButtonClicked) {
      wx.showToast({
        title: 'LOADING~',
        icon: 'none'
      })
      return
    }
    this.data.payButtonClicked = true
    setTimeout(() => {
      this.data.payButtonClicked = false
    }, 3000)
    const that = this;
    const orderId = e.currentTarget.dataset.id;
    let money = e.currentTarget.dataset.money;
    const needScore = e.currentTarget.dataset.score;
  },
  _toPayTap: function (orderId, money){
    const _this = this
    if (money <= 0) {
      callCloudFunction('orderPay', {userID:wx.getStorageSync('userID'), orderID:orderId}).then(res=> {
        if (res.code == 0) {
          _this.data.page = 1
          _this.orderList()
          _this.getOrderStatistics()
        }
      })

    } else {
      this.setData({
        orderId,
        money,
        paymentShow: true,
        nextAction: {
          type: 0,
          id: orderId
        }
      })
    }
  },
  onLoad: function(options) {
    if (options && options.type) {
      if (options.type == 99) {
        this.setData({
          hasRefund: true
        });
      } else {
        const tabIndex = this.data.statusType.findIndex(ele => {
          return ele.status == options.type
        })
        this.setData({
          status: options.type,
          tabIndex
        });
      }      
    }
    this.getOrderStatistics();
    this.orderList();
    this.setData({
      sphpay_open: wx.getStorageSync('sphpay_open')
    })
  },
  onReady: function() {

  },
  getOrderStatistics() {
    callCloudFunction('orderStatistics', {userID:wx.getStorageSync('token')}).then(res=> {
      if (res.code == 0) {
        const badges = this.data.badges;
        badges[1] = res.data.count_id_no_pay
        badges[2] = res.data.count_id_no_transfer
        badges[3] = res.data.count_id_no_confirm
        badges[4] = res.data.count_id_no_reputation
        this.setData({
          badges
        })
      }
    })

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
      page: this.data.page,
      pageSize: 20,
      token: wx.getStorageSync('token')
    };
    if (this.data.hasRefund) {
      postData.hasRefund = true
    }
    if (!postData.hasRefund) {
      postData.status = this.data.status;
    }
    if (postData.status == 9999) {
      postData.status = ''
    }
    const res = await callCloudFunction('orderList', postData);
    wx.hideLoading()
    if (res.code == 0) {
      if (this.data.page == 1) {
        this.setData({
          orderList: res.data.orderList,
          logisticsMap: res.data.logisticsMap,
          goodsMap: res.data.goodsMap
        })
      } else {
        this.setData({
          orderList: this.data.orderList.concat(res.data.orderList),
          logisticsMap: Object.assign(this.data.logisticsMap, res.data.logisticsMap),
          goodsMap: Object.assign(this.data.goodsMap, res.data.goodsMap)
        })
      }
    } else {
      if (this.data.page == 1) {
        this.setData({
          orderList: null,
          logisticsMap: {},
          goodsMap: {}
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
    wx.navigateTo({
      url: '/pages/order-details/index?id=' + item.id,
    })
  },
})
