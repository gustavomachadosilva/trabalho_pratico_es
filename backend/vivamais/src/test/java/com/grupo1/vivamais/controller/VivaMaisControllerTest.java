package com.grupo1.vivamais.controller;

import com.grupo1.vivamais.model.activity.Activity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class VivaMaisControllerTest {

    private VivaMaisController controller;

    @BeforeEach
    public void setUp() {
        controller = new VivaMaisController();
    }

    @Test
    public void testActivityDeserialization() throws Exception {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        String json = "{\"name\":\"Yoga\",\"date\":\"2026-06-10\",\"time\":\"14:00\",\"numParticipants\":10,\"participants\":[]}";
        Activity activity = mapper.readValue(json, Activity.class);
        assertEquals("Yoga", activity.getName());
    }

    @Test
    public void testGetAllActivities() throws IOException {
        ResponseEntity<List<Activity>> response = controller.getAllActivities();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    public void testCreateActivityAccessDeniedForNonMod() throws IOException {
        Activity activity = new Activity(0, "Yoga para Iniciantes", "2026-07-01", "10:00", 15);
        // User 1 has type "senior" in users.json (non-moderator)
        ResponseEntity<?> response = controller.createActivity(activity, 1, null);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("Access denied. Only moderators can create activities.", response.getBody());
    }

    @Test
    public void testCreateActivityAllowedForMod() throws IOException {
        Activity activity = new Activity(0, "Yoga para Iniciantes", "2026-07-01", "10:00", 15);
        // User 2 has type "mod" in users.json (moderator)
        ResponseEntity<?> response = controller.createActivity(activity, 2, null);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        Activity created = (Activity) response.getBody();
        assertNotNull(created);
        assertTrue(created.getId() > 0);
    }

    @Test
    public void testEditActivityAccessDeniedForNonMod() throws IOException {
        Activity activity = new Activity(1, "Yoga Avançado", "2026-07-01", "10:00", 15);
        // User 1 is non-moderator
        ResponseEntity<?> response = controller.editActivity(1, activity, 1, null);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("Access denied. Only moderators can edit activities.", response.getBody());
    }

    @Test
    public void testEditActivityAllowedForMod() throws IOException {
        // Create an activity first to get a valid ID
        Activity activity = new Activity(0, "Pilates", "2026-07-02", "11:00", 8);
        ResponseEntity<?> createResponse = controller.createActivity(activity, 2, null);
        Activity created = (Activity) createResponse.getBody();
        assertNotNull(created);

        // Edit the activity
        created.setName("Pilates Avançado");
        ResponseEntity<?> editResponse = controller.editActivity(created.getId(), created, 2, null);
        assertEquals(HttpStatus.OK, editResponse.getStatusCode());
        Activity updated = (Activity) editResponse.getBody();
        assertNotNull(updated);
        assertEquals("Pilates Avançado", updated.getName());
    }

    @Test
    public void testEditActivityNotFound() throws IOException {
        Activity activity = new Activity(9999, "Inexistente", "2026-07-02", "11:00", 8);
        ResponseEntity<?> response = controller.editActivity(9999, activity, 2, null);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Activity not found.", response.getBody());
    }
}
