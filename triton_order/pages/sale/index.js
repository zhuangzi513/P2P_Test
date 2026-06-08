const CLOUDFUNC = require('../../utils/cloud.js');

Page({
  data: {
    bankers: [],
    loading: true
  },

  onLoad() {
    this.loadBankers();
  },

  onShow() {
    // 每次显示时刷新 banker 列表
    if (this.data.bankers.length === 0) {
      this.loadBankers();
    }
  },

  async loadBankers() {
    this.setData({ loading: true });
    try {
      const res = await CLOUDFUNC.callCloudFunction('bankersList', {
        userID: wx.getStorageSync('userID')
      });
      let bankers = res && res.bankers ? res.bankers : [];
      // 只取前6个 banker
      bankers = bankers.slice(0, 6);
      this.setData({
        bankers: bankers,
        loading: false
      });
    } catch (err) {
      console.error('loadBankers error:', err);
      this.setData({ loading: false });
    }
  },

  // 选中某个 banker 的卡片，跳转到 order-type0-details 页面
  onCardTap(e) {
    const bankerID = e.currentTarget.dataset.userid;
    if (!bankerID) return;
    //CLOUDFUNC.callCloudFunction('newOrder',
    //{
    //  bankerID: bankerID,
    //  ownerID: wx.getStorageSync('userID'),
    //  orderType:0,
    //  senderAddr: wx.getStorageSync('userAddr')
    //}).then(res => {
    //console.log(res);
    //  if (res && res.orderId) {
    //    wx.navigateTo({
    //      url: '/pages/orders/order-type0-details?is_new=true&banker_id=' + bankerID + '&id=' + res.orderId,
    //    });
    //  }
    //}).catch(err => {
    //  wx.showToast({ title: '创建订单失败', icon: 'none' });
    //});
    wx.navigateTo({
      url: '/pages/orders/order-type0-details?is_new=true&banker_id=' + bankerID,
    });
  },

  onShareAppMessage() {
    return {
      title: '寄售 - ' + wx.getStorageSync('userName'),
      path: '/pages/sale/index'
    };
  }
});
