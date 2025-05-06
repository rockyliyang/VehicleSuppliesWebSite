# DB设计需求

1. DB 所有的表使用BIGINT 做主键，需要有一个BINNARY 类型字段自动存储一个对应GUID，
2. 所有记录不能直接删除，需要使用deleted 字段软删除
