const TAGS = ['拖延晚期', '熬夜冠军', '社交牛杂症', '恋爱脑', '摆烂大师', '卷王', '吃货', '社恐', '嘴硬心软', '健忘症', '选择困难', '起床困难户'];
const EXP = [
  '口头禅：「再睡五分钟」',
  '曾用一周做完半小时的作业',
  '相册里全是外卖截图',
  '收藏从未停止，行动从未开始',
  '减肥第 99 次失败'
];

Page({
  data: {
    mode: 'self',
    tags: TAGS.map(n => ({ name: n, selected: false })),
    experience: '',
    friendName: '',
    friendTrait: '',
    relations: ['死党', '同事', '对象', '亲戚'],
    relationIndex: 0,
    hint: '',
    loading: false
  },

  onLoad(q) {
    const mode = q && q.mode === 'friend' ? 'friend' : 'self';
    this.setData({ mode });
    wx.setNavigationBarTitle({ title: mode === 'self' ? '给自己立碑' : '给朋友立碑' });
  },

  toggleTag(e) {
    const i = e.currentTarget.dataset.i;
    const tags = this.data.tags;
    const selected = tags.filter(t => t.selected).length;
    if (!tags[i].selected && selected >= 5) {
      wx.showToast({ title: '最多选 5 个', icon: 'none' });
      return;
    }
    this.setData({ [`tags[${i}].selected`]: !tags[i].selected });
  },

  pickRel(e) {
    this.setData({ relationIndex: e.currentTarget.dataset.i });
  },

  onExp(e) { this.setData({ experience: e.detail.value }); },
  onName(e) { this.setData({ friendName: e.detail.value }); },
  onTrait(e) { this.setData({ friendTrait: e.detail.value }); },

  random() {
    const idx = [];
    while (idx.length < 3) {
      const r = Math.floor(Math.random() * TAGS.length);
      if (idx.indexOf(r) === -1) idx.push(r);
    }
    this.setData({
      tags: TAGS.map((n, i) => ({ name: n, selected: idx.indexOf(i) !== -1 })),
      experience: EXP[Math.floor(Math.random() * EXP.length)],
      hint: ''
    });
  },

  generate() {
    if (this.data.loading) return;
    let payload;
    if (this.data.mode === 'self') {
      const sel = this.data.tags.filter(t => t.selected).map(t => t.name);
      if (sel.length === 0) {
        this.setData({ hint: '至少选 1 个标签，或点「一键随机」' });
        return;
      }
      payload = { mode: 'self', name: '我', tags: sel, experience: this.data.experience, relation: '' };
    } else {
      const name = this.data.friendName.trim();
      if (!name) {
        this.setData({ hint: '先填一个昵称吧' });
        return;
      }
      payload = {
        mode: 'friend',
        name,
        tags: [],
        experience: this.data.friendTrait,
        relation: this.data.relations[this.data.relationIndex]
      };
    }

    this.setData({ hint: '', loading: true });
    wx.showLoading({ title: '正在雕刻…' });
    wx.cloud.callFunction({ name: 'generate', data: payload })
      .then(res => {
        wx.hideLoading();
        this.setData({ loading: false });
        const r = res && res.result;
        if (r && r.ok) {
          wx.setStorageSync('tombstone_result', Object.assign({ name: payload.name }, r.data));
          wx.navigateTo({ url: '/pages/result/result' });
        } else {
          this.setData({ hint: (r && r.error) || '生成失败，请重试' });
        }
      })
      .catch(() => {
        wx.hideLoading();
        this.setData({ loading: false, hint: '网络异常，请重试' });
      });
  }
});
