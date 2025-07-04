CREATE DATABASE vehicle_supplies_db 
    ENCODING 'UTF8' 
    LC_COLLATE 'en_US.UTF-8' 
    LC_CTYPE 'en_US.UTF-8'
	TEMPLATE template0; 

-- 授予数据库所有权
ALTER DATABASE vehicle_supplies_db OWNER TO "vehicle_web_user";

-- 授予完整权限（需连接数据库后执行）
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "vehicle_web_user";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "vehicle_web_user";
GRANT ALL PRIVILEGES ON SCHEMA public TO "vehicle_web_user";