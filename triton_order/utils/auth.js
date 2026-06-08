const CONFIG = require('../config.js')
const CLOUDFUNC = require('./cloud.js');

async function checkHasLogined() {
  const token = wx.getStorageSync('token')
  if (!token) {
    return false
  }
  try {
    const checkTokenRes = await CLOUDFUNC.callCloudFunction('checkToken', {token:token});
    // checkToken 返回 {code:0, data:{code:0, message:...}}
    // cloud.js 解包后得到 {code:0, message:...}
    if (checkTokenRes.code != 0) {
      wx.removeStorageSync('token')
      return false
    }
    return true
  } catch (err) {
    wx.removeStorageSync('token')
    return false
  }
}

async function wxaCode(){
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        return resolve(res.code)
      },
      fail() {
        wx.showToast({
          title: '微信登录失败',
          icon: 'none'
        })
        return resolve('')
      }
    })
  })
}

async function login(page) {
  try {
    const res = await CLOUDFUNC.callCloudFunction('login', {isBanker: false});
    // login 返回 {code:0, data:{code:0, token, userID}}
    // cloud.js 解包后得到 {code:0, token, userID}
    if (res.token) {
      wx.setStorageSync('token', res.token)
      wx.setStorageSync('userID', res.userID)
      if (page) {
        page.onShow()
      }
    } else {
      wx.showModal({
        title: 'login failed',
        content: '登录失败',
        showCancel: false
      })
    }
  } catch (err) {
    wx.showModal({
      title: 'login failed',
      content: err.message || '网络错误',
      showCancel: false
    })
  }
}

async function authorize() {
  try {
    const res = await CLOUDFUNC.callCloudFunction('login', {isBanker: false});
    if (res.token) {
      wx.setStorageSync('token', res.token)
      wx.setStorageSync('userID', res.userID)
      return res
    } else {
      wx.showToast({
        title: '授权失败',
        icon: 'none'
      })
      return null
    }
  } catch (err) {
    wx.showToast({
      title: err.message || '授权失败',
      icon: 'none'
    })
    return null
  }
}

async function loginAsBanker_(inviteCode) {
  wx.setStorageSync('isBanker', true)
  wx.setStorageSync('isCustomer', false)
  try {
    const res = await CLOUDFUNC.callCloudFunction('login', {
      isBanker: true,
      inviteCode: inviteCode || ''
    });
    if (res.token) {
      wx.setStorageSync('token', res.token)
      wx.setStorageSync('userID', res.userID)
      return res
    } else {
      wx.showModal({
        content: res.message || '登录失败',
        showCancel: false
      })
      return null
    }
  } catch (err) {
    wx.showModal({
      content: err.message || err.msg || '登录失败',
      showCancel: false
    })
    return null
  }
}

// 静默登录（不弹错误框），用于试探是否已注册
async function tryLoginAsBanker(inviteCode) {
  wx.setStorageSync('isBanker', true)
  wx.setStorageSync('isCustomer', false)
  try {
    const res = await CLOUDFUNC.callCloudFunction('login', {
      isBanker: true,
      inviteCode: inviteCode || ''
    });
    if (res.token) {
      wx.setStorageSync('token', res.token)
      wx.setStorageSync('userID', res.userID)
      return { success: true, data: res };
    } else {
      return { success: false, message: res.message || '登录失败' };
    }
  } catch (err) {
    return { success: false, message: err.message || err.msg || '登录失败' };
  }
}

async function loginAsCustomer_() {
  wx.setStorageSync('isBanker', false)
  wx.setStorageSync('isCustomer', true)
  try {
    const res = await CLOUDFUNC.callCloudFunction('login', {isBanker: false});
    if (res.token) {
      wx.setStorageSync('token', res.token)
      wx.setStorageSync('userID', res.userID)
      return res
    } else {
      wx.showModal({
        content: '登录失败',
        showCancel: false
      })
      return null
    }
  } catch (err) {
    wx.showModal({
      content: err.message || '登录失败',
      showCancel: false
    })
    return null
  }
}

function loginOut(){
  wx.removeStorageSync('token')
  wx.removeStorageSync('userID')
  wx.removeStorageSync('openid')
  wx.removeStorageSync('mobile')
  wx.removeStorageSync('isBanker')
  wx.removeStorageSync('isCustomer')
}

async function checkAndAuthorize (scope) {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success(res) {
        if (!res.authSetting[scope]) {
          wx.authorize({
            scope: scope,
            success() {
              resolve()
            },
            fail(e){
              console.error(e)
              wx.showModal({
                title: '授权失败',
                content: '需要您授权后才能使用该功能',
                showCancel: false,
                confirmText: '去授权',
                confirmColor: '#e64340',
                success(res) {
                  wx.openSetting();
                },
                fail(e){
                  console.error(e)
                  reject(e)
                },
              })
            }
          })
        } else {
          resolve()
        }
      },
      fail(e){
        console.error(e)
        reject(e)
      }
    })
  })  
}

module.exports = {
  checkHasLogined: checkHasLogined,
  wxaCode: wxaCode,
  login: login,
  loginAsBanker: loginAsBanker_,
  tryLoginAsBanker: tryLoginAsBanker,
  loginAsCustomer: loginAsCustomer_,
  loginOut: loginOut,
  checkAndAuthorize: checkAndAuthorize,
  authorize: authorize
}
