const CONFIG = require('config.js')
const AUTH = require('utils/auth')
const CLOUDFUNC = require('utils/cloud.js')

App({
  onLaunch: function() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上基础库以使用云能力');
    } else {
      wx.cloud.init({ env: 'ramotest-d6gbke3913ce78dfa', traceUser: true});
    }
    this.fetchUserId();


    const that = this;
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: 'update ready tips',
        content: 'update content',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })

    wx.getNetworkType({
      success(res) {
        const networkType = res.networkType
        if (networkType === 'none') {
          that.globalData.isConnected = false
          wx.showToast({
            title: 'toast network lose',
            icon: 'loading',
            duration: 2000
          })
        }
      }
    });
    wx.onNetworkStatusChange(function(res) {
      if (!res.isConnected) {
        that.globalData.isConnected = false
        wx.showToast({
          title: 'toast network status change',
          icon: 'loading',
          duration: 2000
        })
      } else {
        that.globalData.isConnected = true
        wx.hideToast()
      }
    })

    let menuButtonObject = wx.getMenuButtonBoundingClientRect();
    console.log("menubutton bounding:",menuButtonObject)
    wx.getSystemInfo({
      success: res => {
        let statusBarHeight = res.statusBarHeight,
          navTop = menuButtonObject.top,
          navHeight = statusBarHeight + menuButtonObject.height + (menuButtonObject.top - statusBarHeight)*2;
        this.globalData.navHeight = navHeight;
        this.globalData.navTop = navTop;
        this.globalData.windowHeight = res.windowHeight;
        this.globalData.menuButtonObject = menuButtonObject;
        console.log("navHeight",navHeight);
      },
      fail(err) {
        console.log(err);
      }
    })
  },

  async fetchUserId() {
    if (this.globalData.userID) {
      return Promise.resolve(this.globalData.userID);
    }

    const cachedUserId = wx.getStorageSync('userID');
    if (cachedUserId) {
      this.globalData.userID = cachedUserId;
      return Promise.resolve(cachedUserId);
    }

    const res = await CLOUDFUNC.callCloudFunction(
      'getUserId',
      {}
    )
    const userID = res.data.userID;
    this.globalData.userID = userID;
    wx.setStorageSync('userID', userID);
    console.log('userID:', userID);
    return userID;
  },

  onShow (e) {
    if (e && e.query && e.query.inviter_id) {
      wx.setStorageSync('referrer', e.query.inviter_id)
    }

    this.getUserDetailInfo()
  },

  async getUserDetailInfo() {
    const res = await CLOUDFUNC.callCloudFunction('getUserInfo', {userID: wx.getStorageSync('userID')});
    if (res.code == 0) {
        this.globalData.userDetailInfo = res.data.userInfo;
    }
  },

  initNickAvatarUrlPOP(_this) {
    setTimeout(() => {
      if (this.globalData.userDetailInfo && (!this.globalData.userDetailInfo.base.nick || !this.globalData.userDetailInfo.base.avatarUrl)) {
        _this.setData({
          nickPopShow: true,
          popnick: this.globalData.userDetailInfo.base.nick ? this.globalData.userDetailInfo.base.nick : '',
          popavatarUrl: this.globalData.userDetailInfo.base.avatarUrl ? this.globalData.userDetailInfo.base.avatarUrl : '',
        })
      }
    }, 3000)
  },
  globalData: {
    isConnected: true,
    sdkAppID: CONFIG.sdkAppID,
    userDetailInfo: undefined,
    userID : 0,
  }
})
