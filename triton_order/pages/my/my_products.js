const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const CLOUDFUNC = require('../../utils/cloud.js');
const ORDER_STATUS = require('../../utils/order_status.js');

const APP = getApp()

// 商品在库存中的状态标识
const GOODS_TAB = {
  ALL: 'all',
  ONSALE: 'onsale',
  ORDERED: 'ordered',
  PAID: 'paid',
  SHIPPED: 'shipped',
  CONFIRMED: 'confirmed'
}

Page({
  data: {
    userID:'',
    inputVal: "",
    selectCurrent: 0,
    goods: [],           // 所有商品（含状态）
    allGoods: [],         // 原始商品列表
    loadingMoreHidden: true,
    pageSize: 20,
    curPage: 1,
    total: -1,
    activeTab: 'all'     // 当前筛选Tab
  },
  toModifyTap: function(e) {
    console.log(e);
    const goodsId = e.currentTarget.dataset.id
    const item = this.data.allGoods.find(g => g.goods_id == goodsId)
    if (!item) {
      wx.navigateTo({ url: `/pages/my/edit_product?id=${goodsId}` })
      return
    }

    // 已付款 → 跳转商品详情页
    if (item._stockStatus === GOODS_TAB.ORDERED) {
      wx.navigateTo({
        url: `/pages/goods-details/index?id=${goodsId}`,
      })
      return
    }
    // 寄售中 → 跳转寄售单详情（只能降价，其他字段不可修改）
    if (item._stockStatus === GOODS_TAB.ONSALE && item._orderId0) {
      wx.navigateTo({
        url: `/pages/orders/order-type0-details?id=${item._orderId0}&editPriceOnly=1`,
      })
      return
    }
    // type1 买单（待快递/待买家确认/待结算）→ 跳转买单详情
    if (item._orderId1) {
      wx.navigateTo({
        url: `/pages/orders/order-type1-details?id=${item._orderId1}`,
      })
      return
    }
    // type0 寄售单（兜底）→ 跳转寄售单详情
    if (item._orderId0) {
      wx.navigateTo({
        url: `/pages/orders/order-type0-details?id=${item._orderId0}`,
      })
      return
    }
    // 无关联订单 → 跳转编辑商品页
    wx.navigateTo({
      url: `/pages/my/edit_product?id=${goodsId}`,
    })
  },
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.filterGoods()
  },
  filterGoods() {
    const tab = this.data.activeTab
    if (tab === GOODS_TAB.ALL) {
      this.setData({ goods: this.data.allGoods })
      return
    }
    const filtered = this.data.allGoods.filter(g => g._stockStatus === tab)
    this.setData({ goods: filtered })
  },
  onLoad: function(e) {
    this.getMyGoodsList(wx.getStorageSync('userID'), false);
  },
  onShow: function(e){
    this.setData({
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject 
    })
  },
  /**
   * 根据订单状态推导商品在库存中的状态
   * type0 入库单状态: CREATED:-1 INIT:0 CONFIRM:1 SEND0:2 RECVED0:3 ONSALE:4 HITTED:5 SELLED:6 PAYED:7 DONE:8
   * type1 出库单状态: CREATED:-1 AGREED:0 CONFIRM:1 PAYED:2 SENDTORECVER:3 RECVED:4 DONE:5
   */
  deriveStockStatus(type0Order, type1Order) {
    const T0 = ORDER_STATUS.ORDERSTATUS_ENUM0
    const T1 = ORDER_STATUS.ORDERSTATUS_ENUM1

    // 优先看 type1（出库/购买）订单
    if (type1Order) {
      const s1 = type1Order.order_status
      if (s1 === T1.CONFIRM) return GOODS_TAB.ORDERED      // 买家已下单待付款
      if (s1 === T1.PAYED) return GOODS_TAB.PAID            // 买家已付款待快递
      if (s1 === T1.SENDTORECVER) return GOODS_TAB.SHIPPED  // 已快递待买家确认
      if (s1 === T1.RECVED) return GOODS_TAB.CONFIRMED      // 买家已确认待结算
      // DONE/CANCELLED 等终态 — 此商品不再出现在筛选列表中，但仍保留在全部中
    }

    // 看 type0（寄售/入库）订单
    if (type0Order) {
      const s0 = type0Order.order_status
      if (s0 === T0.ONSALE) return GOODS_TAB.ONSALE        // 产品寄售中
    }

    // 其他情况（无关联订单、终态等）归入寄售中
    return GOODS_TAB.ONSALE
  },
  async getMyGoodsList(myUserId, append) {
    wx.showLoading({ title: '' })
    const userID = wx.getStorageSync('userID')

    // 并行请求：商品列表 + 入库单 + 出库单
    const [goodsRes, orderRes0, orderRes1] = await Promise.all([
      CLOUDFUNC.callCloudFunction('goodsStatics', { userID: userID, pageSize: 500 }),
      CLOUDFUNC.callCloudFunction('orderStatics', { userID: userID, isBanker: true, orderType: '0', pageSize: 500 }),
      CLOUDFUNC.callCloudFunction('orderStatics', { userID: userID, isBanker: true, orderType: '1', pageSize: 500 })
    ])
    wx.hideLoading()

    if (!goodsRes || !goodsRes.goods) {
      this.setData({ loadingMoreHidden: false })
      return
    }

    // 构建 goods_id → order 映射（含 order_id 用于跳转）
    const orderMap0 = {}
    const orderMap1 = {}
    if (orderRes0 && orderRes0.orders) {
      for (const o of orderRes0.orders) {
        const gid = o.goods_id
        if (gid && gid > 0) {
          orderMap0[gid] = { order_status: o.order_status, order_type: 0, order_id: o.id || o.order_id }
        }
      }
    }
    if (orderRes1 && orderRes1.orders) {
      for (const o of orderRes1.orders) {
        const gid = o.goods_id
        if (gid && gid > 0) {
          // 保留最新的 type1 订单（若有多个，取 status 最靠后的）
          if (!orderMap1[gid] || o.order_status > orderMap1[gid].order_status) {
            orderMap1[gid] = { order_status: o.order_status, order_type: 1, order_id: o.id || o.order_id }
          }
        }
      }
    }

    // 为每个商品标注状态并附加状态文本
    const goodsWithStatus = goodsRes.goods.map(item => {
      const gid = item.goods_id
      const stockStatus = this.deriveStockStatus(orderMap0[gid], orderMap1[gid])
      let statusText = ''
      switch (stockStatus) {
        case GOODS_TAB.ONSALE: statusText = '寄售中'; break
        case GOODS_TAB.ORDERED: statusText = '已付款'; break
        case GOODS_TAB.PAID: statusText = '待快递'; break
        case GOODS_TAB.SHIPPED: statusText = '待买家确认'; break
        case GOODS_TAB.CONFIRMED: statusText = '待结算'; break
      }
      return {
        ...item,
        _stockStatus: stockStatus,
        _statusText: statusText,
        _orderId0: (orderMap0[gid] && orderMap0[gid].order_id) || null,
        _orderId1: (orderMap1[gid] && orderMap1[gid].order_id) || null
      }
    })

    this.setData({
      allGoods: goodsWithStatus,
      loadingMoreHidden: true,
      total: goodsRes.total
    })
    this.filterGoods()
  },
  onPullDownRefresh: function() {
    this.setData({ curPage: 1 })
    this.getMyGoodsList(wx.getStorageSync('userID'), false)
    wx.stopPullDownRefresh()
  },
  onReachBottom() {
    // 已全部加载，无需分页
  },
})
