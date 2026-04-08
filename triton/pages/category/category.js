const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const TOOLS = require('../../utils/tools.js') // TOOLS.showTabBarBadge();

Page({
  data: {
    categories: [],
    activeCategory: 0,
    categorySelected: {
      name: '',
      id: ''
    },
    currentGoods: [],
    onLoadStatus: true,
    scrolltop: 0,

    page: 1,
    pageSize: 20
  },
  onLoad: function(options) {
    wx.showShareMenu({
      withShareTicket: true
    })
    this.setData({
      categoryMod: wx.getStorageSync('categoryMod')
    })
    this.categories();
  },
  async categories() {
    wx.showLoading({
      title: 'LOADING tile',
    })
    const res = await WXAPI.goodsCategory()
    wx.hideLoading()
    let activeCategory = 0
    let categorySelected = this.data.categorySelected
    if (res.code == 0) {
      const categories = res.data
      categories.forEach(p => {
        p.childs = categories.filter(ele => {
          return p.id == ele.pid
        })
      })
      const firstCategories = categories.filter(ele => { return ele.level == 1 })
      if (this.data.categorySelected.id) {
        activeCategory = firstCategories.findIndex(ele => {
          return ele.id == this.data.categorySelected.id
        })
        categorySelected = firstCategories[activeCategory]
      } else {
        categorySelected = firstCategories[0]
      }
      this.setData({
        page: 1,
        activeCategory,
        categories,
        firstCategories,
        categorySelected
      })
      this.getGoodsList()
    }
  },
  async getGoodsList() {
    if (this.data.categoryMod == 2) {
      return
    }
    wx.showLoading({
      title: 'LOADING TITLE',
    })
    // secondCategoryId
    let categoryId = ''
    if (this.data.secondCategoryId) {
      categoryId = this.data.secondCategoryId
    } else if(this.data.categorySelected && this.data.categorySelected.id) {
      categoryId = this.data.categorySelected.id
    }
    const res = await WXAPI.goodsv2({
      categoryId,
      page: this.data.page,
      pageSize: this.data.pageSize
    })
    wx.hideLoading()
    if (res.code == 700) {
      if (this.data.page == 1) {
        this.setData({
          currentGoods: null
        });
      } else {
        wx.showToast({
          title: 'NO MORE',
          icon: 'none'
        })
      }
      return
    }
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    if (this.data.page == 1) {
      this.setData({
        currentGoods: res.data.result
      })
    } else {
      this.setData({
        currentGoods: this.data.currentGoods.concat(res.data.result)
      })
    }
  },
  async onCategoryClick(e) {
    const idx = e.target.dataset.idx
    if (idx == this.data.activeCategory) {
      this.setData({
        scrolltop: 0,
      })
      return
    }
    const categorySelected = this.data.firstCategories[idx]
    this.setData({
      page: 1,
      secondCategoryId: '',
      activeCategory: idx,
      categorySelected,
      scrolltop: 0
    });
    this.getGoodsList();
  },
  onSecondCategoryClick(e) {
    const idx = e.detail.index
    let secondCategoryId = ''
    if (idx) {
      // 点击了具体的分类
      secondCategoryId = this.data.categorySelected.childs[idx-1].id
    }
    this.setData({
      page: 1,
      secondCategoryId
    });
    this.getGoodsList();
  },
  bindconfirm(e) {
    this.setData({
      inputVal: e.detail
    })
    wx.navigateTo({
      url: '/pages/goods/list?name=' + this.data.inputVal,
    })
  },
  onShareAppMessage() {    
    return {
      title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
      path: '/pages/index/index?inviter_id=' + wx.getStorageSync('uid')
    }
  },
  onShareTimeline() {    
    return {
      title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
      query: '',
      imageUrl: this.data.goodsDetail.basicInfo.pic
    }
  },
  onShow() {
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        TOOLS.showTabBarBadge()
      } else {
        getApp().loginOK = () => {
          TOOLS.showTabBarBadge()
        }
      }
    })
    const _categoryId = wx.getStorageSync('_categoryId')
    wx.removeStorageSync('_categoryId')
    if (_categoryId) {
      this.data.categorySelected.id = _categoryId
      this.categories();
    }
  }
  goodsGoBottom() {
    this.data.page++
    this.getGoodsList()
  },
  searchscan() {
    wx.scanCode({
      scanType: ['barCode', 'qrCode', 'datamatrix', 'pdf417'],
      success: res => {
        this.setData({
          inputVal: res.result
        })
        wx.navigateTo({
          url: '/pages/goods/list?name=' + res.result,
        })
      }
    })
  }
})
