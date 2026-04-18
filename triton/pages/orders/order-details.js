const { callCloudFunction } = require('../../utils/cloud.js');

Page({
    data:{
      orderId:0,
      goodsList:[]
    },
    onLoad:function(e){
      this.setData({
        orderId: e.id,
      })
    },
    onShow() {
      this.orderDetail()
    },
    async orderDetail() {
      if (!this.data.orderId) {
        return
      }
      wx.showLoading({
        title: '',
      })
      const res = await callCloudFunction('orderDetail', { userID:wx.getStorageSync('userID'), orderID:this.data.orderId})
      wx.hideLoading()
      if (res.code != 0) {
        wx.showModal({
          content: res.msg,
          showCancel: false
        })
        return
      }
      if (res.data.orderLogisticsShippers) {
        res.data.orderLogisticsShippers.forEach(ele => {
          if (ele.traces) {
            ele.tracesArray = JSON.parse (ele.traces)
            if (ele.tracesArray && ele.tracesArray.length > 0) {
              ele.tracesLast = ele.tracesArray[ele.tracesArray.length - 1].AcceptStation + '\n' + ele.tracesArray[ele.tracesArray.length - 1].AcceptTime
            }
          }
        })
      }
      this.setData({
        orderDetail: res.data,
      })
    },
    wuliuDetailsTap:function(e){
      var orderId = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: "/pages/wuliu/index?id=" + orderId
      })
    },
    confirmBtnTap:function(e){
      let that = this;
      let orderId = this.data.orderId;
      wx.showModal({
          title: 'CONFIRM GOT IT？',
          content: '',
          success: function(res) {
            if (res.confirm) {
              callCloudFunction('orderDelivery', {userID: wx.getStorageSync('uerID'), orderID:orderId}).then(result=> {
                if (result.code == 0) {
                  that.orderDetail()
                }
              })

            }
          }
      })
    }
})
