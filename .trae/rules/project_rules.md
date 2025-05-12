# DB设计需求

1. DB 所有的表使用BIGINT 做主键，需要有一个BINNARY 类型字段自动存储一个对应GUID，
2. 所有记录不能直接删除，需要使用deleted 字段软删除

# 后端接口设计
 1. 所有接口都需要使用JWT 鉴权
 2. 所有接口都使用{success: boolean, message: string, data: object}的格式返回数据