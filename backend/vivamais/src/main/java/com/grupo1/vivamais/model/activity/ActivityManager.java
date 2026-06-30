package com.grupo1.vivamais.model.activity;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public class ActivityManager {

    private ActivityRepository activityRepository = new ActivityRepository("src/main/resources/activities.json");

    public List<Activity> getAllActivities() throws IOException {
        return activityRepository.findAll();
    }

    public Activity createActivity(Activity activity) throws IOException {
        activity.setId(0);
        return activityRepository.save(activity);
    }

    public Activity editActivity(int id, Activity updatedActivity) throws IOException {
        Optional<Activity> existing = activityRepository.findById(id);
        if (existing.isEmpty()) {
            return null;
        }
        updatedActivity.setId(id);
        return activityRepository.save(updatedActivity);
    }

}
