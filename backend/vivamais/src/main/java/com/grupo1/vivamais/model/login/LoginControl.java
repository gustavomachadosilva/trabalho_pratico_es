package com.grupo1.vivamais.model.login;

import com.grupo1.vivamais.model.users.User;
import com.grupo1.vivamais.model.users.UserRepository;

import java.io.IOException;
import java.util.List;

public class LoginControl {

    private UserRepository userRepository = new UserRepository("src/main/resources/users.json");

    public LoginControl() {
    }

    public boolean validateLogin(UserLogin userLogin) throws IOException {

        boolean isValidate = false;
        List<User> users = userRepository.findAll();

        for (User user : users) {
            if ((userLogin.getEmail().equals(user.getEmail())) && (userLogin.getPassword().equals(user.getPassword()))) {
                isValidate = true;
                break;
            }
        }

        return isValidate;

    }
}
