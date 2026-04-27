const AUTH = require('../../utils/auth')
const TOOLS = require('../../utils/tools.js')
const CONFIG = require('../../config.js')
const { callCloudFunction } = require('../../utils/cloud.js');

Page({
    data: {
      userID: '',
      isSaler:false,
      order_list_input : [],
      order_list_output: [],
      apiUserInfoMap: {}
  },
  onLoad() {
    this.readConfigVal()
    getApp().configLoadOK = () => {
      this.readConfigVal()
    }
  },
  onShow() {
    this.getUserApiInfo();
    this.orderStatistics();
    TOOLS.showTabBarBadge();
  },
  readConfigVal() {
    this.setData({
      userID: wx.getStorageSync('userID'),
    })
  },
  async getUserApiInfo() {
    const res = await callCloudFunction('userDetail', { userID: wx.getStorageSync('userID')});
    if (res.code == 0) {
      this.setData({apiUserInfoMap:res.data});
    }
  },
  handleOrderCount: function (count) {
    return count > 99 ? '99+' : count;
  },
  orderStatistics: function () {
    callCloudFunction('orderStatistics', { userID: wx.getStorageSync('userID')}).then(res=> {
      if (res.code == 0) {
        const {
          orderListInput,
          orderListOutput
        } = res.data || {}
        this.setData({
          order_list_input: orderListInput,
          order_list_output: orderListOutput
        })
      }
    })
  },
  editNick() {
    this.setData({
      nickShow: true
    })
  },
  async _editNick() {
    if (!this.data.nick) {
      wx.showToast({
        title: '请填写昵称',
        icon: 'none'
      })
      return
    }
    const postData = {
      token: wx.getStorageSync('usrID'),
      nick: this.data.nick,
    }
    const res = await callCloudFunction('modifyUserInfoV2', postData);
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    wx.showToast({
      title: '设置成功',
    })
    this.hideNickModal()
    this.getUserApiInfo()
  },
  async onChooseAvatar(e) {
    console.log(e);
    const avatarUrl = e.detail.avatarUrl
    let res = await callCloudFunction('uploadFileV2', {userID: wx.getStorageSync('userID'), URL: avatarUrl});
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    // https://www.yuque.com/apifm/nu0f75/ykr2zr
    res = await callCloudFunction('modifyUserInfoV2', {userID: wx.getStorageSync('userID'), avatarUrl: res.data.url});
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    this.getUserApiInfo()
  },
  login() {
    wx.navigateTo({
      url: '/pages/login/index',
    })
  },
  hideNickModal() {
    this.setData({
      nickShow: false
    })
  },
  toggleCards() {
    this.setData({
      cardsExpanded: !this.data.cardsExpanded
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
