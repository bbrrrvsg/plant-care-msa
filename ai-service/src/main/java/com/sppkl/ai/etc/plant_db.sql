-- =============================================
-- Plant Management System Database Schema
-- =============================================
drop database if exists PlantCare;
create database PlantCare;
use PlantCare;
-- 1. USER 테이블
CREATE TABLE USER (
    user_id     INT             NOT NULL AUTO_INCREMENT,
    email       VARCHAR(225)    NOT NULL,
    password    VARCHAR(225)    NOT NULL,
    login_type  VARCHAR(50)     NOT NULL,
    PRIMARY KEY (user_id)
);

-- 2. PlantBook 테이블 (식물 도감)
CREATE TABLE PlantBook (
    species_code    INT             NOT NULL AUTO_INCREMENT,
    plant_name      VARCHAR(100)    NOT NULL,
    care_method     TEXT,
    characteristics VARCHAR(255),
    PRIMARY KEY (species_code)
);

-- 3. MyPlant 테이블 (사용자 보유 식물)
CREATE TABLE MyPlant (
    plant_id        INT             NOT NULL AUTO_INCREMENT,
    user_id         INT             NOT NULL,
    species_code    INT             NOT NULL,
    nickname        VARCHAR(100),
    adoption_date   DATE,
    PRIMARY KEY (plant_id),
    FOREIGN KEY (user_id)       REFERENCES USER(user_id)            ON DELETE CASCADE,
    FOREIGN KEY (species_code)  REFERENCES PlantBook(species_code)  ON DELETE RESTRICT
);

-- 4. SensorData 테이블 (센서 데이터)
CREATE TABLE SensorData (
                            sensor_data_id  BIGINT          NOT NULL AUTO_INCREMENT,
                            plant_id        INT             NOT NULL,
                            temperature     DECIMAL(5,2),
                            humidity        DECIMAL(5,2),
                            soil_moisture   DECIMAL(5,2),
                            illuminance     DECIMAL(5,2),
                            measured_time   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (sensor_data_id),
                            FOREIGN KEY (plant_id) REFERENCES MyPlant(plant_id) ON DELETE CASCADE
);

-- 5. AIDiagnosis 테이블 (AI 진단)
CREATE TABLE AIDiagnosis (
    diagnosis_id    BIGINT          NOT NULL AUTO_INCREMENT,
    plant_id        INT             NOT NULL,
    details         TEXT,
    result          VARCHAR(50),
    image_url       VARCHAR(255),
    diagnosis_date  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (diagnosis_id),
    FOREIGN KEY (plant_id) REFERENCES MyPlant(plant_id) ON DELETE CASCADE
);

-- 6. GrowthLog 테이블 (성장 일지)
CREATE TABLE GrowthLog (
    log_id          BIGINT          NOT NULL AUTO_INCREMENT,
    plant_id        INT             NOT NULL,
    diagnosis_id    BIGINT,
    title           VARCHAR(255),
    photo_url       VARCHAR(255),
    log_date        DATE            NOT NULL,
    content         TEXT,
    PRIMARY KEY (log_id),
    FOREIGN KEY (plant_id)      REFERENCES MyPlant(plant_id)        ON DELETE CASCADE,
    FOREIGN KEY (diagnosis_id)  REFERENCES AIDiagnosis(diagnosis_id) ON DELETE SET NULL
);

-- 7. Notification 테이블 (알림)
CREATE TABLE Notification (
    notification_id BIGINT          NOT NULL AUTO_INCREMENT,
    plant_id        INT             NOT NULL,
    type            VARCHAR(50)     NOT NULL,
    message         VARCHAR(255),
    is_sent         TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (notification_id),
    FOREIGN KEY (plant_id) REFERENCES MyPlant(plant_id) ON DELETE CASCADE
);

INSERT INTO USER (email, password, login_type) VALUES ('test@test.com', '1234', 'local');
INSERT INTO PlantBook (plant_name, care_method, characteristics) VALUES ('몬스테라', '주 1회 물주기', '넓은 잎');
INSERT INTO MyPlant (user_id, species_code, nickname, adoption_date) VALUES (1, 1, '몬순이', '2026-01-01');
INSERT INTO sensor_data (plant_id, temperature, humidity, soil_moisture, illuminance, measured_time)
VALUES (1, 23.5, 65.0, 45.0, 990.0, NOW());