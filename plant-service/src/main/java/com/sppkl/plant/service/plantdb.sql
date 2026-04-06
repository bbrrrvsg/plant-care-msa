DROP DATABASE if exists plantdb;
CREATE DATABASE plantdb;
use plantdb;

select * from plant_book;

-- 1페이지 (1~30번)
SELECT * FROM plant_book LIMIT 30 OFFSET 0;

-- 2페이지 (31~60번)
SELECT * FROM plant_book LIMIT 30 OFFSET 30;

-- 3페이지 (61~90번)
SELECT * FROM plant_book LIMIT 30 OFFSET 60;