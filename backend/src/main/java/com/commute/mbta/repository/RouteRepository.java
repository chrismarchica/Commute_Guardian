package com.commute.mbta.repository;

import com.commute.mbta.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** Repository for Route entities. */
@Repository
public interface RouteRepository extends JpaRepository<Route, String> {}

