package com.sppkl.plant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class PlantAppStart {
    public static void main(String[] args) {
        SpringApplication.run(PlantAppStart.class);

    }
}
