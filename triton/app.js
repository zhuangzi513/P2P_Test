const WXAPI = require('apifm-wxapi')
const CONFIG = require('config.js')
const AUTH = require('utils/auth')




App({
  onLaunch: function() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'your-env-id',  // 替换为你的云环境ID
        traceUser: true
      });
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

  fetchUserId() {
    if (this.globalData.userId) {
      return Promise.resolve(this.globalData.userId);
    }

    const cachedUserId = wx.getStorageSync('userId');
    if (cachedUserId) {
      this.globalData.userId = cachedUserId;
      return Promise.resolve(cachedUserId);
    }

    return wx.cloud.callFunction({
      name: 'getUserInfo',
      data: {}
    }).then(res => {
      const { userId, openid } = res.result;
      this.globalData.userID = userId;
      wx.setStorageSync('userID', userId);
      return userId;
    }).catch(err => {
      console.error('获取用户ID失败', err);
      return null;
    });
  },

  onShow (e) {
    if (e && e.query && e.query.inviter_id) {
      wx.setStorageSync('referrer', e.query.inviter_id)
      if (e.shareTicket) {
        wx.getShareInfo({
          shareTicket: e.shareTicket,
          success: res => {
            wx.login({
              success(loginRes) {
                if (loginRes.code) {
                  WXAPI.shareGroupGetScore(
                    loginRes.code,
                    e.query.inviter_id,
                    res.encryptedData,
                    res.iv
                  ).then(_res => {
                    console.log(_res)
                  }).catch(err => {
                    console.error(err)
                  })
                } else {
                  console.error('登录失败！' + loginRes.errMsg)
                }
              }
            })
          }
        })
      }
    }

    this.getUserApiInfo()
  },
  async getUserApiInfo() {
    const res = wx.cloud.callFunction({
      name: 'getUserDetail',
      data: {}
    }).then(res => {
      this.globalData.apiUserInfoMap = res.result
    }).catch(err => {
      console.error('获取用户ID失败', err);
    });
  },
  initNickAvatarUrlPOP(_this) {
    setTimeout(() => {
      if (this.globalData.apiUserInfoMap && (!this.globalData.apiUserInfoMap.base.nick || !this.globalData.apiUserInfoMap.base.avatarUrl)) {
        _this.setData({
          nickPopShow: true,
          popnick: this.globalData.apiUserInfoMap.base.nick ? this.globalData.apiUserInfoMap.base.nick : '',
          popavatarUrl: this.globalData.apiUserInfoMap.base.avatarUrl ? this.globalData.apiUserInfoMap.base.avatarUrl : '',
        })
      }
    }, 3000)
  },
  globalData: {
    isConnected: true,
    sdkAppID: CONFIG.sdkAppID,
    apiUserInfoMap: undefined,
    userID : 0,
  }
})
