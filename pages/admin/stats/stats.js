var wxCharts = require('../../../utils/wxcharts-min.js');

import {
  getAppleMonthStats,
  getAppleDailyStats
} from '../../../apis/apple-stats-apis'

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
    this.getAppleMonthStats()
    this.getAppleDailyStats()
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
    console.log(chooseIndex)
    if (chooseIndex === 0) {
      this.getAppleDailyStats()
    } else if (chooseIndex === 1) {
      this.getAppleMonthStats()
    }
    this.setData({
      chooseIndex
    })
  },
  //月统计数据
  getAppleMonthStats() {
    getAppleMonthStats({
      year: this.data.year
    }).then(res => {
      let monthStats = this.buildMonthStats(res)
      this.lineCharts(monthStats.categories, monthStats.seriesData)
    })
  },
  //天统计
  getAppleDailyStats() {
    getAppleDailyStats({
      yearMonth: this.data.yearMonth
    }).then(res => {
      let dailyList = this.buildDailyList(res)
      const totalAmount = dailyList.reduce((sum, item) => sum + item.amount, 0);
      const totalVip = dailyList.reduce((sum, item) => sum + item.vip, 0);
      //月订阅
      const totalMonthSubscribe = dailyList.reduce((sum, item) => sum + item.monthSubscribe, 0);
      //月续订
      const totalMonthRenew = dailyList.reduce((sum, item) => sum + item.monthRenew, 0);
      //季订阅
      const totalSeasonSubscribe = dailyList.reduce((sum, item) => sum + item.seasonSubscribe, 0);
      //季续订
      const totalSeasonRenew = dailyList.reduce((sum, item) => sum + item.seasonRenew, 0);
      //年订阅
      const totalYearSubscribe = dailyList.reduce((sum, item) => sum + item.yearSubscribe, 0);
      //年续订
      const totalYearRenew = dailyList.reduce((sum, item) => sum + item.yearRenew, 0);
      this.setData({
        dailyList,
        totalVip,
        totalMonthSubscribe,
        totalMonthRenew,
        totalSeasonSubscribe,
        totalSeasonRenew,
        totalYearSubscribe,
        totalYearRenew,
        totalAmount: totalAmount.toFixed(2),
        totalAmount85: (totalAmount * 0.85).toFixed(2)
      })
    })
  },
  //把数据转换为按月统计的格式
  buildMonthStats(data) {
    // 计算 sum 并分组
    const calculateSum = (item) => {
      const {
        productId,
        count
      } = item;
      if (productId.includes("month")) return count * 6 / 10000;
      if (productId.includes("season")) return count * 15 / 10000;
      if (productId.includes("year")) return count * 39.9 / 10000;
      if (productId.includes("vip")) return count * 79.9 / 10000;
      return 0;
    };

    // 按 month 分组汇总 sum
    const groupedData = data.reduce((acc, item) => {
      const month = this.formatMonthToChinese(item.month);
      const sum = calculateSum(item);
      if (!acc[month]) acc[month] = 0;
      acc[month] += sum;
      return acc;
    }, {});
    const categories = Object.keys(groupedData); // 按月份排序
    const seriesData = categories.map(month => groupedData[month]);
    return {
      categories,
      seriesData
    }
  },
  buildDailyList(data) {
    // 1. 按日期聚合数据
    const aggregatedData = data.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {
          monthSubscribe: 0,
          monthRenew: 0,
          seasonSubscribe: 0,
          seasonRenew: 0,
          yearSubscribe: 0,
          yearRenew: 0,
          vip: 0
        };
      }

      // 根据productId和notificationType累加数量
      switch (item.productId) {
        case 'com.louhao.xiaoqu.month':
          if (item.notificationType === 'SUBSCRIBED') {
            acc[date].monthSubscribe += item.count;
          } else if (item.notificationType === 'DID_RENEW') {
            acc[date].monthRenew += item.count;
          }
          break;
        case 'com.louhao.xiaoqu.season':
          if (item.notificationType === 'SUBSCRIBED') {
            acc[date].seasonSubscribe += item.count;
          } else if (item.notificationType === 'DID_RENEW') {
            acc[date].seasonRenew += item.count;
          }
          break;
        case 'com.louhao.xiaoqu.year':
          if (item.notificationType === 'SUBSCRIBED') {
            acc[date].yearSubscribe += item.count;
          } else if (item.notificationType === 'DID_RENEW') {
            acc[date].yearRenew += item.count;
          }
          break;
        case 'com.louhao.xiaoqu.vip':
          acc[date].vip += item.count;
          break;
      }

      return acc;
    }, {});

    // 2. 转换为对象数组并计算amount
    const result = Object.entries(aggregatedData).map(([date, products]) => {
      const amount =
        products.vip * 79.9 +
        (products.monthSubscribe + products.monthRenew) * 6 +
        (products.seasonSubscribe + products.seasonRenew) * 15 +
        (products.yearSubscribe + products.yearRenew) * 39.9;

      return {
        date,
        monthSubscribe: products.monthSubscribe,
        monthRenew: products.monthRenew,
        seasonSubscribe: products.seasonSubscribe,
        seasonRenew: products.seasonRenew,
        yearSubscribe: products.yearSubscribe,
        yearRenew: products.yearRenew,
        vip: products.vip,
        amount: parseFloat(amount.toFixed(1)) // 保留一位小数
      };
    });

    // 3. 按日期排序
    result.sort((a, b) => new Date(b.date) - new Date(a.date));
    console.log(result);
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
        // ,{
        //   name: 'p2',
        //   data: [0.30, 0.37, 0.65, 0.78, 0.69, 0.94, 1.0, 0.65, 0.78, 0.69, 0.94, 1.0],
        //   format: function (val) {
        //     return val.toFixed(2) + '万';
        //   }
        // }
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
    this.setData({
      year: e.detail.value
    });
    this.getAppleMonthStats()
  },
  onYearMonthChange(e) {
    this.setData({
      yearMonth: e.detail.value
    });
    this.getAppleDailyStats()
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

// Page({
//   data: {
//     lineChart: null, // 图表实例
//     categories: [], // 日期标签（如 ['Day1', 'Day2', ..., 'Day30']）
//     seriesData: [] // 每日数据（如 [10, 20, ..., 30]）
//   },

//   onLoad() {
//     // 模拟30天数据（实际开发中可通过接口获取）
//     const categories = Array.from({
//       length: 30
//     }, (_, i) => `${i + 1}日`);
//     const seriesData = Array.from({
//       length: 30
//     }, () => Math.floor(Math.random() * 100));

//     this.setData({
//       categories,
//       seriesData
//     }, () => {
//       this.initChart(); // 数据准备好后初始化图表
//     });
//   },

//   // 初始化折线图
//   initChart() {
//     const {
//       categories,
//       seriesData
//     } = this.data;
//     const windowWidth = wx.getSystemInfoSync().windowWidth;

//     this.setData({
//       lineChart: new wxCharts({
//         canvasId: 'lineCanvas', // 对应 wxml 中的 canvas-id
//         type: 'line', // 折线图
//         categories, // X轴日期标签
//         animation: false, // 关闭动画提升性能
//         series: [{
//           name: '每日数据',
//           data: seriesData,
//           format: val => val.toFixed(2) // 数据格式化
//         }],
//         xAxis: {
//           disableGrid: true
//         }, // 隐藏X轴网格线
//         yAxis: {
//           min: 0
//         }, // Y轴最小值
//         width: windowWidth, // 图表宽度（适配屏幕）
//         height: 200, // 图表高度
//         extra: {
//           lineStyle: 'curve' // 平滑曲线
//         }
//       })
//     });
//   },

//   // 动态更新数据（示例：随机更新最后一天数据）
//   updateData() {
//     const newData = [...this.data.seriesData];
//     newData[newData.length - 1] = Math.floor(Math.random() * 100);

//     this.data.lineChart.updateData({
//       series: [{
//         data: newData
//       }]
//     });
//     this.setData({
//       seriesData: newData
//     });
//   },

//   // 触摸交互：显示具体某日数据
//   showTooltip(e) {
//     this.data.lineChart.showToolTip(e, {
//       format: (item, category) => `${category}: ${item.data}`
//     });
//   }
// });