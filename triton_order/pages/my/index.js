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
	     .catch(err => {
               console.log("updateUserDetail FAILED", err);
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
      if (res) {
        const {
          orderListInput,
          orderListOutput
        } = res || {};
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
        if (res && res.orderId) {
	  wx.navigateTo({
            url: '/pages/orders/order-type0-details?is_new=true&banker_id=' + this.data.userID + '&id=' + res.orderId,
          });
        }
      }).catch(err => {
        wx.showToast({ title: '创建订单失败', icon: 'none' });
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
  },
  logout() {
    wx.showModal({
      title: 'LOGOUT',
      content: 'Are you sure to logout?',
      confirmText: 'Yes',
      cancelText: 'Cancel',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          this.setData({
            hasLogined: false,
            userID: '',
            isBanker: false,
            isCustomer: false,
            userInfoMap: {}
          });
          wx.showToast({
            title: 'Logged out',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },
  removeInputOrders() {
    CLOUDFUNC.callCloudFunction('removeInputOrder', { userID: this.data.userID }).then(res => {
          wx.showToast({
            title: 'INPUTORDERS CLEAN',
            icon: 'success',
            duration: 1500
          });

    });
  },
  removeOutputOrders() {
    CLOUDFUNC.callCloudFunction('removeOutputOrder', { userID: this.data.userID }).then(res => {
          wx.showToast({
            title: '出库订单已清空',
            icon: 'success',
            duration: 1500
          });

    });
  }

})
