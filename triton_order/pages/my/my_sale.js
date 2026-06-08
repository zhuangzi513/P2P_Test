const CLOUDFUNC = require('../../utils/cloud.js');
const ORDER_STATUS = require('../../utils/order_status.js');

const T0 = ORDER_STATUS.ORDERSTATUS_ENUM0;

const TAB = {
  ONSALE: 'onsale',
  SHIPPING: 'shipping',
  PENDING: 'pending',
  DONE: 'done'
};

Page({
  data: {
    activeTab: TAB.ONSALE,
    orders: [],
    allOrders: [],
    loading: true,
    // 降价弹窗
    showPriceModal: false,
    priceItem: null,
    newPrice: ''
  },

  onLoad() {
    this.fetchOrders();
  },

  onShow() {
    if (this.data.allOrders.length > 0) {
      this.fetchOrders();
    }
  },

  async fetchOrders() {
    wx.showLoading({ title: '加载中...' });
    try {
      const userID = wx.getStorageSync('userID');
      console.log('userID:', userID);
      const res = await CLOUDFUNC.callCloudFunction('orderStatics', {
        userID: Number(userID),
        isBanker: false,
        orderType: '0',
        pageNo: 1,
        pageSize: 500
      });

      console.log('res:', res);
      let orders = [];
      if (res && res.data && res.data.orders) {
        orders = res.data.orders;
      } else if (res && res.orders) {
        orders = res.orders;
      }

      console.log('all_orders:', orders);

      // 无需筛选有效状态，交由 filterOrders 按 Tab 分类管理
      // 只提取 order 文档自有字段，不额外查询 goods / banker
      const processed = orders.map(order => {
        const details = order.order_details || {};
        const status = details.order_status;
        const orderServiceFee = parseFloat(order.service_fee) || 0;
        const orderPayable = parseFloat(order.payable_amount) || 0;
        const price = order.price || Number(orderServiceFee + orderPayable) || 0;

        return {
          order_id: order.order_id,
          goods_id: order.goods_id,
          banker_id: order.banker_id,
          owner_id: order.owner_id,
          // 订单状态
          order_status: status,
          // 价格信息（来自 order 文档）
          goods_price: price,
          goods_price_str: price.toFixed(2),
          service_fee: orderServiceFee.toFixed(2),
          settle_price: orderPayable.toFixed(2),
          payable_amount: orderPayable.toFixed(2),
          // 缩略图（order_details 中可能存有）
          thumbnail: details.thumbnail || '',
          goods_name: details.goods_name || '',
          // 原始 order_details 保留，供详情页使用
          order_details: details
        };
      });

      console.log('processed:', processed);
      this.setData({ allOrders: processed, loading: false });
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
      case TAB.ONSALE:
        // 寄售中: SEND0（已发快递给商家）/ RECVED0（商家已收货）/ ONSALE（平台展示中）
        filtered = this.data.allOrders.filter(o =>
          o.order_status === T0.SEND0 || o.order_status === T0.RECVED0 || o.order_status === T0.ONSALE
        );
        break;
      case TAB.SHIPPING:
        // 待发快递: CONFIRM（商家已提供地址，玩家未填快递单号）
        filtered = this.data.allOrders.filter(o => o.order_status === T0.CONFIRM);
        break;
      case TAB.PENDING:
        // 待结算: 已售出/已付款，但平台还未结算给卖家
        filtered = this.data.allOrders.filter(o =>
          o.order_status === T0.SELLED || o.order_status === T0.PAYED
        );
        break;
      case TAB.DONE:
        // 已完成: 已结算
        filtered = this.data.allOrders.filter(o => o.order_status === T0.DONE);
        break;
      default:
        filtered = this.data.allOrders;
    }
    this.setData({ orders: filtered });
  },

  // 点击订单项
  onOrderTap(e) {
    const item = e.currentTarget.dataset.item;
    // 跳转寄售单详情
    if (item.order_id) {
      wx.navigateTo({
        url: `/pages/orders/order-type0-details?id=${item.order_id}`,
      });
    }
  },

  // 降价按钮
  onLowerPrice(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      showPriceModal: true,
      priceItem: item,
      newPrice: ''
    });
  },

  onPriceInput(e) {
    this.setData({ newPrice: e.detail.value });
  },

  hidePriceModal() {
    console.log('hidePriceModal called');
    this.setData({ showPriceModal: false, priceItem: null, newPrice: '' });
  },

  async confirmLowerPrice() {
    const item = this.data.priceItem;
    const newPrice = parseFloat(this.data.newPrice);

    if (!item) return;
    if (isNaN(newPrice) || newPrice <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' });
      return;
    }
    if (newPrice >= item.goods_price) {
      wx.showToast({ title: '降价金额必须低于原期望售价', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '更新中...' });
    try {
      const res1 = await CLOUDFUNC.callCloudFunction('updateGoodsInfo', {
        goodsID: item.goods_id,
        goodsInfo: { price: newPrice.toString() }
      });
      const res2 = await CLOUDFUNC.callCloudFunction('updateOrderInfo', {
        orderID: item.order_id,
        field: 'price',
        value: newPrice
      });
      wx.hideLoading();
      if (res1 && res1.success && res2 && res2.success) {
        wx.showToast({ title: '降价成功', icon: 'success' });
        this.hidePriceModal();
        // 刷新列表
        setTimeout(() => this.fetchOrders(), 200);
      } else {
        wx.showToast({ title: res1.message || '降价失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('updateGoodsInfo failed:', err);
      wx.showToast({ title: '降价失败', icon: 'none' });
    }
    this.hidePriceModal();
  }
});
