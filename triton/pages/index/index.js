const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const APP = getApp()

const { callCloudFunction } = require('../../utils/cloud.js');

Page({
  data: {
    inputVal: "",
    goodsRecommend: [],
    loadingHidden: false,
    selectCurrent: 0,
    categories: [],
    goods: [],
    loadingMoreHidden: true,
    curPage: 1,
    pageSize: 20
  },
  tabClick(e) {
    const category = this.data.categories.find(ele => {
      return ele.id == e.currentTarget.dataset.id
    })
    if (category.vopCid1 || category.vopCid2) {
      wx.navigateTo({
        url: '/pages/goods/list-vop?cid1=' + (category.vopCid1 ? category.vopCid1 : '') + '&cid2=' + (category.vopCid2 ? category.vopCid2 : ''),
      })
    } else {
      wx.setStorageSync("_categoryId", category.id)
      wx.switchTab({
        url: '/pages/category/category',
      })
    }
  },
  tabClickCms(e) {
    const category = this.data.cmsCategories[e.currentTarget.dataset.idx]
    wx.navigateTo({
      url: '/pages/cms/list?categoryId=' + category.id,
    })
  },
  toDetailsTap: function(e) {
    console.log(e);
    const id = e.currentTarget.dataset.id
    const supplytype = e.currentTarget.dataset.supplytype
    const yyId = e.currentTarget.dataset.yyid
    if (supplytype == 'cps_jd') {
      wx.navigateTo({
        url: `/packageCps/pages/goods-details/cps-jd?id=${id}`,
      })
    } else if (supplytype == 'vop_jd') {
      wx.navigateTo({
        url: `/pages/goods-details/vop?id=${yyId}&goodsId=${id}`,
      })
    } else if (supplytype == 'cps_pdd') {
      wx.navigateTo({
        url: `/packageCps/pages/goods-details/cps-pdd?id=${id}`,
      })
    } else if (supplytype == 'cps_taobao') {
      wx.navigateTo({
        url: `/packageCps/pages/goods-details/cps-taobao?id=${id}`,
      })
    } else {
      wx.navigateTo({
        url: `/pages/goods-details/index?id=${id}`,
      })
    }
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
    if (e && e.inviter_id) {
      wx.setStorageSync('referrer', e.inviter_id)
    }
    if (e && e.scene) {
      const scene = decodeURIComponent(e.scene)
      if (scene) {        
        wx.setStorageSync('referrer', scene.substring(11))
      }
    }
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        TOOLS.showTabBarBadge()
      } else {
        getApp().loginOK = () => {
          TOOLS.showTabBarBadge()
        }
      }
    })
    this.initBanners()
    this.cmsCategories()
    // https://www.yuque.com/apifm/nu0f75/wg5t98
    const res = await callCloudFunction('goodsV2', { recommendStatus: 1});
    if (res.code === 0){
      that.setData({
        goodsRecommend: res.data.result
      })
    }      

    that.getNotice()
    // 读取系统参数
    this.readConfigVal()
    getApp().configLoadOK = () => {
      this.readConfigVal()
    }
  },
  readConfigVal() {
    const userName = wx.getStorageSync('userName')
    if (!userName) {
      return
    }
    this.categories()
    wx.setNavigationBarTitle({
      title: userName
    })
    this.setData({
      userName:wx.getStorageSync('userName')?wx.getStorageSync('userName'):'',
      show_buy_dynamic: wx.getStorageSync('show_buy_dynamic'),
      hidden_goods_index: wx.getStorageSync('hidden_goods_index'),
    })
  },
  async initBanners(){
    const _data = {}
    // 读取头部轮播图
    const res1 = await callCloudFunction('banners', { type: 'index' });
    if (res1.code == 700) {
      wx.showModal({
        title: 'NOTE',
        content: 'PLS add pic backend',
        showCancel: false
      })
    } else {
      _data.banners = res1.data
    }
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
    this.goodsDynamicV2()
    const refreshIndex = wx.getStorageSync('refreshIndex')
    if (refreshIndex) {
      this.onPullDownRefresh()
      wx.removeStorageSync('refreshIndex')
    }
  },
  async goodsDynamicV2(){
    const res = await callCloudFunction('goodsDynamicV2', { type: 0 });
    if (res.code == 0) {
      this.setData({
        goodsDynamicV2: res.data.result
      })
    }
  },
  async categories(){
    const res = await callCloudFunction('goodsCategory', {});
    let categories = [];
    if (res.code == 0) {
      const _categories = res.data.filter(ele => {
        return ele.level == 1
      })
      categories = categories.concat(_categories)
    }
    this.setData({
      categories: categories,
      curPage: 1
    });
    this.getGoodsList(0);
  },
  async getGoodsList(categoryId, append) {
    if (categoryId == 0) {
      categoryId = "";
    }
    wx.showLoading({
      title: ''
    })
    const res = await callCloudFunction('goodsV2', { categoryId: categoryId, page: this.data.curPage, pageSize: this.data.pageSize });
    wx.hideLoading()
    if (res.code == 404 || res.code == 700) {
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
    for (var i = 0; i < res.data.result.length; i++) {
      const item = res.data.result[i]
      const hidden_goods_index = wx.getStorageSync('hidden_goods_index')
      if (hidden_goods_index.indexOf(item.id) != -1) {
        continue
      }
      goods.push(item);
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
    const res = await callCloudFunction('noticeList', {userID: wx.getStorageSync("userID"), pageSize: 5}).then(function (res) {
      if (res.code == 0) {
        that.setData({
          noticeList: res.data
        });
      }
    })
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
  },
  async cmsCategories() {
    const res = await callCloudFunction('cmsCategories', {})
    if (res.code == 0) {
      const cmsCategories = res.data.filter(ele => {
        return ele.type == 'index'
      })
      this.setData({
        cmsCategories
      })
    }
  },
})
