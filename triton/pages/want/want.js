Page({
  data: {
    title: 'I WANT IT',
    goodsDetail: {},
    showCards: false,
    offerPrice: '',
    paymentMethods: ['A', 'B', 'C'],
    enjoymentMethods: ['A', 'B', 'C'],
    paymentIndex: 0,
    enjoymentIndex: 0
  },

  onLoad(options) {
    this.loadInitialData();
  },

  loadInitialData() {
    
    this.setData({ tableData, cards });
  },

  onShowCards() {
    this.setData({ showCards: true });
  },

  onOfferPriceInput(e) {
    this.setData({ offerPrice: e.detail.value });
  },

  onPaymentChange(e) {
    this.setData({ paymentIndex: e.detail.value });
  },

  onEnjoymentChange(e) {
    this.setData({ enjoymentIndex: e.detail.value });
  },

  sendToA() {
  },

  sendToB() {
  }
});
