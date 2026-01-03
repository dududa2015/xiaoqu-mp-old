# 开发日志

## 2025-01-03

### Apple IAP 商品信息获取问题

**问题描述：**
- 生产环境支付正常，但测试环境无法获取商品信息
- `requestProducts` 返回所有商品标识符都无效（`invalidProductIdentifiers` 包含所有商品）
- `products` 数组为空

**解决方案：**
- IOS签名证书管理的签名类型改为证书签名，且管理类型改为自动管理。