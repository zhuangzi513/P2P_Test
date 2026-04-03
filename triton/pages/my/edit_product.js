[200~// pages/edit/edit.js
import WXAPI from 'apifm-wxapi';

Page({
  data: {
    productId: '',
    form: { color: '', size: '', price: '', description: '' },
    imageList: [],   // [{ url }]
    videoList: [],   // [{ url, thumb? }]
    submitting: false,
    loading: true
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '缺少产品ID', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ productId: options.id });
    this.fetchDetail();
  },

  // 获取产品详情
  async fetchDetail() {
    wx.showLoading({ title: '加载中...' });
    try {
      // 假设数据表名为 'products'，通过 id 字段查询
      const res = await WXAPI.query('products', { id: this.data.productId });
      if (res.code === 0 && res.data && res.data.length > 0) {
        const p = res.data[0];
        this.setData({
          form: {
            color: p.color || '',
            size: p.size || '',
            price: p.price ? p.price.toString() : '',
            description: p.description || ''
          },
          imageList: (p.images || []).map(url => ({ url })),
          videoList: (p.videos || []).map(url => ({ url, thumb: '' })),
          loading: false
        });
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '网络错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    } finally {
      wx.hideLoading();
    }
  },

  // 表单输入
  onColorInput(e) { this.setData({ 'form.color': e.detail.value }); },
  onSizeInput(e) { this.setData({ 'form.size': e.detail.value }); },
  onPriceInput(e) { this.setData({ 'form.price': e.detail.value }); },
  onDescInput(e) { this.setData({ 'form.description': e.detail.value }); },

  previewImage(e) {
    const urls = this.data.imageList.map(i => i.url);
    wx.previewImage({ current: e.currentTarget.dataset.url, urls });
  },

  // 添加图片（上传）
  async addImage() {
    const remain = 9 - this.data.imageList.length;
    if (remain <= 0) return wx.showToast({ title: '最多9张', icon: 'none' });
    const res = await wx.chooseMedia({ count: remain, mediaType: ['image'], sizeType: ['compressed'] });
    wx.showLoading({ title: '上传中...' });
    try {
      const urls = await this.uploadFiles(res.tempFiles.map(f => f.tempFilePath), 'image');
      this.setData({ imageList: [...this.data.imageList, ...urls.map(url => ({ url }))] });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  deleteImage(e) {
    const list = [...this.data.imageList];
    list.splice(e.currentTarget.dataset.index, 1);
    this.setData({ imageList: list });
  },

  async addVideo() {
    const remain = 3 - this.data.videoList.length;
    if (remain <= 0) return wx.showToast({ title: '最多3个', icon: 'none' });
    const res = await wx.chooseMedia({ count: remain, mediaType: ['video'], sourceType: ['album', 'camera'] });
    wx.showLoading({ title: '上传中...' });
    try {
      const urls = await this.uploadFiles(res.tempFiles.map(f => f.tempFilePath), 'video');
      const newVideos = urls.map(url => ({ url, thumb: '' }));
      this.setData({ videoList: [...this.data.videoList, ...newVideos] });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  deleteVideo(e) {
    const list = [...this.data.videoList];
    list.splice(e.currentTarget.dataset.index, 1);
    this.setData({ videoList: list });
  },

  // 批量上传文件（并发控制）
  uploadFiles(filePaths, type) {
    const concurrency = 3; // 同时最多上传3个
    let index = 0;
    const results = new Array(filePaths.length);
    const uploadNext = () => {
      if (index >= filePaths.length) return Promise.resolve();
      const i = index++;
      return this.uploadFile(filePaths[i], type)
        .then(url => {
          results[i] = url;
          return uploadNext();
        });
    };
    const tasks = [];
    for (let i = 0; i < Math.min(concurrency, filePaths.length); i++) {
      tasks.push(uploadNext());
    }
    return Promise.all(tasks).then(() => results);
  },

  // 单个文件上传（使用 apifm-wxapi）
  uploadFile(filePath, type) {
    return new Promise((resolve, reject) => {
      WXAPI.uploadFile(filePath)
        .then(res => {
          if (res.code === 0 && res.data && res.data.url) {
            resolve(res.data.url);
          } else {
            reject(res.message || '上传失败');
          }
        })
        .catch(reject);
    });
  },

  // 提交更新
  async submit() {
    const { form, imageList, videoList, productId } = this.data;
    if (!form.color.trim()) return wx.showToast({ title: '请输入颜色', icon: 'none' });
    if (!form.size.trim()) return wx.showToast({ title: '请输入尺寸', icon: 'none' });
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum)) return wx.showToast({ title: '价格无效', icon: 'none' });

    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    try {
      // 更新 products 表中 id 为 productId 的记录
      const res = await WXAPI.updateTableData('products', {
        id: productId,
        color: form.color.trim(),
        size: form.size.trim(),
        price: priceNum,
        description: form.description.trim(),
        images: imageList.map(i => i.url),
        videos: videoList.map(v => v.url)
      });
      wx.hideLoading();
      if (res.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage && prevPage.onRefresh) prevPage.onRefresh();
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '网络错误', icon: 'none' });
      console.error(err);
    } finally {
      this.setData({ submitting: false });
    }
  }
});
