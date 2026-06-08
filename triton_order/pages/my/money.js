const CLOUDFUNC = require('../../utils/cloud.js');

Page({
  data: {
    userID: '',
    isBanker: false,
    bills: [],
    yearMonth: '', // 当前筛选月份，空表示全部
    monthOptions: [], // 可选月份列表
    monthIndex: 0, // 当前选中索引

    // 玩家账单汇总
    totalIncome: 0,
    totalPaid: 0,

    // 寄售商家账单汇总
    totalAmount: 0,
    totalServiceFee: 0,

    loading: true
  },

  onLoad() {
    const userID = wx.getStorageSync('userID');
    const isBanker = wx.getStorageSync('isBanker');
    this.setData({
      userID: userID,
      isBanker: isBanker
    });
    this.buildMonthOptions();
    this.loadBills();
  },

  // 构建最近12个月的可选列表
  buildMonthOptions() {
    const now = new Date();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ label, value });
    }
    months.unshift({ label: '全部', value: '' });
    this.setData({
      monthOptions: months,
      monthIndex: 0
    });
  },

  // 月份切换
  onMonthChange(e) {
    const index = e.detail.value;
    const option = this.data.monthOptions[index];
    this.setData({
      monthIndex: index,
      yearMonth: option.value
    });
    this.loadBills();
  },

  // 加载账单
  loadBills() {
    this.setData({ loading: true });
    const params = { userID: this.data.userID };
    if (this.data.yearMonth) {
      params.yearMonth = this.data.yearMonth;
    }

    // 根据用户身份调用不同的云函数
    const cloudFuncName = this.data.isBanker ? 'getBankerBills' : 'getBills';

    CLOUDFUNC.callCloudFunction(cloudFuncName, params).then(res => {
      if (res && res.bills) {
        if (this.data.isBanker) {
          // 寄售商家账单
          this.setData({
            bills: res.bills,
            totalAmount: res.totalAmount || 0,
            totalServiceFee: res.totalServiceFee || 0,
            loading: false
          });
        } else {
          // 玩家账单
          this.setData({
            bills: res.bills,
            totalIncome: res.totalIncome || 0,
            totalPaid: res.totalPaid || 0,
            loading: false
          });
        }
      } else {
        this.setData({
          bills: [],
          totalIncome: 0,
          totalPaid: 0,
          totalAmount: 0,
          totalServiceFee: 0,
          loading: false
        });
      }
    }).catch(err => {
      console.error('获取账单失败', err);
      this.setData({
        bills: [],
        totalIncome: 0,
        totalPaid: 0,
        totalAmount: 0,
        totalServiceFee: 0,
        loading: false
      });
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  }
});
