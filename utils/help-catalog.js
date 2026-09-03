const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'intro', label: '入门' },
  { id: 'map', label: '地图' },
  { id: 'marker', label: '标记' },
  { id: 'vip', label: '会员' },
  { id: 'account', label: '账号' },
  { id: 'tips', label: '须知' }
]

const BROWSABLE = CATEGORIES.filter((item) => item.id !== 'all')

function h3(title) {
  return { type: 'h3', title }
}

function p(text) {
  return { type: 'p', text }
}

function bullets(items) {
  return { type: 'bullets', items }
}

function numbered(items) {
  return { type: 'numbered', items }
}

function note(text) {
  return { type: 'note', text }
}

function table(headers, rows) {
  return { type: 'table', headers, rows }
}

function blockText(block) {
  if (!block) {
    return ''
  }
  if (block.title) {
    return block.title
  }
  if (block.text) {
    return block.text
  }
  if (block.items) {
    return block.items.join(' ')
  }
  if (block.headers || block.rows) {
    return []
      .concat(block.headers || [])
      .concat((block.rows || []).reduce((acc, row) => acc.concat(row), []))
      .join(' ')
  }
  return ''
}

function matchesQuery(section, query) {
  const trimmed = String(query || '').trim().toLowerCase()
  if (!trimmed) {
    return true
  }
  if (String(section.title).toLowerCase().indexOf(trimmed) >= 0) {
    return true
  }
  if (String(section.summary).toLowerCase().indexOf(trimmed) >= 0) {
    return true
  }
  return (section.blocks || []).some((block) => blockText(block).toLowerCase().indexOf(trimmed) >= 0)
}

function toListItem(section) {
  const category = CATEGORIES.find((item) => item.id === section.category)
  return {
    id: section.id,
    title: section.title,
    summary: section.summary,
    category: section.category,
    categoryLabel: category ? category.label : ''
  }
}

const SECTIONS = [
  {
    id: 1,
    category: 'intro',
    title: '文档说明',
    summary: '适用对象、文档目的与相关入口',
    blocks: [
      h3('适用对象'),
      p('本帮助适用于在微信中使用「小区楼号」小程序的用户，包括外卖骑手、快递员等配送人员，以及需要在小区内快速查找楼号、出入口与公共设施的其他用户。'),
      h3('文档目的'),
      p('介绍微信小程序版的主要功能、界面布局与操作步骤，帮助您快速上手地图浏览、标记管理与路线查看。可在本页搜索或按分类浏览具体主题。'),
      h3('相关入口'),
      bullets([
        '使用帮助：「我的 → 使用帮助」（当前页面）；',
        '常见问题：「我的 → 常见问题」；',
        '客户服务：「我的 → 客户服务」，工作日 9:00-18:00；',
        '地图设置：地图页顶部工具条「设置」。'
      ])
    ]
  },
  {
    id: 2,
    category: 'intro',
    title: '核心功能一览',
    summary: '地图浏览、标记、收藏、路线与会员',
    blocks: [
      p('「小区楼号」微信小程序是一款专注于小区内楼号查询与地图标注的工具，主要能力包括：'),
      bullets([
        '在地图上查看小区楼号及出入口、设施等标记；',
        '支持标准地图与卫星地图切换，可缩放、平移；开启旋转后可用双指旋转地图；',
        '支持添加楼号、出入口、公厕、设施、其他、道路、围墙等多类标记（提交后需审核）；',
        '支持收藏标记，在「我的 → 有效标记 / 待审核 / 收藏」中管理；',
        '点击标记可查看详情，使用「路线」预览步行路径，或「导航」打开微信内置地图；',
        '支持分享给微信好友或群聊；',
        '注册后有试用期；试用结束后每天第一次打开可免费使用半小时，也可看激励视频解锁当天，或开通仅限小程序的会员。'
      ]),
      note('小程序会员仅适用于微信小程序，不能用于小区楼号 App。')
    ]
  },
  {
    id: 3,
    category: 'intro',
    title: '添加到我的小程序',
    summary: '下次从微信下拉快速打开',
    blocks: [
      p('为方便下次使用，建议将本小程序添加到「我的小程序」：'),
      numbered([
        '轻触小程序右上角「···」；',
        '选择「添加到我的小程序」；',
        '添加成功后，在微信首页下拉即可找到本小程序。'
      ]),
      p('也可在同一菜单中选择「添加到桌面」（部分机型支持），把快捷方式放到手机桌面。')
    ]
  },
  {
    id: 4,
    category: 'intro',
    title: '登录与数据同步',
    summary: '微信授权登录、标记同步与换机恢复',
    blocks: [
      h3('登录方式'),
      p('进入底部「我的」，按提示完成微信授权登录。登录后，您添加的标记、收藏等会与当前微信账号绑定并同步到服务器。'),
      h3('与 App 的关系'),
      p('使用同一微信账号登录小区楼号 App 后，标记等业务数据可以互通。会员权益相互独立：在小程序开通的会员只在小程序内有效，不能用于 App。'),
      h3('换机后'),
      p('只要仍使用同一微信账号打开本小程序，标记、收藏与小程序会员状态会从服务器同步，一般无需重新添加。')
    ]
  },
  {
    id: 5,
    category: 'map',
    title: '界面与地图手势',
    summary: '底部 Tab、缩放平移与旋转',
    blocks: [
      h3('界面布局'),
      p('小程序底部为两个主 Tab：'),
      bullets([
        '地图：浏览楼号、添加标记、搜索、分享与设置；',
        '我的：查看账号、标记统计、会员、使用帮助与客户服务。'
      ]),
      p('地图页顶部为分享、搜索、设置；右下角（或左下角，取决于控件位置）为添加标记与定位。'),
      h3('缩放与平移'),
      bullets([
        '缩放：双指捏合缩小、双指展开放大；',
        '平移：单指拖动地图，浏览不同区域。'
      ]),
      h3('地图旋转'),
      p('在「地图 → 设置」中开启「开启旋转」后，可用双指旋转地图。')
    ]
  },
  {
    id: 6,
    category: 'map',
    title: '定位与权限',
    summary: '定位按钮、微信授权与异常排查',
    blocks: [
      h3('定位按钮'),
      p('点击地图右下角（或左下角）定位按钮，小程序会定位到您当前所在位置，便于查看附近楼号。'),
      h3('首次授权'),
      note('首次使用需允许微信获取您的位置信息。若曾拒绝，可在系统设置中为微信开启定位权限后，再回到小程序点击定位按钮。'),
      h3('定位失败排查'),
      p('若无法定位当前位置，请依次检查：'),
      bullets([
        '手机系统「位置信息 / 定位服务」总开关已开启；',
        '微信已被允许使用精确位置（设置路径因系统而异：系统设置 → 微信 → 位置）；',
        '在小程序内重新点击定位，并在弹窗中选择允许；',
        '移动到开阔区域后再试；',
        '仍无效时可完全关闭微信后重新打开本小程序。'
      ]),
      h3('定位偏差'),
      p('定位偏差较大时，可结合地图上的楼号与周边建筑手动确认位置，或到开阔地带后再次定位。')
    ]
  },
  {
    id: 7,
    category: 'map',
    title: '搜索地点',
    summary: '用微信地点搜索跳转地图',
    blocks: [
      h3('打开搜索'),
      p('点击地图顶部工具条「搜索」，会打开微信地点选择器。输入小区、写字楼或附近地点名称，选中后地图将跳转到该位置并加载周边楼号。'),
      h3('查找楼号与设施'),
      bullets([
        '跳转后可通过缩放、平移查看该区域的楼号、出入口与设施；',
        '点击地图上的标记可查看详情；',
        '若目标名称不确定，可结合周边地标逐步查找。'
      ]),
      h3('搜索不到时'),
      bullets([
        '换一个更常用的小区或道路名称再搜；',
        '确认网络正常；',
        '手动拖动地图到目标区域后浏览标记。'
      ])
    ]
  },
  {
    id: 8,
    category: 'map',
    title: '分享功能',
    summary: '分享给微信好友或群聊',
    blocks: [
      p('点击地图顶部「分享」，选择微信好友或群聊即可发送小程序卡片。对方打开后可进入同一小程序查看地图。'),
      p('也可使用微信右上角「···」中的转发能力，效果相同。')
    ]
  },
  {
    id: 9,
    category: 'map',
    title: '地图设置',
    summary: '地图类型、控件位置与显示偏好',
    blocks: [
      p('点击地图顶部「设置」，可调整以下选项：'),
      h3('地图类型'),
      bullets([
        '标准地图：简洁平面视图，适合快速浏览；',
        '卫星地图：影像视图，可查看真实地形与建筑外观。'
      ]),
      h3('地图控件位置'),
      p('选择「居左」或「居右」，分享、搜索、设置以及添加、定位等按钮会移到对应一侧。'),
      h3('标记形状'),
      bullets([
        '气泡：以圆形气泡展示名称；',
        '标签：文本直接贴在地图上。'
      ]),
      h3('显示小区边界和出入口'),
      p('开启后，地图上会显示小区边界与出入口相关信息，便于辨认小区范围。'),
      h3('开启旋转'),
      p('开启后可用双指旋转地图；同时会显示指南针。')
    ]
  },
  {
    id: 10,
    category: 'map',
    title: '路线与导航',
    summary: '路线预览与微信内置地图导航',
    blocks: [
      p('点击地图上的标记打开详情后，可使用：'),
      h3('路线'),
      p('点击「路线」，小程序会在当前地图上预览步行路径，便于判断大致走向（需网络与定位权限）。'),
      h3('导航'),
      p('点击「导航」，将打开微信内置地图，可选择步行等方式前往目标位置。'),
      h3('无法使用时'),
      bullets([
        '确认已允许微信使用定位；',
        '检查网络是否正常；',
        '关闭详情后重新点开标记再试。'
      ]),
      note('路线规划依赖网络获取路径数据，请确保手机已联网。')
    ]
  },
  {
    id: 11,
    category: 'marker',
    title: '添加与管理标记',
    summary: '标记类型、审核流程与我的标记',
    blocks: [
      p('点击地图「添加」选择标记类型，填写信息后保存，将提交审核。审核通过后显示在地图上。'),
      h3('支持的标记类型'),
      table(
        ['标记类型', '填写信息', '可选标签'],
        [
          ['楼号', '楼号编号（必填）、大门朝向（选填）', '有门禁、大门常开、有电梯、无电梯等'],
          ['出入口', '名称（选填，最多 10 字）', '需要登记、禁止骑行、可以骑行、需要刷卡等'],
          ['公厕', '名称（选填，最多 10 字）', '比较干净、有纸巾、24 小时开放等'],
          ['设施', '名称（选填，最多 10 字）', '服务周到、价格公道、高效便捷等'],
          ['其他', '名称（选填，最多 10 字）', '经济实惠、安全卫生等'],
          ['道路', '进入绘制模式，定点标记道路关键节点', '—'],
          ['围墙', '进入绘制模式，定点标记围墙关键节点', '—']
        ]
      ),
      note('添加道路 / 围墙时，进入绘制模式后可使用「定点」「撤销」「完成」「退出」。'),
      h3('审核说明'),
      bullets([
        '新添加的标记需审核通过后方在地图上展示；',
        '审核时长视实际情况而定，可在「我的」页「待审核」或标记详情中查看进度；',
        '若审核被拒绝，请查看原因后修改信息重新提交；如有疑问，可通过「我的 → 客户服务」联系客服。'
      ]),
      h3('编辑、删除与收藏'),
      p('点击本人标记进入详情，可「修改」后重新提交审核，或「删除」将其从地图移除。也可在「我的」中查看有效标记与待审核列表。在详情页点击「收藏」，可在「我的 → 收藏」中查看。'),
      h3('公共地图中的限制'),
      p('您只能编辑、删除本人创建的标记。发现他人标记有误，请使用详情中的「报错」反馈。')
    ]
  },
  {
    id: 12,
    category: 'vip',
    title: '小程序会员',
    summary: '开通、续费、退款与仅限小程序',
    blocks: [
      h3('会员能做什么'),
      p('开通后可在微信小程序内无限使用全部功能，不再受每日半小时免费时段限制，也不用观看激励视频。会员权益仅限本小程序，不能用于小区楼号 App。'),
      h3('如何开通'),
      p('进入「我的 → 开通会员」，选择月卡、季卡或年卡，勾选并阅读《会员服务协议》，点击「立即开通」，按微信提示完成支付。开通成功后即时生效。'),
      bullets([
        '小程序会员为一次性购买，没有自动续费，到期后需手动再次购买；',
        '具体价格以开通页展示为准；',
        '支付过程中请勿关闭微信，待返回后再查看会员状态。'
      ]),
      h3('查看与续费'),
      p('可在「我的」页用户卡片查看到期时间，或进入「我的 → 会员管理」查看状态、付款记录并续费。'),
      h3('退款'),
      bullets([
        '支付后 7 天内可在「我的 → 会员管理 → 发起退款」申请；',
        '每使用 1 个自然日少退 0.1 元，每月最多退一次；',
        '退款成功后将扣回对应会员时长；',
        'iOS 上支付的订单须前往 App Store 申请退款。'
      ]),
      note('开通的会员仅适用于微信小程序，不适用于 iOS、Android、鸿蒙 App。')
    ]
  },
  {
    id: 13,
    category: 'vip',
    title: '免费时长与激励视频',
    summary: '试用、每天半小时与看视频解锁',
    blocks: [
      h3('试用'),
      p('新注册用户在注册后 7 天内可试用全部功能。试用结束后，按下方规则使用。'),
      h3('每日免费时长'),
      p('未开通小程序会员时，每天第一次打开小程序后可免费使用半小时。打开时会提示免费截止钟点（例如 09:00 打开则免费至 09:30）。时长在次日 0 点重新计算。'),
      h3('看视频解锁当天'),
      p('免费时段内，可在地图顶部提示旁点击「看视频」，提前解锁当天剩余时间。到点后会出现提示；选择「看视频解锁今天」，完整看完一条激励视频后，当天剩余时间可继续使用。也可选择开通会员，不再限时、不用看广告。'),
      h3('广告说明'),
      p('小程序已取消封面广告、插屏广告和格子广告，浏览地图时不会弹出这类广告。免费半小时结束后，才需要看激励视频或开通会员。')
    ]
  },
  {
    id: 14,
    category: 'account',
    title: '账号管理',
    summary: '修改昵称与注销账号',
    blocks: [
      h3('修改昵称'),
      p('在「我的」页点击头像或昵称，进入编辑资料，修改昵称后保存（最多 10 个字符）。'),
      h3('注销账号'),
      p('在编辑资料页底部选择「注销账号」。注销后将清除昵称、手机号、微信绑定及小程序会员权益，且无法恢复。'),
      bullets([
        '您创建的地图标记、收藏等业务数据会保留在系统中，但不再与您的身份关联；',
        '注销后如再次使用微信打开本小程序，将注册为新账号。'
      ]),
      note('小程序通过当前微信账号登录。若需更换身份，请使用其他微信打开本小程序，或先注销后再用新微信号登录。')
    ]
  },
  {
    id: 15,
    category: 'tips',
    title: '使用须知',
    summary: '内容规范与公共地图限制',
    blocks: [
      bullets([
        '标记信息需真实准确，请勿发布虚假或违规内容；',
        '公共地图中无法修改他人标记，可通过「报错」反馈；',
        '删除标记后无法恢复，请在删除前确认。'
      ])
    ]
  },
  {
    id: 16,
    category: 'tips',
    title: '故障排查',
    summary: '地图加载、定位、分享与会员异常',
    blocks: [
      h3('地图加载缓慢或空白'),
      bullets([
        '检查 Wi-Fi 或移动数据是否正常；',
        '确认已允许微信使用定位；',
        '等待地图完全加载后再操作，卫星图对网络要求更高。'
      ]),
      h3('卫星地图无法显示'),
      bullets([
        '确认已在「设置」中切换到卫星地图；',
        '检查网络连接；',
        '部分老旧设备可能显示异常，可改回标准地图。'
      ]),
      h3('定位不准确或失败'),
      p('请先查看本帮助「定位与权限」。'),
      h3('分享失败'),
      p('请确认微信版本较新，并尝试使用右上角「···」转发。'),
      h3('会员或标记「不见了」'),
      bullets([
        '确认是否使用开通会员、添加标记时的同一微信账号；',
        '小程序会员不会出现在 App 中，请在本小程序「我的」查看；',
        '仍异常可通过「我的 → 客户服务」联系我们。'
      ])
    ]
  },
  {
    id: 17,
    category: 'tips',
    title: '客户服务',
    summary: '在线客服工作日 9:00-18:00',
    blocks: [
      p('使用中遇到问题、有功能建议，或需要查询会员与退款，可通过「我的 → 客户服务」联系我们。'),
      bullets([
        '在线客服工作时间：工作日 9:00-18:00；',
        '咨询时请尽量说明所在城市、小区名称，以及问题截图；',
        '涉及会员或退款时，请提供开通时间与订单信息。'
      ]),
      p('您也可以在本页底部「客户服务」直接进入。')
    ]
  }
]

function getCategories() {
  return CATEGORIES.slice()
}

function getSections() {
  return SECTIONS
}

function sectionById(id) {
  const num = Number(id)
  return SECTIONS.find((item) => item.id === num) || null
}

function filter(category, query) {
  const byCategory = category && category !== 'all'
    ? SECTIONS.filter((item) => item.category === category)
    : SECTIONS
  return byCategory.filter((item) => matchesQuery(item, query)).map(toListItem)
}

function group(category, query) {
  if (String(query || '').trim() || (category && category !== 'all')) {
    return []
  }
  return BROWSABLE.map((sectionCategory) => {
    const sections = SECTIONS.filter((item) => item.category === sectionCategory.id).map(toListItem)
    return sections.length ? { id: sectionCategory.id, label: sectionCategory.label, sections } : null
  }).filter(Boolean)
}

function relatedSections(sectionId) {
  const current = sectionById(sectionId)
  if (!current) {
    return []
  }
  return SECTIONS.filter((item) => item.id !== current.id && item.category === current.category)
    .slice(0, 3)
    .map(toListItem)
}

module.exports = {
  getCategories,
  getSections,
  sectionById,
  filter,
  group,
  relatedSections
}
