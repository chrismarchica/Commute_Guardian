package com.commute.mbta;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Basic integration test to verify application context loads correctly. */
@SpringBootTest
@ActiveProfiles("test")
class CommuteGuardianApplicationTests {

  @Test
  void contextLoads() {
    // This test verifies that the Spring application context loads successfully
    // If this test passes, it means all beans are properly configured
  }
}
