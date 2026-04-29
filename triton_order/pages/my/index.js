const AUTH = require('../../utils/auth')
const TOOLS = require('../../utils/tools.js')
const CONFIG = require('../../config.js')
const { callCloudFunction } = require('../../utils/cloud.js');

Page({
    data: {
      userID: '',
      isShop:false,
      order_list_input : [],
      order_list_output: [],
      userInfoMap: {}
  },
  onLoad() {
    this.readConfigVal()
  },
  onShow() {
    this.getUserApiInfo();
    this.orderStatistics();
    TOOLS.showTabBarBadge();
  },
  readConfigVal() {
    this.setData({
      userID: wx.getStorageSync('userID'),
      isShop: wx.getStorageSync('isShop')
    })
  },
  async getUserDetail() {
    const res = await callCloudFunction('getUserInfo', { userID: wx.getStorageSync('userID')});
    if (res.code == 0) {
      this.setData({userInfoMap:res.data});
    }
  },
  async updateUserDetail() {
    const res = await callCloudFunction('updateUserInfo', { userID: wx.getStorageSync('userID'), userDetail: this.data.userInfoMap});
    if (res.code != 0) {
      console.log("updateUserDetail FAILED");
    }
  },
  async orderStatistics: function () {
    callCloudFunction('orderStatistics', { userID: wx.getStorageSync('userID')}).then(res=> {
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
    const res = await callCloudFunction('createInputOrder', { recverID: wx.getStorageSync('userID'), recverAddr: wx.getStorageSync('userAddr')});
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
    const res = await callCloudFunction('createOutputOrder', { senderID: wx.getStorageSync('userID'), senderAddr: wx.getStorageSync('userAddr')});
    if (res.code == 0) {
      new_order_id = res.data.new_output_order_id;
      wx.navigateTo({
        url: '/pages/orders/order-details/?id=' + new_order_id 
      })
    }
  }
})
