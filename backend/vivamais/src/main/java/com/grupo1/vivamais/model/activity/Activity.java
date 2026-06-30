package com.grupo1.vivamais.model.activity;

import com.grupo1.vivamais.model.users.User;

import java.util.ArrayList;
import java.util.List;

public class Activity {

    private int id;
    private String name;
    private String date;
    private String time;
    private int numParticipants;
    private List<User> participants = new ArrayList<>();

    public Activity() {
    }

    public Activity(int id, String name, String date, String time, int numParticipants) {
        this.id = id;
        this.name = name;
        this.date = date;
        this.time = time;
        this.numParticipants = numParticipants;
        this.participants = new ArrayList<>();
    }

    public void addParticipant(User user) {
        this.participants.add(user);
    }

    public int getNumParticipants() {
        return numParticipants;
    }

    public void setNumParticipants(int numParticipants) {
        this.numParticipants = numParticipants;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public List<User> getParticipants() {
        return participants;
    }

}
