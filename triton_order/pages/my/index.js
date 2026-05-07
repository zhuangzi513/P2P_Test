const AUTH = require('../../utils/auth.js')
const TOOLS = require('../../utils/tools.js')
const CONFIG = require('../../config.js')
const CLOUDFUNC = require('../../utils/cloud.js');

Page({
    data: {
      userID: '',
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
    this.getUserDetail();
    this.orderStatistics();
    TOOLS.showTabBarBadge();
  },
  readConfigVal() {
    this.setData({
      userID: wx.getStorageSync('userID'),
      isBanker: wx.getStorageSync('isBanker')
      isCustomer: wx.getStorageSync('isCustomer')
    })
  },
  getUserDetail() {
    let result;
    AUTH.checkHasLogined().then(res => { result = res; });
    if (!result) {
      wx.navigateTo({
        url: '/pages/login/index',
      })
      return;
    }
    CLOUDFUNC.callCloudFunction('getUserInfo', { userID: wx.getStorageSync('userID')}).then(res => {
      if (res.code == 0) {
        this.setData({userInfoMap:res.data});
      }
    });
  },
  updateUserDetail() {
    CLOUDFUNC.callCloudFunction('updateUserInfo', { userID: wx.getStorageSync('userID'), userDetail: this.data.userInfoMap})
	     .then(res = > {
               if (res.code != 0) {
                 console.log("updateUserDetail FAILED");
               }
	     });
  },
  async orderStatistics: function () {
    CLOUDFUNC.callCloudFunction('orderStatistics', { userID: wx.getStorageSync('userID')}).then(res=> {
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
    wx.navigateTo({
      url: '/pages/login/index',
    })
  },
  createInputOrder() {
    _createInputOrder()
  },
  async _createInputOrder() {
    const res = await CLOUDFUNC.callCloudFunction('createInputOrder', { recverID: wx.getStorageSync('userID'), recverAddr: wx.getStorageSync('userAddr')});
    if (res.code == 0) {
      new_order_id = res.data.new_input_order_id;
      wx.navigateTo({
        url: '/pages/orders/order-details/?id=' + new_order_id 
      })
    }
  },
  createOutputOrder() {
    _createOutputOrder()
  },
  async _createOutputOrder() {
    const res = await CLOUDFUNC.callCloudFunction('createOutputOrder', { senderID: wx.getStorageSync('userID'), senderAddr: wx.getStorageSync('userAddr')});
    if (res.code == 0) {
      new_order_id = res.data.new_output_order_id;
      wx.navigateTo({
        url: '/pages/orders/order-details/?id=' + new_order_id 
      })
    }
  }
})
