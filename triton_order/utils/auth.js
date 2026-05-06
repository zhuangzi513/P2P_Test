const CONFIG = require('../config.js')
const CLOUDFUC = require('../cloud.js');

async function checkHasLogined() {
  const token = wx.getStorageSync('token')
  if (!token) {
    return false
  }
  const checkTokenRes = await CLOUDFUC.callCloudFunction('checkToken', {'token':token});
  if (checkTokenRes.code != 0) {
    wx.removeStorageSync('token')
    return false
  }
  return true
}

async function wxaCode(){
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        return resolve(res.code)
      },
      fail() {
        wx.showToast({
          title: 'wxaCode failed',
          icon: 'none'
        })
        return resolve('wxaCode FAILED')
      }
    })
  })
}

async function login(page) {
  const _this = this
  const wxa_code = await wxaCode()
  CLOUDFUC.callCloudFunction('login_wx', {'code': wxa_code}).then(function (res) {        
    if (res.code == 10000) {
      return;
    }
    if (res.code != 0) {
      wx.showModal({
        title: 'login failed',
        content: res.msg,
        showCancel: false
      })
      return;
    }
    wx.setStorageSync('token', res.data.token)
    wx.setStorageSync('userID', res.data.uid)
    if ( page ) {
      page.onShow()
    }
  });
}

async function authorize() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: function (res) {
        const code = res.code
        let referrer = ''
        let referrer_storge = wx.getStorageSync('referrer');
        if (referrer_storge) {
          referrer = referrer_storge;
        }
        CLOUDFUC.callCloudFunction('authorize', {'code':code, 'referrer':referrer}).then(function (res) {
          if (res.code == 0) {
            wx.setStorageSync('token', res.data.token)
            wx.setStorageSync('userID', res.data.uid)
            resolve(res)
          } else {
            wx.showToast({
              title: res.msg,
              icon: 'none'
            })
            reject(res.msg)
          }
        });
      },
      fail: err => {
        reject(err)
      }
    })
  })
}

async function loginAsBanker_() {
  wx.setStorageSync('isBanker', true)
  wx.setStorageSync('isCustomer', false)
  const wxa_code = await wxaCode()
  const res = await CLOUDFUC.callCloudFunction('login_wx', {'code':wxa_code});
  if (res.code == 10000) {
    return res;
  }
  if (res.code != 0) {
    wx.showModal({
      content: res.msg,
      showCancel: false
    })
    return res;
  }
  wx.setStorageSync('token', res.data.token)
  wx.setStorageSync('uid', res.data.uid)
  return res
}

async function loginAsCustomer_() {
  wx.setStorageSync('isBanker', false)
  wx.setStorageSync('isCustomer', true)
  const wxa_code = await wxaCode()
  const res = await CLOUDFUC.callCloudFunction('login_wx', {'code':wxa_code});
  if (res.code == 10000) {
    return res;
  }
  if (res.code != 0) {
    wx.showModal({
      content: res.msg,
      showCancel: false
    })
    return res;
  }
  wx.setStorageSync('token', res.data.token)
  wx.setStorageSync('uid', res.data.uid)
  return res
}

function loginOut(){
  wx.removeStorageSync('token')
  wx.removeStorageSync('uid')
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
                title: 'FAILED auth',
                content: 'failed auth and check',
                showCancel: false,
                confirmText: 'CONFIRM',
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
  loginAsCustomer: loginAsCustomer_,
  loginOut: loginOut,
  checkAndAuthorize: checkAndAuthorize,
  authorize: authorize,
  bindSeller: bindSeller
}
