const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
const CONFIG = require('../../config.js')
const CLOUDFUNC = require('../../utils/cloud.js');
const ORDERSTATUS = require('../../utils/order_status.js');

import Poster from 'wxa-plugin-canvas/poster/poster'

Page({
  data: {
    userID: "",
    goodsID: "",
    //goodsIDb: "",
    ownerID: "",
    bankerID: "",
    createTabs: false,
    goodsDetail: {},
    goodsInfo: {
      color: '',
      sizeX: '',
      sizeY: '',
      sizeZ: '',
      price: '',
      description: '',
      imageList: [],
      videoList: []
    },
    selectSizePrice: 0,
    selectSizeOPrice: 0,
    goodsStatus: 0,
    faved: false,
    orderList: [],
    orderLoading: true
  },
  onLoad(e) {
    console.log('goods-details onLoad params:', e);
    if (e && e.inviter_id) {
      wx.setStorageSync('referrer', e.inviter_id)
    }

    if (e && e.scene) {
      const scene = decodeURIComponent(e.scene)
      if (scene && scene.split(',').length >= 2) {
        e.id = scene.split(',')[0]
        wx.setStorageSync('referrer', scene.split(',')[1])
      }
    }
    
    const goodsID = e.id || e.goodsId || e.goods_id || '';
    console.log('goods-details will fetch goodsID:', goodsID);
    this.getGoodsDetail(goodsID)
    this.getOrderList(goodsID)
  },
  onShow() {
  },
  async goodsFavCheck() {
    const res = await CLOUDFUNC.callCloudFunction('goodsFavCheck', { userID: wx.getStorageSync('userID'), goodsID: this.data.goodsID})
    if (res && res.faved) {
      this.setData({
        faved: true
      })
    } else {
      this.setData({
        faved: false
      })
    }
  },
  async addFav() {
        if (this.data.faved) {
          const res = await CLOUDFUNC.callCloudFunction('goodsFavDelete', {userID: wx.getStorageSync('userID'), goodID: this.data.goodsID});
          this.goodsFavCheck()
        } else {
          const res = await CLOUDFUNC.callCloudFunction('goodsFavPut', {userID: wx.getStorageSync('userID'), goodID: this.data.goodsID});
          this.goodsFavCheck()
        }
  },
  async getGoodsDetail(goodsID) {
    if (!goodsID) {
      console.error('goodsID is empty!');
      wx.showToast({ title: '商品ID无效', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '加载中...' });
    try {
      console.log('calling getGoodsInfo with goodsID:', goodsID);
      const res = await CLOUDFUNC.callCloudFunction('getGoodsInfo', {userID : wx.getStorageSync('userID'),  goodsID: goodsID});
      console.log('getGoodsInfo response:', res);
      wx.hideLoading();
      if (res && res.goodsInfo && res.goodsInfo.length > 0) {
        const goodsData = res.goodsInfo[0];
        console.log('goodsData:', goodsData);
        this.setData({
          userID: wx.getStorageSync('userID'),
          goodsID: goodsID,
          goodsDetail: goodsData,
          goodsInfo: goodsData.goods_info || {
            color: '',
            sizeX: '',
            sizeY: '',
            sizeZ: '',
            price: '',
            description: '',
            imageList: [],
            videoList: []
          },
          ownerID: goodsData.owner_id,
          bankerID: goodsData.banker_id
          //goodsIDb: goodsData.goods_id
        });
        console.log('goodsInfo set:', this.data.goodsInfo);
        this.goodsFavCheck();
      } else {
        console.log('goodsInfo empty or not found');
        wx.showToast({
          title: '商品信息获取失败',
          icon: 'none',
        })
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: '获取商品信息失败',
        icon: 'none',
      })
      console.error(err);
    }
  },
  async getOrderList(goodsID) {
    if (!goodsID) return;
    this.setData({ orderLoading: true });
    try {
      const res = await CLOUDFUNC.callCloudFunction('queryOrdersByGoods', { goodsID: goodsID });
      if (res && res.orders) {
        // 当前用户是否为商品所有者
        const isOwner = this.data.userID && this.data.ownerID && String(this.data.userID) === String(this.data.ownerID);

        let filteredOrders = res.orders;
        if (isOwner) {
          // owner 可以看到所有寄售单 + order_status == 0 的买单
          filteredOrders = res.orders.filter(order => order.order_type === 0 || (order.order_type === 1 && order.order_status === 0));
        }

        const orders = filteredOrders.map(order => {
          // 使用 order_status 字段获取状态（数据库字段名为 order_status）
          const orderStatus = order.order_status;
          const statusText = order.order_type === 0
            ? ORDERSTATUS.getStatusText0(orderStatus)
            : ORDERSTATUS.getStatusText1(orderStatus);
          // 格式化创建时间
          let createTime = '';
          if (order.order_details && order.order_details.time_created) {
            const d = new Date(order.order_details.time_created);
            const Y = d.getFullYear();
            const M = String(d.getMonth() + 1).padStart(2, '0');
            const D = String(d.getDate()).padStart(2, '0');
            const h = String(d.getHours()).padStart(2, '0');
            const m = String(d.getMinutes()).padStart(2, '0');
            createTime = `${Y}-${M}-${D} ${h}:${m}`;
          }
          // 获取订单价格
          let orderPrice = '';
          if (order.order_details && order.order_details.price !== undefined) {
            orderPrice = order.order_details.price;
          }
          return {
            ...order,
            statusText: statusText || '未知',
            orderTypeLabel: order.order_type === 0 ? '寄售单' : '买单',
            createTime: createTime,
            orderStatus: orderStatus,
            orderPrice: orderPrice
          };
        });
        this.setData({ orderList: orders, orderLoading: false });
      } else {
        this.setData({ orderList: [], orderLoading: false });
      }
    } catch (err) {
      console.log('getOrderList failed:', err);
      this.setData({ orderList: [], orderLoading: false });
    }
  },
  goOrderDetail(e) {
    const orderId = e.currentTarget.dataset.orderid;
    const orderType = e.currentTarget.dataset.ordertype;
    if (orderType === 0) {
      wx.navigateTo({
        url: '/pages/orders/order-type0-details?id=' + orderId,
      });
    } else {
      wx.navigateTo({
        url: '/pages/orders/order-type1-details?id=' + orderId,
      });
    }
  },
  onShareAppMessage() {
    let _data = {
      title: '商品详情',
      path: '/pages/goods-details/index?id=' + this.data.goodsID + '&inviter_id=' + this.data.userID,
      success: function (res) {
	wx.showToast({
          title: '分享成功',
          icon: 'none',
        })
      },
      fail: function (res) {
	wx.showToast({
          title: '分享失败',
          icon: 'none',
        })
      }
    }
    return _data
  },
  onShareTimeline() {
    let title = this.data.goodsInfo.color || '商品详情'
    let query = 'id=' + this.data.goodsID + '&inviter_id=' + wx.getStorageSync('userID')
    return {
      title,
      query,
      imageUrl: (this.data.goodsInfo.imageList && this.data.goodsInfo.imageList[0]) ? this.data.goodsInfo.imageList[0].url : ''
    }
  },
  async likeIt() {
  },

  previewImages(e) {
    const url = e.currentTarget.dataset.url
    const urls = this.data.goodsInfo.imageList.map(item => item.url)
    wx.previewImage({
      current: url,
      urls
    })
  },
  backToHome() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  tobuy: function () {
    const _ownerID = this.data.ownerID;
    const _buyerID = this.data.userID;
    const _goodsID = this.data.goodsID;
    const _bankerID = this.data.bankerID;
    const _fixedprice = this.data.goodsInfo.fixedprice;
    CLOUDFUNC.callCloudFunction('newOrder', {
      orderType: 1,
      ownerID:  _ownerID, 
      bankerID: _bankerID, 
      buyerID:  _buyerID, 
      goodsID:  _goodsID
    }).then(res => {
      if (res && res.orderId) {
        let url = "/pages/orders/order-type1-details?goods_id=" + this.data.goodsID + "&id=" + res.orderId + "&is_new=true";
        if (_fixedprice) {
          url += "&fixed_price=1";
        }
        wx.navigateTo({
          url: url
        })
      } else {
        wx.showToast({
          title: '创建订单失败',
          icon: 'none',
        })
      }
    }).catch(err => {
      wx.showToast({
        title: '创建订单失败',
        icon: 'none',
      })
    });
  }
})

