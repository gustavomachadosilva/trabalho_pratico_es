package com.grupo1.vivamais.model.users;

public class User {

    private int id;
    private String name;
    private String email;
    private String phone;
    private String password;
    private String type;

    public User() {
    }

    public User(String firstName, String email, String phone, String password, String type) {
        this.name = firstName;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.type = type;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
