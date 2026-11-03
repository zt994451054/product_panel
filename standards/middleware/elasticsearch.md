# Elasticsearch 使用规范

> **主标准**：[Elasticsearch Reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/)
> **适用版本**：Elasticsearch 7.x / 8.x

---

## 核心概念速查

| 概念 | 类比 MySQL | 说明 |
|------|-----------|------|
| Index | 数据库 / 表 | 文档的集合 |
| Document | 行（Row）| JSON 格式的数据单元 |
| Field | 列（Column）| 文档的字段 |
| Mapping | Schema | 字段类型定义 |
| Shard | — | 索引的分片（水平切分）|
| Replica | 从库 | 主分片的副本 |

---

## 索引设计规范

### Mapping 设计

【必须】创建索引前先定义 Mapping，禁止依赖动态映射（Dynamic Mapping）自动推断：

```json
PUT /orders
{
  "mappings": {
    "properties": {
      "orderId":    { "type": "keyword" },
      "userId":     { "type": "keyword" },
      "amount":     { "type": "long" },
      "status":     { "type": "keyword" },
      "title":      { "type": "text", "analyzer": "ik_max_word", "search_analyzer": "ik_smart" },
      "createdAt":  { "type": "date", "format": "yyyy-MM-dd'T'HH:mm:ssZZ" },
      "tags":       { "type": "keyword" }
    }
  }
}
```

**字段类型选型：**

| 场景 | 类型 | 说明 |
|------|------|------|
| 精确匹配（ID/状态/标签）| `keyword` | 不分词，支持 term/filter 查询 |
| 全文搜索（标题/描述）| `text` | 分词，支持 match 查询 |
| 数值（金额/年龄）| `integer`/`long`/`float` | 支持范围查询 |
| 时间 | `date` | 统一格式 ISO 8601 |
| 地理位置 | `geo_point` | 支持距离查询 |
| 布尔 | `boolean` | — |

> **中文分词**：上面示例的 `ik_max_word` / `ik_smart` 来自第三方 IK 插件，不是 ES 内置分析器，需先在集群安装；未安装时改用内置的 `standard` 或其他已安装的分析器。

> **keyword vs text**：ID、状态码、标签用 `keyword`（不分词，精确匹配）；用户输入的自然语言文本用 `text`（分词，全文搜索）。

### 分片数量设计

```
单分片建议大小：10-50GB（官方建议）
分片数 = 预估总数据量 / 20GB（保守估算）

示例：预估 200GB 数据 → 10 个分片
```

【必须】分片数在创建索引时确定，**后续无法修改**（需要 Reindex）

【推荐】副本数：生产环境 `number_of_replicas=1`（至少一个副本），开发环境可设为 0

```json
PUT /orders/_settings
{
  "number_of_replicas": 1
}
```

---

## 查询规范

### Filter vs Query 选择

```json
// ✅ 精确条件（不需要相关性评分）用 filter（有缓存，更快）
{
  "query": {
    "bool": {
      "filter": [
        { "term":  { "status": "PAID" } },
        { "range": { "amount": { "gte": 100 } } }
      ],
      "must": [
        { "match": { "title": "手机" } }  // 全文搜索需要评分，用 must/should
      ]
    }
  }
}
```

**选择规则：**
- **filter**：精确匹配、范围查询、布尔值——不影响评分，有缓存
- **must/should**：全文搜索、需要相关性排序——影响评分，无缓存

### 分页规范

```json
// ✅ from-size 浅分页（适合前 10000 条）
{ "from": 0, "size": 20 }

// ❌ 深分页：from+size > 10000 会抛异常（默认 max_result_window=10000）
{ "from": 100000, "size": 20 }
```

**深分页解决方案：**

```json
// ✅ search_after（游标分页，无深度限制）
{
  "sort": [{ "createdAt": "desc" }, { "_id": "desc" }],
  "search_after": ["2026-04-13T10:00:00+08:00", "order-10086"]
}
```

### 聚合查询

```json
// 统计各状态订单数量
{
  "aggs": {
    "by_status": {
      "terms": { "field": "status", "size": 10 }
    },
    "total_amount": {
      "sum": { "field": "amount" }
    }
  },
  "size": 0  // 只要聚合结果，不要文档
}
```

---

## 数据写入规范

### Bulk 批量写入

【必须】批量写入使用 Bulk API，禁止循环单条写入：

```python
# Python - elasticsearch-py
from elasticsearch import Elasticsearch, helpers

es = Elasticsearch(hosts)

# ✅ 批量写入
actions = [
    {"_index": "orders", "_id": doc["id"], "_source": doc}
    for doc in documents
]
helpers.bulk(es, actions, chunk_size=500, request_timeout=30)

# ❌ 循环单条写入（N 次 HTTP 请求）
for doc in documents:
    es.index(index="orders", id=doc["id"], body=doc)
```

**批量写入参数参考：**

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `chunk_size` | 500-1000 | 每批次文档数 |
| 单批 Body 大小 | ≤ 5MB | 超过则拆分 |
| `refresh` | `false`（默认）| 写入后不立即刷新，提升写入性能 |

### Index 生命周期（ILM）

大数据量场景（日志/行为数据）使用 Index Lifecycle Management，按时间滚动索引：

```
orders-2026-04     # 当月索引，热存储
orders-2026-03     # 上月，温存储
orders-2025-*      # 历史，冷存储或删除
```

---

## 多语言客户端推荐

| 语言 | 推荐客户端 |
|------|----------|
| Go | [go-elasticsearch](https://github.com/elastic/go-elasticsearch)（官方）|
| Java | [elasticsearch-java](https://www.elastic.co/guide/en/elasticsearch/client/java-api-client/)（官方新版）|
| Python | [elasticsearch-py](https://github.com/elastic/elasticsearch-py)（官方）|
| Node.js | [@elastic/elasticsearch](https://www.npmjs.com/package/@elastic/elasticsearch)（官方）|

---

## 禁止事项

【禁止】未备份、未二次确认就在生产环境执行 `DELETE /index_name`（删除索引）；按项目变更流程执行

【禁止】在 Mapping 中将 `_source` 设为 `false`（会导致文档不可检索内容、不可更新）

【禁止】高频更新同一文档（ES 更新本质是重新索引，有 GC 压力），更新频繁的数据不适合放 ES

【禁止】`match_all` 无条件查询大量数据（设置合理的 `size` 上限）
