const { callCloudFunction } = require('../../utils/cloud.js');


Page({
  data: {
    goodId: '',
    form: { color: '', sizeX: '', sizeY: '', sizeZ: '', price: '', description: '' },
    imageList: [],
    videoList: [],
    submitting: false,
    loading: true
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: 'ID needed', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ goodId: options.id });
    this.fetchDetail();
  },

  async fetchDetail() {
    wx.showLoading({ title: 'loading...' });
    try {
      const res = await callCloudFunction('queryGoods', {id : this.data.goodId });
      if (res.code === 0 && res.data && res.data.length > 0) {
        const p = res.data[0];
        this.setData({
          form: {
            color: p.color || '',
            sizeX: p.sizeX || '',
            sizeY: p.sizeY || '',
            sizeZ: p.sizeZ || '',
            price: p.price ? p.price.toString() : '',
            description: p.description || ''
          },
          imageList: (p.images || []).map(url => ({ url })),
          videoList: (p.videos || []).map(url => ({ url, thumb: '' })),
          loading: false
        });
      } else {
        wx.showToast({ title: 'LOAD FAILED', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: 'INTENET ERROR', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    } finally {
      wx.hideLoading();
    }
  },

  onColorInput(e) { this.setData({ 'form.color': e.detail.value }); },
  onSizeInputX(e) { this.setData({ 'form.sizeX': e.detail.value }); },
  onSizeInputY(e) { this.setData({ 'form.sizeY': e.detail.value }); },
  onSizeInputZ(e) { this.setData({ 'form.sizeZ': e.detail.value }); },
  onPriceInput(e) { this.setData({ 'form.price': e.detail.value }); },
  onDescInput(e) { this.setData({ 'form.description': e.detail.value }); },

  previewImage(e) {
    const urls = this.data.imageList.map(i => i.url);
    wx.previewImage({ current: e.currentTarget.dataset.url, urls });
  },

  async addImage() {
    const remain = 9 - this.data.imageList.length;
    if (remain <= 0) return wx.showToast({ title: 'MAX 9', icon: 'none' });
    const res = await wx.chooseMedia({ count: remain, mediaType: ['image'], sizeType: ['compressed'] });
    wx.showLoading({ title: 'uploading...' });
    try {
      const urls = await this.uploadFiles(res.tempFiles.map(f => f.tempFilePath), 'image');
      this.setData({ imageList: [...this.data.imageList, ...urls.map(url => ({ url }))] });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: 'FAILED to upload', icon: 'none' });
    }
  },

  deleteImage(e) {
    const list = [...this.data.imageList];
    list.splice(e.currentTarget.dataset.index, 1);
    this.setData({ imageList: list });
  },

  async addVideo() {
    const remain = 3 - this.data.videoList.length;
    if (remain <= 0) return wx.showToast({ title: 'MAX 3', icon: 'none' });
    const res = await wx.chooseMedia({ count: remain, mediaType: ['video'], sourceType: ['album', 'camera'] });
    wx.showLoading({ title: 'uploading...' });
    try {
      const urls = await this.uploadFiles(res.tempFiles.map(f => f.tempFilePath), 'video');
      const newVideos = urls.map(url => ({ url, thumb: '' }));
      this.setData({ videoList: [...this.data.videoList, ...newVideos] });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: 'FAILED to upload', icon: 'none' });
    }
  },

  deleteVideo(e) {
    const list = [...this.data.videoList];
    list.splice(e.currentTarget.dataset.index, 1);
    this.setData({ videoList: list });
  },

  uploadFiles(filePaths, type) {
    const concurrency = 3;
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

  uploadFile(filePath, type) {
    return new Promise((resolve, reject) => {
      const res = await callCloudFunction('uploadFile', {path:filePath});
      if (res.code === 0 && res.data && res.data.url) {
        resolve(res.data.url);
      } else {
        reject(res.message || 'FAILED TO UPLOAD file');
      }
    });
  },

  async submit() {
    const { form, imageList, videoList, goodId } = this.data;
    if (!form.color.trim()) return wx.showToast({ title: 'COLOR NEEDED', icon: 'none' });
    if (!form.sizeX.trim()) return wx.showToast({ title: 'SHAPEX NEEDED', icon: 'none' });
    if (!form.sizeY.trim()) return wx.showToast({ title: 'SHAPEY NEEDED', icon: 'none' });
    if (!form.sizeZ.trim()) return wx.showToast({ title: 'SHAPEZ NEEDED', icon: 'none' });
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum)) return wx.showToast({ title: 'PRICE NEEDED', icon: 'none' });

    this.setData({ submitting: true });
    wx.showLoading({ title: 'SAVING...' });

    try {
      const res = await callCloudFunction('updateGoodsData',
	      { 
		goodID: goodId,
		ownerID: userID,
	        info: {
		  color: form.color.trim(), 
	          sizeX: form.sizeX.trim(),
	          sizeY: form.sizeY.trim(),
	          sizeZ: form.sizeZ.trim(),
                  price: priceNum,
                  description: form.description.trim(),
                  images: imageList.map(i => i.url),
                  videos: videoList.map(v => v.url)
		}
	      });
      wx.hideLoading();
      if (res.code === 0) {
        wx.showToast({ title: 'SUCCESSFULLY UPDATED', icon: 'success' });
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage && prevPage.onRefresh) prevPage.onRefresh();
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        wx.showToast({ title: res.message || 'FAIL TO UPDATE', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: 'INTERNET ERROR', icon: 'none' });
      console.error(err);
    } finally {
      this.setData({ submitting: false });
    }
  }
});
