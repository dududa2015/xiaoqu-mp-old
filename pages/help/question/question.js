// pages/help/question/question.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentCategory: 'all', // 当前选中的分类
    searchKeyword: '', // 搜索关键词
    categories: [
      { id: 'all', name: '全部', icon: '📋' },
      { id: 'hot', name: '热门', icon: '🔥' },
      { id: 'basic', name: '基础操作', icon: '📱' },
      { id: 'search', name: '搜索定位', icon: '🔍' },
      { id: 'marker', name: '标记管理', icon: '📍' },
      { id: 'navigation', name: '导航功能', icon: '🧭' },
      { id: 'map', name: '地图类型', icon: '🗺️' },
      { id: 'permission', name: '权限审核', icon: '🔐' },
      { id: 'tech', name: '技术故障', icon: '⚙️' }
    ],
    allQuestions: [],
    filteredQuestions: [],
    // 分组折叠（仅在“全部 + 未搜索”时启用）
    showGrouped: true,
    groupedCategories: [],
    // 折叠状态
    expandedCategoryMap: {}, // { [categoryId]: boolean }
    expandedQuestionMap: {} // { [questionId]: boolean }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.initQuestions();
  },

  /**
   * 初始化问题数据
   */
  initQuestions() {
    const questions = [
      // 热门问题
      {
        id: 1,
        category: 'hot',
        question: '小程序无法定位当前位置怎么办？',
        answer: '首先检查手机定位功能是否开启，然后在手机设置中确认小程序已获取定位权限。若仍无法定位，请依次尝试以下三种解决办法：',
        solutions: [
          '轻触右上角···或者箭头，再轻触重新进入小程序',
          '在最近使用的小程序里删除访问记录，重新搜索【小区楼号分布图】并打开',
          '重启手机，解决问题！'
        ]
      },
      {
        id: 2,
        category: 'hot',
        question: '为什么添加的标记没有立即显示？',
        answer: '添加的标记需提交审核，审核通过后才会同步至地图，审核时长根据实际情况而定，请耐心等待。'
      },
      {
        id: 3,
        category: 'hot',
        question: '如何切换卫星地图？',
        answer: '点击右侧 "设置" 按钮，在设置面板中选择 "卫星地图" 选项，即可完成切换。'
      },
      {
        id: 4,
        category: 'hot',
        question: '公共地图和个人地图的区别是什么？',
        answer: '公共地图为所有用户共享，支持多人协作添加标记，但仅能管理本人创建的内容；个人地图为私人专属空间，可自由编辑所有标记，添加的标记仅本人可见。'
      },
      {
        id: 5,
        category: 'hot',
        question: '之前添加的标记会消失吗？',
        answer: '不会。已审核通过的标记会保留在地图上，您可随时查看和管理。'
      },
      {
        id: 47,
        category: 'hot',
        question: '小程序现在还有使用时长或会员限制吗？',
        answer: '没有。小程序已取消每日免费半小时和会员门槛，楼号查询、收藏和路线等核心功能可全天使用；封面广告、插屏广告和格子广告也已取消。'
      },
      // 基础操作类
      {
        id: 6,
        category: 'basic',
        question: '如何缩放地图？',
        answer: '通过双指捏合屏幕可缩小地图，双指展开可放大地图，便于查看整体布局或细节信息。'
      },
      {
        id: 7,
        category: 'basic',
        question: '如何平移地图？',
        answer: '用手指在屏幕上拖动地图，可切换地图显示区域，浏览不同位置的楼号与设施。'
      },
      {
        id: 8,
        category: 'basic',
        question: '如何添加到我的小程序？',
        answer: '轻触小程序右上角的"···"或箭头图标，在弹出的菜单中选择"添加到我的小程序"选项。添加成功后，您可以在微信首页下拉时快速找到并使用本小程序。'
      },
      {
        id: 9,
        category: 'basic',
        question: '如何调整控件位置？',
        answer: '点击右侧 "设置" 按钮，选择 "控件位置" 选项，可拖动调整缩放按钮、定位按钮等控件的位置（如左侧、右侧）。'
      },
      {
        id: 10,
        category: 'basic',
        question: '如何更换定位图标样式？',
        answer: '点击右侧 "设置" 按钮，选择 "定位图标" 选项，可更换箭头图标样式。'
      },
      {
        id: 11,
        category: 'basic',
        question: '如何切换标记显示形状？',
        answer: '点击右侧 "设置" 按钮，选择 "标记形状" 选项。选择 "气泡" 选项，标记将以圆形或椭圆形气泡形式显示；选择 "标签" 选项，标记将以文本标签形式直接贴合在地图上。'
      },
      {
        id: 12,
        category: 'basic',
        question: '如何开启地图旋转功能？',
        answer: '点击右侧 "设置" 按钮，打开 "开启旋转" 选项后，可通过双指旋转手势或手机陀螺仪调整地图视角（适合3D楼块查看）。'
      },
      {
        id: 13,
        category: 'basic',
        question: '如何开启3D楼块显示？',
        answer: '点击右侧 "设置" 按钮，打开 "3D楼块" 选项后，地图将展示建筑物的三维立体模型（需卫星地图或高精度地图支持）。'
      },
      // 搜索定位类
      {
        id: 14,
        category: 'search',
        question: '搜索不到目标楼号怎么办？',
        answer: '可以尝试以下方法：1) 检查输入的楼号是否正确（如A1栋、3号楼等）；2) 使用手动浏览查找，通过平移、缩放地图，结合楼号排列规律或周边地标逐步定位；3) 确认是否在正确的小区地图中搜索。'
      },
      {
        id: 15,
        category: 'search',
        question: '定位不准确如何调整？',
        answer: '定位不准确时，可以：1) 检查手机定位权限是否已开启；2) 尝试移动到开阔地带重新定位；3) 点击定位按钮重新获取位置；4) 手动在地图上选择当前位置。'
      },
      {
        id: 16,
        category: 'search',
        question: '如何手动浏览查找楼号？',
        answer: '若不确定目标名称，可通过平移、缩放地图，仔细观察地图上标注的楼号。每栋楼都以清晰易辨的字体和颜色呈现，对于一些外观相似或容易混淆的楼栋，还添加了独特的识别标识或文字说明，帮助您准确区分。'
      },
      {
        id: 17,
        category: 'search',
        question: '可以搜索哪些内容？',
        answer: '可以搜索小区名称、楼号（如"A1栋"、"3号楼"）或设施名称（如"东门"、"公厕"、"外卖柜"等）。'
      },
      {
        id: 18,
        category: 'search',
        question: '搜索功能支持模糊搜索吗？',
        answer: '目前支持部分模糊搜索，建议输入准确的楼号或设施名称以获得最佳搜索结果。'
      },
      // 标记管理类
      {
        id: 19,
        category: 'marker',
        question: '如何添加楼号标记？',
        answer: '点击地图右下角 "添加" 按钮，选择 "楼号" 选项，在弹出的表单中填写楼号编号（必填）、大门朝向（选填）和标签（选填），填写完成后点击 "保存"，系统将自动提交至审核流程。'
      },
      {
        id: 20,
        category: 'marker',
        question: '如何添加出入口标记？',
        answer: '点击地图右下角 "添加" 按钮，选择 "出入口" 选项，填写名称（选填，最多10字）和标签（选填），点击 "保存" 提交审核。'
      },
      {
        id: 21,
        category: 'marker',
        question: '如何绘制道路？',
        answer: '点击地图右下角 "添加" 按钮，选择 "道路" 选项，进入道路绘制模式。使用 "定点" 按钮在地图上依次标记道路的关键节点，点击 "撤销" 可取消上一个节点，确认无误后点击 "完成" 提交审核。'
      },
      {
        id: 22,
        category: 'marker',
        question: '如何绘制围墙？',
        answer: '点击地图右下角 "添加" 按钮，选择 "围墙" 选项，进入围墙绘制模式。使用 "定点" 按钮在地图上依次标记围墙的关键节点，点击 "撤销" 可取消上一个节点，确认无误后点击 "完成" 提交审核。'
      },
      {
        id: 23,
        category: 'marker',
        question: '审核需要多长时间？',
        answer: '审核时长根据实际情况而定，通常会在24小时内完成审核。审核期间标记状态将显示为 "审核中"，请耐心等待。'
      },
      {
        id: 24,
        category: 'marker',
        question: '为什么无法编辑他人的标记？',
        answer: '为了维护地图数据的准确性，公共地图中仅能编辑和删除本人创建的标记，无法修改他人添加的标记。如需修改他人标记，可通过报错功能反馈。'
      },
      {
        id: 25,
        category: 'marker',
        question: '标记位置不准确如何调整？',
        answer: '找到自己添加的标记，点击进入详情页，点击 "编辑" 按钮，可以重新选择标记位置，修改完成后点击 "保存" 提交审核。'
      },
      {
        id: 26,
        category: 'marker',
        question: '如何查看标记的审核状态？',
        answer: '点击您添加的标记，在详情页面可以查看标记的审核状态（审核中、已通过、已拒绝）。'
      },
      {
        id: 27,
        category: 'marker',
        question: '怎样删除错误的标记？',
        answer: '选中需要报错的楼栋位置，点击弹窗里的「报错」按钮，在弹出的表单中选择错误类型（如错误标记、重复标记等），提交后审核通过后地图即可生效。或者如果是自己添加的标记，可以直接在详情页点击删除。'
      },
      {
        id: 28,
        category: 'marker',
        question: '可以添加哪些类型的标记？',
        answer: '可以添加楼号、出入口、公厕、设施、其他、道路、围墙等类型的标记。'
      },
      // 导航功能类
      {
        id: 29,
        category: 'navigation',
        question: '步行导航如何使用？',
        answer: '在地图上找到目标楼号或设施，点击目标标记，选择 "路线规划" 按钮，确认当前位置后，地图将生成最佳路线。点击右侧 "步行导航" 按钮，进入实时导航模式，定位图标将随移动实时调整方向。'
      },
      {
        id: 30,
        category: 'navigation',
        question: '导航路线不准确怎么办？',
        answer: '如果导航路线不准确，可以：1) 检查定位是否准确；2) 尝试重新规划路线；3) 根据地图上的实际道路情况手动调整路线。'
      },
      {
        id: 31,
        category: 'navigation',
        question: '如何停止导航？',
        answer: '在导航模式下，点击 "停止" 按钮即可结束导航，返回普通地图浏览模式。'
      },
      {
        id: 32,
        category: 'navigation',
        question: '导航功能需要网络吗？',
        answer: '导航功能需要网络支持，请确保手机已连接网络。离线状态下无法使用导航功能。'
      },
      // 地图类型类
      {
        id: 33,
        category: 'map',
        question: '标准地图和卫星地图有什么区别？',
        answer: '标准地图是简洁线条与文字的平面视图，适合快速浏览；卫星地图是高清卫星影像视图，可以查看真实地形与建筑，更适合查看实际环境。'
      },
      {
        id: 34,
        category: 'map',
        question: '如何切换公共地图和个人地图？',
        answer: '通过界面底部的切换按钮可在公共地图与个人地图之间切换：公共地图展示所有用户共同维护的标记；个人地图默认仅展示您自己的标记。同时，您也可以将公共地图的数据导入到个人地图中，便于个人整理与管理。'
      },
      {
        id: 35,
        category: 'map',
        question: '个人地图的数据会丢失吗？',
        answer: '正常情况下，个人地图的数据不会丢失。建议定期使用小程序，以确保数据同步正常。如遇到数据丢失问题，请联系客服。'
      },
      {
        id: 36,
        category: 'map',
        question: '可以在个人地图中导入公共地图的数据吗？',
        answer: '可以，个人地图支持导入公共地图的数据，导入后您可以对这些数据进行编辑、删除、移动等全权限操作。'
      },
      // 权限审核类
      {
        id: 37,
        category: 'permission',
        question: '为什么添加的标记需要审核？',
        answer: '为了确保地图信息的准确性和可靠性，所有用户添加的标记都需要经过审核，避免错误或恶意信息出现在地图上，保障所有用户的使用体验。'
      },
      {
        id: 38,
        category: 'permission',
        question: '审核被拒绝怎么办？',
        answer: '如果审核被拒绝，您可以查看拒绝原因，修改标记信息后重新提交。如果对审核结果有疑问，可以通过客户服务入口联系客服。'
      },
      {
        id: 39,
        category: 'permission',
        question: '如何查看审核状态？',
        answer: '点击您添加的标记，在详情页面可以查看标记的审核状态。状态包括：审核中、已通过、已拒绝。'
      },
      {
        id: 40,
        category: 'permission',
        question: '可以修改正在审核中的标记吗？',
        answer: '标记在审核中时无法修改，需要等待审核完成。如果审核被拒绝，可以修改后重新提交。'
      },
      {
        id: 41,
        category: 'permission',
        question: '为什么无法删除他人的标记？',
        answer: '为了维护地图数据的稳定性和准确性，公共地图中仅能删除本人创建的标记。如果发现他人的标记有误，可以通过报错功能反馈。'
      },
      // 技术故障类
      {
        id: 42,
        category: 'tech',
        question: '卫星地图无法显示怎么办？',
        answer: '卫星地图需要网络支持，请检查：1) 网络连接是否正常；2) 是否已切换到卫星地图模式；3) 部分老旧设备可能无法正常显示，建议使用较新的设备。'
      },
      {
        id: 43,
        category: 'tech',
        question: '3D楼块功能无法使用？',
        answer: '3D楼块功能需要卫星地图或高精度地图支持，请确保：1) 已开启3D楼块设置；2) 已切换到卫星地图模式；3) 当前区域支持3D显示；4) 设备性能满足要求。'
      },
      {
        id: 44,
        category: 'tech',
        question: '小程序卡顿怎么办？',
        answer: '如果小程序出现卡顿，可以尝试：1) 清理微信缓存；2) 关闭其他小程序；3) 重启微信；4) 检查手机存储空间是否充足；5) 更新微信到最新版本。'
      },
      {
        id: 45,
        category: 'tech',
        question: '地图加载缓慢怎么办？',
        answer: '地图加载缓慢可能是网络问题，建议：1) 检查网络连接；2) 切换到更稳定的网络环境；3) 等待地图完全加载后再进行操作。'
      },
      {
        id: 46,
        category: 'tech',
        question: '分享功能无法使用？',
        answer: '如果分享功能无法使用，请检查：1) 微信版本是否为最新；2) 网络连接是否正常；3) 尝试重新进入小程序后再分享。'
      }
    ];

    this.setData(
      {
        allQuestions: questions,
      },
      () => {
        // 默认：全部分类时展开“热门”，其他折叠；问题默认全部折叠
        this.setData({
          expandedCategoryMap: { hot: true },
          expandedQuestionMap: {},
        });
        this.filterQuestions();
      }
    );
  },

  /**
   * 切换分类
   */
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      // 切换分类时，折叠状态重置，避免“太长”
      expandedQuestionMap: {},
      expandedCategoryMap: category === 'all' && !this.data.searchKeyword.trim() ? { hot: true } : {},
    });
    this.filterQuestions();
  },

  /**
   * 搜索问题
   */
  onSearchInput(e) {
    const searchKeyword = e.detail.value;
    this.setData({
      searchKeyword,
      // 搜索时不展开任何答案，避免一次性铺开太长
      expandedQuestionMap: {},
      expandedCategoryMap: this.data.currentCategory === 'all' && !searchKeyword.trim() ? { hot: true } : {},
    });
    this.filterQuestions();
  },

  /**
   * 切换分类分组的展开/收起（仅“全部 + 未搜索”场景）
   */
  toggleCategoryGroup(e) {
    const categoryId = e.currentTarget.dataset.id;
    const { expandedCategoryMap } = this.data;
    this.setData({
      expandedCategoryMap: {
        ...expandedCategoryMap,
        [categoryId]: !expandedCategoryMap[categoryId],
      },
    });
  },

  /**
   * 切换单个问题的展开/收起（手风琴条目）
   */
  toggleQuestion(e) {
    const questionId = Number(e.currentTarget.dataset.qid);
    const { expandedQuestionMap } = this.data;
    this.setData({
      expandedQuestionMap: {
        ...expandedQuestionMap,
        [questionId]: !expandedQuestionMap[questionId],
      },
    });
  },

  /**
   * 构建分组数据（按 categories 顺序）
   */
  buildGroupedCategories(questions) {
    const { categories } = this.data;
    const order = categories
      .filter((c) => c.id !== 'all')
      .map((c) => c.id);

    return order
      .map((categoryId) => {
        const meta = categories.find((c) => c.id === categoryId);
        const list = questions.filter((q) => q.category === categoryId);
        if (!list.length) return null;
        return {
          id: categoryId,
          name: meta ? meta.name : categoryId,
          icon: meta ? meta.icon : '',
          count: list.length,
          questions: list,
        };
      })
      .filter(Boolean);
  },

  /**
   * 过滤问题
   */
  filterQuestions() {
    const { allQuestions, currentCategory, searchKeyword } = this.data;
    let filtered = allQuestions;

    // 按分类过滤
    if (currentCategory !== 'all') {
      filtered = filtered.filter(q => q.category === currentCategory);
    }

    // 按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(keyword) || 
        (q.answer && q.answer.toLowerCase().includes(keyword))
      );
    }

    const showGrouped = currentCategory === 'all' && !searchKeyword.trim();
    this.setData({
      filteredQuestions: filtered,
      showGrouped,
      groupedCategories: showGrouped ? this.buildGroupedCategories(allQuestions) : [],
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  onOpenService() {
    wx.navigateTo({
      url: '/pages/my/customerService/customerService'
    })
  }
})

