package com.grupo1.vivamais.model.users;

import java.io.IOException;
import java.util.List;

public class UserManager {

    private UserRepository userRepository = new UserRepository("src/main/resources/users.json");

    public boolean registerUser(User user) throws IOException {

        boolean isRegistered = isUserRegistered(user);

        if (!isRegistered) {
            userRepository.save(user);
            return true;
        }

        return false;

    }

    public boolean isUserRegistered(User user) throws IOException {

        boolean isRegistered = false;
        List<User> registeredUsers = userRepository.findAll();

        for (User registeredUser : registeredUsers) {
            if (registeredUser.getEmail().equals(user.getEmail())) {
                isRegistered = true;
                break;
            }
        }

        return isRegistered;

    }


}
