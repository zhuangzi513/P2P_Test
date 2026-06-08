const CLOUDFUNC = require('../../utils/cloud.js');
const ORDER_STATUS = require('../../utils/order_status.js');

const T1 = ORDER_STATUS.ORDERSTATUS_ENUM1;

const TAB = {
  PAID: 'paid',
  SHIPPED: 'shipped',
  DONE: 'done'
};

Page({
  data: {
    activeTab: TAB.PAID,
    orders: [],
    allOrders: [],
    loading: true
  },

  onLoad() {
    this.fetchOrders();
  },

  onShow() {
    // 从详情页返回时刷新
    if (this.data.allOrders.length > 0) {
      this.fetchOrders();
    }
  },

  async fetchOrders() {
    wx.showLoading({ title: '加载中...' });
    try {
      const userID = wx.getStorageSync('userID');
      const res = await CLOUDFUNC.callCloudFunction('orderStatics', {
        userID: userID,
        isBanker: false,
        orderType: '1',
        pageNo: 1,
        pageSize: 500
      });

      let orders = [];
      if (res && res.orders) {
        orders = res.orders;
      } else if (res && res.data && res.data.orders) {
        orders = res.data.orders;
      }

      // 并行获取每个订单对应的商品信息
      const ordersWithGoods = await Promise.all(
        orders.map(async (order) => {
          const goodsId = order.goods_id;
          let goodsInfo = null;
          if (goodsId) {
            try {
              const goodsRes = await CLOUDFUNC.callCloudFunction('getGoodsInfo', { goodsID: goodsId });
              const goodsList = goodsRes.data?.goodsInfo || goodsRes.goodsInfo;
              if (goodsList && goodsList.length > 0) {
                const gi = goodsList[0].goods_info || goodsList[0];
                goodsInfo = {
                  name: gi.goodsName || gi.name || '',
                  price: gi.price || '',
                  thumbnail: (gi.imageList && gi.imageList[0]) || (gi.pic) || ''
                };
              }
            } catch (e) {
              console.error('获取商品信息失败:', goodsId, e);
            }
          }
          return {
            ...order,
            order_id: order.order_id || order.id,
            _goodsInfo: goodsInfo || { name: '未知商品', price: '', thumbnail: '' }
          };
        })
      );

      // 筛选有效状态（排除取消/关闭等）
      // order_status 嵌套在 order_details 中
      const validOrders = ordersWithGoods.filter(o => {
        const s = (o.order_details && o.order_details.order_status);
        return s === T1.PAYED || s === T1.SENDTORECVER || s === T1.RECVED || s === T1.DONE;
      });

      this.setData({
        allOrders: validOrders,
        loading: false
      });
      this.filterOrders();
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('fetchOrders failed:', err);
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.filterOrders();
  },

  filterOrders() {
    const tab = this.data.activeTab;
    let filtered;
    switch (tab) {
      case TAB.PAID:
        filtered = this.data.allOrders.filter(o => (o.order_details || {}).order_status === T1.PAYED);
        break;
      case TAB.SHIPPED:
        filtered = this.data.allOrders.filter(o => (o.order_details || {}).order_status === T1.SENDTORECVER);
        break;
      case TAB.DONE:
        filtered = this.data.allOrders.filter(o => {
          const s = (o.order_details || {}).order_status;
          return s === T1.RECVED || s === T1.DONE;
        });
        break;
      default:
        filtered = this.data.allOrders;
    }
    this.setData({ orders: filtered });
  },

  onOrderTap(e) {
    const item = e.currentTarget.dataset.item;
    const orderId = item.order_id;
    const goodsId = item.goods_id;
    const status = (item.order_details || {}).order_status;

    // 已付款 → 跳转商品详情页
    if (status === T1.PAYED) {
      wx.navigateTo({
        url: `/pages/goods-details/index?id=${goodsId}`,
      });
      return;
    }
    // 待确认 / 已完成 → 跳转买单详情页
    if (status === T1.SENDTORECVER || status === T1.RECVED || status === T1.DONE) {
      wx.navigateTo({
        url: `/pages/orders/order-type1-details?id=${orderId}`,
      });
      return;
    }
  }
});
