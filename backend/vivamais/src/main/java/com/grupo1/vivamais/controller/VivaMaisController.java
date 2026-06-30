package com.grupo1.vivamais.controller;

import com.grupo1.vivamais.model.login.LoginControl;
import com.grupo1.vivamais.model.users.User;
import com.grupo1.vivamais.model.login.UserLogin;
import com.grupo1.vivamais.model.users.UserManager;
import com.grupo1.vivamais.model.activity.Activity;
import com.grupo1.vivamais.model.activity.ActivityManager;
import com.grupo1.vivamais.model.users.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/vivamais")
@Tag(name = "VivaMais", description = "All VivaMais API endpoints")
public class VivaMaisController {

    @Operation(summary = "Approves user login")
    @RequestMapping(value = "/login", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> approvesUserLogin(@RequestBody UserLogin userLogin) throws IOException {

        LoginControl loginControl = new LoginControl();

        if (loginControl.validateLogin(userLogin)) {
            UserRepository userRepository = new UserRepository("src/main/resources/users.json");
            Optional<User> userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getEmail().equals(userLogin.getEmail()))
                    .findFirst();
            if (userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.OK).body(userOpt.get());
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials!");
    }

    @Operation(summary = "Register new user")
    @PostMapping("/newuser")
    public ResponseEntity<String> registerNewUser(@RequestBody User user) throws IOException {
        UserManager manager = new UserManager();

        if (manager.registerUser(user)) {
            return ResponseEntity.status(HttpStatus.OK).body("User Registered!");
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("The user is already registered!");
    }

    @Operation(summary = "Get all activities")
    @GetMapping("/activities")
    public ResponseEntity<List<Activity>> getAllActivities() throws IOException {
        ActivityManager activityManager = new ActivityManager();
        return ResponseEntity.ok(activityManager.getAllActivities());
    }

    @Operation(summary = "Create a new activity (Moderators only)")
    @PostMapping("/activities")
    public ResponseEntity<?> createActivity(
            @RequestBody Activity activity,
            @RequestHeader(value = "X-User-Id", required = false) Integer headerUserId,
            @RequestParam(value = "userId", required = false) Integer paramUserId) throws IOException {

        Integer userId = (headerUserId != null) ? headerUserId : paramUserId;
        if (!isModerator(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Only moderators can create activities.");
        }

        ActivityManager activityManager = new ActivityManager();
        Activity created = activityManager.createActivity(activity);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Edit an existing activity (Moderators only)")
    @PutMapping("/activities/{id}")
    public ResponseEntity<?> editActivity(
            @PathVariable("id") int id,
            @RequestBody Activity activity,
            @RequestHeader(value = "X-User-Id", required = false) Integer headerUserId,
            @RequestParam(value = "userId", required = false) Integer paramUserId) throws IOException {

        Integer userId = (headerUserId != null) ? headerUserId : paramUserId;
        if (!isModerator(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Only moderators can edit activities.");
        }

        ActivityManager activityManager = new ActivityManager();
        Activity updated = activityManager.editActivity(id, activity);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Activity not found.");
        }
        return ResponseEntity.ok(updated);
    }

    private boolean isModerator(Integer userId) throws IOException {
        if (userId == null) {
            return false;
        }
        UserRepository userRepository = new UserRepository("src/main/resources/users.json");
        return userRepository.findById(userId)
                .map(user -> "mod".equalsIgnoreCase(user.getType()))
                .orElse(false);
    }

}
