const AUTH = require('../../utils/auth')
Page({
  data: {
    checked: false,
    showInviteModal: false,
    inviteCode: '',
    inviteError: ''
  },
  onLoad(options) {
  },
  onShow() {
  },
  async onBankerTap() {
    // 先尝试空邀请码登录（已注册商家无需邀请码）
    wx.showLoading({ title: '登录中...', mask: true });
    const result = await AUTH.tryLoginAsBanker('');
    wx.hideLoading();
    if (result.success) {
      // 已注册商家，直接进入
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    // 未注册，弹出邀请码输入框
    this.setData({
      showInviteModal: true,
      inviteCode: '',
      inviteError: ''
    });
  },
  onInviteInput(e) {
    this.setData({
      inviteCode: e.detail.value,
      inviteError: ''
    });
  },
  noop() {},
  closeInviteModal() {
    this.setData({ showInviteModal: false });
  },
  async submitInviteCode() {
    const code = this.data.inviteCode.trim();
    if (!code) {
      this.setData({ inviteError: '请输入邀请码' });
      return;
    }
    this.setData({ inviteError: '', showInviteModal: false });
    const res = await AUTH.loginAsBanker(code);
    if (res && res.token) {
      wx.reLaunch({
        url: '/pages/index/index',
      });
    }
  },
  async loginAsBanker() {
    const res = await AUTH.loginAsBanker()
    if (res && res.token) {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  },
  async loginAsCustomer() {
    const res = await AUTH.loginAsCustomer()
    console.log('res', res)
    if (res && res.token) {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  }
})
