const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const APP = getApp()

const CLOUDFUNC = require('../../utils/cloud.js');

Page({
  data: {
    inputVal: "",
    goodsRecommend: [],
    loadingHidden: false,
    selectCurrent: 0,
    bankers: [],
    goods: [],
    loadingMoreHidden: true,
    curPage: 1,
    pageSize: 20
  },
  tabClick(e) {
    const userId = e.currentTarget.dataset.userid
    const index = e.currentTarget.dataset.index
    console.log('tabClick, user_id:', userId, 'index:', index)
    if (userId) {
      wx.navigateTo({
        url: '/pages/goods/sublist?banker_id=' + userId,
      })
    }
  },
  toDetailsTap: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/goods-details/index?id=${id}`,
    })
  },
  tapBanner(e) {
    const item = e.currentTarget.dataset.item
    if (item.linkType == 1) {
      // 跳小程序
      wx.navigateToMiniProgram({
        appId: item.appid,
        path: item.linkUrl || '',
      })
    } else {
      if (item.linkUrl) {
        wx.navigateTo({
          url: item.linkUrl
        })
      }
    }
  },
  adClick: function(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({
        url
      })
    }
  },
  bindTypeTap: function(e) {
    this.setData({
      selectCurrent: e.index
    })
  },
  onLoad: function(e) {
    wx.showShareMenu({
      withShareTicket: true,
    })
    const that = this
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        TOOLS.showTabBarBadge()
      } else {
        getApp().loginOK = () => {
          TOOLS.showTabBarBadge()
        }
      }
    })

    this.readConfigVal();
    this.initBanners();
    this.bankers();

    //that.getNotice()
  },
  readConfigVal() {
    const userName = wx.getStorageSync('userName')
    wx.setNavigationBarTitle({
      title: userName
    })
    this.setData({
      userName: userName ? userName : 'who are you',
    })
  },
  async initBanners(){
    const _data = {}
    //const res1 = await CLOUDFUNC.callCloudFunction('banners', { type: 'index' });
    //if (res1.code == 700) {
    //  wx.showModal({
    //    title: 'NOTE',
    //    content: 'PLS add pic backend',
    //    showCancel: false
    //  })
    //} else {
    //  _data.banners = res1.data
    //}
    this.setData(_data)
  },
  onShow: function(e){
    this.setData({
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject
    })
    TOOLS.showTabBarBadge()
    this.setData({ curPage: 1 })
    this.getGoodsList(0)
  },

  async bankers() {
    const res = await CLOUDFUNC.callCloudFunction('bankersList', {userID:wx.getStorageSync('userID')});
    let bankers = [];
    if (res.code == 0) {
      const _bankers = res.bankers
      bankers = bankers.concat(_bankers)
    } else {
      console.log('empty bankers')
    }
    console.log('bankers:', bankers)
    this.setData({
      bankers: bankers,
      curPage: 1
    });
  },
  async getGoodsList(categoryId, append) {
    if (categoryId == 0) {
      categoryId = "";
    }
    wx.showLoading({
      title: ''
    })
    const res = await CLOUDFUNC.callCloudFunction('goodsStatics', { pageNo: this.data.curPage, pageSize: this.data.pageSize });
    wx.hideLoading()
    if (res.code != 0) {
      let newData = {
        loadingMoreHidden: false
      }
      if (!append) {
        newData.goods = []
      }
      this.setData(newData);
      return
    }
    let goods = [];
    if (append) {
      goods = this.data.goods
    }
    console.log('res.goods', res.goods)
    for (var i = 0; i < res.goods.length; i++) {
      const item = res.goods[i];
      // 转换数据结构以适配前端显示
      goods.push({
        id: item.goods_id,
        name: item.goods_info?.name || '',
        price: item.goods_info?.price || '0',
        pic: (item.goods_info?.imageList && item.goods_info.imageList[0]) ? item.goods_info.imageList[0].url : '',
        color: item.goods_info?.color || '',
        sizeX: item.goods_info?.sizeX || '',
        sizeY: item.goods_info?.sizeY || '',
        sizeZ: item.goods_info?.sizeZ || ''
      });
    }
    this.setData({
      loadingMoreHidden: true,
      goods: goods,
    });
  },
  onShareAppMessage: function() {
    return {
      title: '"' + wx.getStorageSync('userName') + '" ' + wx.getStorageSync('share_profile'),
      path: '/pages/index/index?inviter_id=' + wx.getStorageSync('userID')
    }
  },
  onShareTimeline() {    
    return {
      title: '"' + wx.getStorageSync('userName') + '" ' + wx.getStorageSync('share_profile'),
      query: 'inviter_id=' + wx.getStorageSync('userID'),
      imageUrl: wx.getStorageSync('share_pic')
    }
  },
  getNotice: function() {
    var that = this;
    //CLOUDFUNC.callCloudFunction('noticeList', {userID: wx.getStorageSync("userID"), pageSize: 5}).then(function (res) {
    //  if (res.code == 0) {
    //    that.setData({
    //      noticeList: res.data
    //    });
    //  }
    //});
  },
  onReachBottom: function() {
    this.setData({
      curPage: this.data.curPage + 1
    });
    this.getGoodsList(0, true)
  },
  onPullDownRefresh: function() {
    this.setData({
      curPage: 1
    });
    this.getGoodsList(0)
    wx.stopPullDownRefresh()
  },
  goSearch(){
    wx.navigateTo({
      url: '/pages/search/index'
    })
  },
  goNotice(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/notice/show?id=' + id,
    })
  }
})
