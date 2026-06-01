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
      userInfoMap: {},
      showEditModal: false,
      editNick: '',
      editAvatar: ''
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
  switchToMoney() {
    wx.navigateTo({
      url: '/pages/my/money',
    });
  },
  showEditProfile() {
    const userInfoMap = this.data.userInfoMap;
    this.setData({
      showEditModal: true,
      editNick: userInfoMap.nick || '',
      editAvatar: ''
    });
  },
  hideEditModal() {
    this.setData({
      showEditModal: false,
      editNick: '',
      editAvatar: ''
    });
  },
  onNickInput(e) {
    this.setData({ editNick: e.detail.value });
  },
  chooseAvatar() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFilePaths[0];
        that.setData({ editAvatar: tempFilePath });
      }
    });
  },
  saveProfile() {
    const that = this;
    const { editNick, editAvatar, userInfoMap } = this.data;

    if (!editNick.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    const doSave = (avatarUrl) => {
      const updatedUserInfo = {
        ...userInfoMap,
	data : {
          nick: editNick.trim(),
          avatar: avatarUrl || userInfoMap.avatar || ''
	}
      };
      console.log(updatedUserInfo)
      // 只传递需要更新的字段，移除 user_id 避免污染 data 字段
      const { user_id, ...userDetail } = updatedUserInfo;
      console.log(userDetail)
      CLOUDFUNC.callCloudFunction('updateUserInfo', {
        userID: wx.getStorageSync('userID'),
        userDetail: userDetail
      }).then(() => {
        wx.hideLoading();
        wx.showToast({ title: '保存成功', icon: 'success' });
        that.setData({
          userInfoMap: updatedUserInfo,
          showEditModal: false,
          editNick: '',
          editAvatar: ''
        });
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'none' });
        console.log('saveProfile FAILED', err);
      });
    };

    if (editAvatar) {
      const cloudPath = 'avatars/' + wx.getStorageSync('userID') + '_' + Date.now() + '.jpg';
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: editAvatar
      }).then(uploadRes => {
        doSave(uploadRes.fileID);
      }).catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '头像上传失败', icon: 'none' });
      });
    } else {
      doSave();
    }
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
