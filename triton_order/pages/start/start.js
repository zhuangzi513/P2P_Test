const CONFIG = require('../../config.js')
const CLOUDFUNC = require('../../utils/cloud.js');

Page({
  data: {
    swiperMaxNumber: 0,
    swiperCurrent: 0,
    userId: 0

  },
  onLoad(e){
    this.readConfigVal()
    getApp().configLoadOK = () => {
      this.readConfigVal()
    }
  },
  onShow:function(){
    
  },
  async readConfigVal() {
    const mallName = wx.getStorageSync('mallName')
    if (!mallName) {
      return
    }
    wx.setNavigationBarTitle({
      title: wx.getStorageSync('mallName')
    })
    let shopMod = wx.getStorageSync('shopMod')
    if (!shopMod) {
      shopMod = 0
    }
    const app_show_pic_version = wx.getStorageSync('app_show_pic_version')
    if (app_show_pic_version && app_show_pic_version == CONFIG.version) {
      if (shopMod==1) {
        this.goSelectPage()
      } else {
        wx.switchTab({
          url: '/pages/index/index',
        })
      }
    } else {
      try {
        const res = await CLOUDFUNC.callCloudFunction('banners', { type: 'app' });
        if (res && res.banners) {
          this.setData({
            banners: res.banners,
            swiperMaxNumber: res.banners.length
          });
        } else {
          if (shopMod==1) {
            this.goSelectPage()
          } else {
            wx.switchTab({
              url: '/pages/index/index',
            })
          }
        }
      } catch (err) {
        if (shopMod==1) {
          this.goSelectPage()
        } else {
          wx.switchTab({
            url: '/pages/index/index',
          })
        }
      }
    }
  },
  swiperchange: function (e) {
    //console.log(e.detail.current)
    this.setData({
      swiperCurrent: e.detail.current
    })
  },
  goLeft() {
    if (this.data.swiperCurrent == 0) {
      this.setData({
        swiperCurrent: this.data.swiperMaxNumber - 1
      })
    } else {
      this.setData({
        swiperCurrent: this.data.swiperCurrent - 1
      })
    }
  },
  goRight() {
    if (this.data.swiperCurrent == this.data.swiperMaxNumber - 1) {
      this.setData({
        swiperCurrent: 0
      })
    } else {
      this.setData({
        swiperCurrent: this.data.swiperCurrent + 1
      })
    }
  },
  goToIndex: function (e) {
    let shopMod = wx.getStorageSync('shopMod')
    if (!shopMod) {
      shopMod = 0
    }
    if (getApp().globalData.isConnected) {
      wx.setStorage({
        key: 'app_show_pic_version',
        data: CONFIG.version
      })
      if (shopMod == 1) {
        this.goSelectPage()
      } else {
        wx.switchTab({
          url: '/pages/index/index',
        });
      }
    } else {
      wx.showToast({
        title: 'cannot connect to internet',
        icon: 'none',
      })
    }
  },
  async goSelectPage() {
    if (!this.data.userId) {
      wx.showToast({
        title: 'NOT IMPLEMENT YET, goSelectPage',
        icon: 'none',
      })
      return
    }
    try {
      const res = await CLOUDFUNC.callCloudFunction('goSelectPage', {});
      if (res && res.info) {
        wx.setStorageSync('shopInfo', res.info)
        wx.setStorageSync('userIds', res.info.id)
      }
    } catch (err) {
      wx.showToast({
        title: 'NOT IMPLEMENT YET, goSelectPage',
        icon: 'none',
      })
    }
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
});
