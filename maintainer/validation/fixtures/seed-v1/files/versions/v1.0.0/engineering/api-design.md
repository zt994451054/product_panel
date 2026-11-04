# v1.0.0 接口设计

| 方法 | 路径 | 说明 | 主要错误码 |
|------|------|------|---------|
| GET | /api/slots?date=YYYY-MM-DD | 查询某日时段及状态 | — |
| POST | /api/bookings | 创建预约，body: {slot_id} | 401 未登录 / 409 时段已被预约 / 422 超过上限或时段已过去 |
| POST | /api/admin/slots | 批量创建时段，body: {date, start, end} | 403 非管理员 |
| PATCH | /api/admin/slots/{id} | 关闭时段，body: {status: "closed"} | 403 非管理员 / 409 已有预约 |
