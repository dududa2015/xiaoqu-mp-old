var wxCharts = require('../../../utils/wxcharts-min.js');

import {
  getAndroidMonthStats,
  getAndroidDailyStats
} from '../../../apis/android-stats-apis'

Page({
  data: {
    chooseIndex: 0,
    year: '',
    yearMonth: '',
    endMonth: '', //年月的end
    endYear: '', //年的end
  },
  onLoad() {
    this.init()
    // 默认只调用本月数据
    this.getAndroidDailyStats()
  },
  init() {
    const yearMonth = this.getCurrentYearMonth()
    const endMonth = this.getCurrentYearMonth()
    const year = this.getCurrentYear()
    const endYear = this.getCurrentYear()
    this.setData({
      yearMonth,
      endMonth,
      year,
      endYear
    })
  },
  getCurrentYearMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份补零
    return `${year}-${month}`;
  },
  getCurrentYear() {
    return new Date().getFullYear();
  },
  onChoose(e) {
    const chooseIndex = parseInt(e.currentTarget.dataset.index)
    this.setData({
      chooseIndex
    })
    // 切换视图时加载对应数据
    if (chooseIndex === 0) {
      this.getAndroidDailyStats()
    } else if (chooseIndex === 1) {
      this.getAndroidMonthStats()
    }
  },
  //月统计数据
  getAndroidMonthStats() {
    const year = this.data.year

    getAndroidMonthStats({
      year: year
    }).then(res => {
      // 后端返回格式：
      // [
      //   { "Month": 1, "Amount": 1234.56 },  // 单位：元
      //   { "Month": 2, "Amount": 2345.67 }
      // ]
      const data = Array.isArray(res) ? res : []
      let monthStats = this.buildMonthStats(data)
      this.lineCharts(monthStats.categories, monthStats.seriesData)
    }).catch(err => {
      console.error('获取月统计数据失败:', err)
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      })
    })
  },
  //天统计
  getAndroidDailyStats() {
    // 解析年月参数
    const yearMonth = this.data.yearMonth.split('-')
    const year = parseInt(yearMonth[0])
    const month = parseInt(yearMonth[1])

    getAndroidDailyStats({
      year: year,
      month: month
    }).then(res => {
      // 后端返回格式：直接是数组，或者包装在 Items 中
      const items = Array.isArray(res) ? res : (res.Items || res.items || [])
      let dailyList = this.buildDailyList(items)
      const totalVipCount = dailyList.reduce((sum, item) => sum + (item.vipCount || 0), 0);
      const totalMonthCount = dailyList.reduce((sum, item) => sum + (item.monthCount || 0), 0);
      const totalSeasonCount = dailyList.reduce((sum, item) => sum + (item.seasonCount || 0), 0);
      const totalYearCount = dailyList.reduce((sum, item) => sum + (item.yearCount || 0), 0);
      //退款统计
      const totalRefundVipCount = dailyList.reduce((sum, item) => sum + (item.refundVipCount || 0), 0);
      const totalRefundMonthCount = dailyList.reduce((sum, item) => sum + (item.refundMonthCount || 0), 0);
      const totalRefundSeasonCount = dailyList.reduce((sum, item) => sum + (item.refundSeasonCount || 0), 0);
      const totalRefundYearCount = dailyList.reduce((sum, item) => sum + (item.refundYearCount || 0), 0);
      const totalNetAmount = dailyList.reduce((sum, item) => sum + (item.netAmount || 0), 0); // 总净金额
      this.setData({
        dailyList,
        totalVipCount,
        totalMonthCount,
        totalSeasonCount,
        totalYearCount,
        totalRefundVipCount,
        totalRefundMonthCount,
        totalRefundSeasonCount,
        totalRefundYearCount,
        totalNetAmount: totalNetAmount.toFixed(2) // 总净金额
      })
    })
  },
  //把数据转换为按月统计的格式
  buildMonthStats(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        categories: [],
        seriesData: []
      };
    }

    // 后端返回的数据格式：
    // [
    //   { "Month": 1, "Amount": 1234.56 },  // Month: 1-12, Amount: 元
    //   { "Month": 2, "Amount": 2345.67 }
    // ]

    // 创建12个月的数组，初始值为0
    const monthData = new Array(12).fill(0);

    // 填充有数据的月份
    data.forEach(item => {
      const month = item.Month || item.month;
      const amount = item.Amount || item.amount || 0; // 单位：元
      if (month >= 1 && month <= 12) {
        monthData[month - 1] = amount / 10000; // 转换为万元
      }
    });

    // 生成月份标签和对应的数据
    const categories = [];
    const seriesData = [];

    for (let i = 0; i < 12; i++) {
      const monthStr = `${i + 1}月`; // 直接格式化为 "1月", "2月" 等
      categories.push(monthStr);
      seriesData.push(monthData[i]);
    }

    return {
      categories,
      seriesData
    }
  },
  buildDailyList(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    // 后端返回的实际数据格式：
    // [
    //   {
    //     "payDate": "2025/12/10 00:00:00",
    //     "totalCount": 4,
    //     "vipCount": 2,
    //     "monthCount": 2,
    //     "seasonCount": 0,
    //     "yearCount": 0,
    //     "amount": 148  // 单位：元
    //   }
    // ]

    // 安卓支付没有续订概念，都是新订单，所以续订数量为0
    const result = data.map(item => {
      // 格式化日期：payDate 格式是 "2025/12/10 00:00:00"
      let dateStr = '';
      if (item.payDate || item.PayDate) {
        const dateValue = item.payDate || item.PayDate;
        if (typeof dateValue === 'string') {
          // 处理 "2025/12/10 00:00:00" 格式
          dateStr = dateValue.split(' ')[0].replace(/\//g, '-'); // 转为 "2025-12-10"
        } else if (dateValue instanceof Date) {
          dateStr = dateValue.toISOString().split('T')[0];
        }
      }

      // 直接使用返回的字段，不自定义
      const amount = parseFloat((item.amount || item.Amount || 0).toFixed(2));
      const refundTotalAmount = parseFloat((item.refundTotalAmount || item.RefundTotalAmount || 0).toFixed(2));
      const netAmount = parseFloat((amount - refundTotalAmount).toFixed(2)); // 净金额
      
      return {
        date: dateStr,
        monthCount: item.monthCount || item.MonthCount || 0,
        seasonCount: item.seasonCount || item.SeasonCount || 0,
        yearCount: item.yearCount || item.YearCount || 0,
        vipCount: item.vipCount || item.VipCount || 0,
        amount: amount,
        refundVipCount: item.refundVipCount || item.RefundVipCount || 0,
        refundMonthCount: item.refundMonthCount || item.RefundMonthCount || 0,
        refundSeasonCount: item.refundSeasonCount || item.RefundSeasonCount || 0,
        refundYearCount: item.refundYearCount || item.RefundYearCount || 0,
        refundTotalAmount: refundTotalAmount,
        netAmount: netAmount // 净金额
      };
    });

    // 按日期排序（降序）
    result.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date) - new Date(a.date);
    });

    console.log('安卓每日统计结果:', result);
    return result;
  },
  lineCharts(categories, seriesData) {
    const systemInfo = wx.getSystemInfoSync();
    const windowWidth = systemInfo.windowWidth - 24;

    this.lineChart = new wxCharts({
      canvasId: 'lineCanvas',
      type: 'line',
      categories,
      series: [{
        name: '2025年',
        data: seriesData,
        color: '#0074FE',
        format: function (val) {
          return val.toFixed(2) + '万';
        }
      }
      ],
      yAxis: {
        title: '成交金额 (万元)',
        format: function (val) {
          return val.toFixed(2);
        },
        min: 0
      },
      width: windowWidth,
      height: 200,
      extra: {
        lineStyle: 'curve' // 平滑曲线
      }
    });
  },
  onYearChange(e) {
    const year = e.detail.value
    this.setData({
      year: year
    });
    // 切换年份时，重新获取月统计数据
    if (this.data.chooseIndex === 1) {
      this.getAndroidMonthStats()
    }
  },
  onYearMonthChange(e) {
    const yearMonth = e.detail.value
    this.setData({
      yearMonth: yearMonth
    });
    // 切换年月时，重新获取日统计数据
    if (this.data.chooseIndex === 0) {
      this.getAndroidDailyStats()
    }
  },
  // 触摸交互：显示具体某日数据
  showTooltip(e) {
    this.lineChart.showToolTip(e, {
      format: (item, category) => `${category}: ${item.data}`
    });
  },
  formatMonthToChinese(dateStr) {
    console.log(dateStr)
    if (dateStr && dateStr.length > 0) {
      const month = parseInt(dateStr.split('-')[1]);
      return `${month}月`;
    } else {
      return ''
    }
  }
});

