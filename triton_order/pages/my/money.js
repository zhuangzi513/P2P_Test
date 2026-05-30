const CLOUDFUNC = require('../../utils/cloud.js');

Page({
  data: {
    userID: '',
    bills: [],
    loadingMoreHidden: true,
    totalAmount: 0
  },
  onLoad() {
    this.setData({
      userID: wx.getStorageSync('userID')
    });
    this.getBills();
  },
  getBills() {
    CLOUDFUNC.callCloudFunction('getBills', { userID: this.data.userID }).then(res => {
      if (res && res.bills) {
        this.setData({
          bills: res.bills,
          totalAmount: res.totalAmount || 0
        });
      }
    }).catch(err => {
      console.error('获取账单失败', err);
    });
  }
});
