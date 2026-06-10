const CLOUDFUNC = require('../../utils/cloud.js');
const ORDER_STATUS = require('../../utils/order_status.js');

const T0 = ORDER_STATUS.ORDERSTATUS_ENUM0;

// Tab 定义：每个 Tab 对应一组 type0 订单状态
const TABS = [
  { key: 'all',     label: '全部',   statuses: null },
  { key: 'confirm', label: '待确认', statuses: [T0.CREATED, T0.INIT] },
  { key: 'ship',    label: '发货中', statuses: [T0.CONFIRM, T0.SEND0, T0.RECVED0] },
  { key: 'onsale',  label: '寄售中', statuses: [T0.ONSALE, T0.HITTED] },
  { key: 'sold',    label: '待结算', statuses: [T0.SELLED, T0.PAYED] },
  { key: 'done',    label: '已完成', statuses: [T0.DONE] },
  { key: 'other',   label: '其他',   statuses: [T0.CANCELLED, T0.SEND1, T0.RECVED1, T0.CLOSE] }
];

Page({
  data: {
    tabs: TABS,
    activeTab: 'all',
    allOrders: [],
    orders: [],
    loading: true
  },

  onLoad() {
    this.fetchOrders();
  },

  onShow() {
    if (this.data.allOrders.length > 0) {
      this.fetchOrders();
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.filterOrders();
  },

  async fetchOrders() {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await CLOUDFUNC.callCloudFunction('orderStatics', {
        userID: wx.getStorageSync('userID'),
        isBanker: false,
        orderType: '0',
        pageNo: 1,
        pageSize: 500
      });

      let orders = [];
      if (res && res.data && res.data.orders) {
        orders = res.data.orders;
      } else if (res && res.orders) {
        orders = res.orders;
      }

      // 处理每条订单：提取状态、附加状态文本
      const processed = orders.map(order => {
        const details = order.order_details || {};
        const status = details.order_status != null ? details.order_status : order.order_status;
        const price = Number(details.price) || 0;
        const serviceFee = parseFloat(order.service_fee) || 0;
        const payableAmount = parseFloat(order.payable_amount) || 0;

        return {
          order_id: order.order_id,
          goods_id: order.goods_id,
          banker_id: order.banker_id,
          owner_id: order.owner_id,
          order_type: order.order_type || 0,
          order_status: status,
          status_text: ORDER_STATUS.getStatusText0(status),
          goods_price: price,
          goods_price_str: price.toFixed(2),
          service_fee: serviceFee.toFixed(2),
          settle_price: payableAmount.toFixed(2),
          thumbnail: details.thumbnail || '',
          goods_name: details.goods_name || '',
          order_details: details
        };
      });

      this.setData({ allOrders: processed, loading: false });
      this.filterOrders();
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('fetchOrders failed:', err);
      this.setData({ loading: false });
    }
  },

  filterOrders() {
    const tab = this.data.activeTab;
    let filtered;

    if (tab === 'all') {
      filtered = this.data.allOrders;
    } else {
      const tabDef = TABS.find(t => t.key === tab);
      const statusSet = tabDef ? new Set(tabDef.statuses) : null;
      filtered = statusSet
        ? this.data.allOrders.filter(o => statusSet.has(o.order_status))
        : this.data.allOrders;
    }

    this.setData({ orders: filtered });
  },

  goOrderDetail(e) {
    const item = e.currentTarget.dataset.item;
    const orderId = item.order_id;
    if (!orderId) {
      wx.showToast({ title: '订单ID为空', icon: 'none' });
      return;
    }
    const url = '/pages/orders/order-type0-details?id=' + orderId;
    wx.navigateTo({ url });
  }
});
