const CLOUDFUNC = require('../../utils/cloud.js');

Page({
  data: {
    bankers: []
  },

  onLoad() {
    this.loadBankers();
  },

  async loadBankers() {
    wx.showLoading({ title: '' });
    const res = await CLOUDFUNC.callCloudFunction('bankersList', {
      userID: wx.getStorageSync('userID')
    });
    wx.hideLoading();

    if (res && res.bankers) {
      this.setData({
        bankers: res.bankers
      });
    } else {
      console.log('empty bankers');
      this.setData({ bankers: [] });
    }
  },

  tabClick(e) {
    const userId = e.currentTarget.dataset.userid;
    if (userId) {
      wx.navigateTo({
        url: '/pages/goods/sublist?banker_id=' + userId,
      });
    }
  }
});
