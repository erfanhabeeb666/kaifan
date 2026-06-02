package com.kaifan.callqueue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CallQueueApplication {

    public static void main(String[] args) {
        SpringApplication.run(CallQueueApplication.class, args);
    }
}
