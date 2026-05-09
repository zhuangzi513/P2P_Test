const AUTH = require('../../utils/auth.js')
const TOOLS = require('../../utils/tools.js')
const CONFIG = require('../../config.js')
const CLOUDFUNC = require('../../utils/cloud.js');

Page({
    data: {
      userID: '',
      hasLogined: false,
      isBanker:false,
      isCustomer:false,
      order_list_input : [],
      order_list_output: [],
      userInfoMap: {}
  },
  onLoad() {
    this.readConfigVal()
  },
  onShow() {
    AUTH.checkHasLogined()
        .then(res => {
           this.setData({hasLogined : res});
           if (this.data.hasLogined) {
             this.getUserDetail();
             this.orderStatistics();
           }
	 });
  },
  readConfigVal() {
    this.setData({
      userID: wx.getStorageSync('userID'),
      isBanker: wx.getStorageSync('isBanker'),
      isCustomer: wx.getStorageSync('isCustomer')
    })
  },
  getUserDetail() {
    let userID = wx.getStorageSync('userID');
    console.log('userID', userID)

    CLOUDFUNC.callCloudFunction('getUserInfo', { userID: userID }).then(res => {
      console.log('res', res)
      this.setData({userInfoMap:res.userInfo});
    });
  },
  updateUserDetail() {
    CLOUDFUNC.callCloudFunction('updateUserInfo', { userID: wx.getStorageSync('userID'), userDetail: this.data.userInfoMap})
	     .then(res => {
               if (res.code != 0) {
                 console.log("updateUserDetail FAILED");
               }
	     });
  },
  orderStatistics() {
    CLOUDFUNC.callCloudFunction('orderStatics',
                                {
				  userID: wx.getStorageSync('userID'),
                                  orderType: 0,
				  isBanker: this.data.isBanker,
				  pageNo:1
				}).then(res=> {
      if (res.code == 0) {
        const {
          orderListInput,
          orderListOutput
        } = res.data || {};
        this.setData({
          order_list_input: orderListInput,
          order_list_output: orderListOutput
        })
      }
    })
  },
  login() {
    console.log('go to login')
    wx.navigateTo({
      url: '/pages/login/index',
    })
  },
  createInputOrder() {
    this._createInputOrder();
  },
  _createInputOrder() {
    CLOUDFUNC.callCloudFunction('newOrder',
      {
        bankerID: wx.getStorageSync('userID'),
        orderType:0,
        recverAddr: wx.getStorageSync('userAddr')
      }).then(res => {
        if (res.code == 0) {
	  console.log('orderId', res.orderId)
	  setTimeout(() => {
            wx.navigateTo({
              url: '/pages/orders/order-type0-details?id=' + res.orderId,
            });
	  }, 2000);
        }
      });
  },
  switchToInputOrders() {
    wx.navigateTo({
      url: '/pages/orders/order-list?type=0',
    });
  },
  switchToOutputOrders() {
    wx.navigateTo({
      url: '/pages/orders/order-list?type=1',
    });
  }

 })
