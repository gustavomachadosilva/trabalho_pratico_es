package com.grupo1.vivamais.model.activity;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class ActivityRepository {

    private final ObjectMapper mapper = new ObjectMapper();
    private final Path filePath;

    public ActivityRepository(@Value("${users.json.path:activities.json}") String path) {
        this.filePath = Paths.get(path);
    }

    // Lê todos as atividades do arquivo
    public List<Activity> findAll() throws IOException {
        if (!Files.exists(filePath)) return new ArrayList<>();

        // Verifica se o arquivo está vazio
        if (Files.size(filePath) == 0) return new ArrayList<>();

        return mapper.readValue(filePath.toFile(),
                mapper.getTypeFactory().constructCollectionType(List.class, Activity.class));
    }

    // Salva a lista inteira (sobrescreve)
    private void saveAll(List<Activity> activities) throws IOException {
        mapper.writerWithDefaultPrettyPrinter().writeValue(filePath.toFile(), activities);
    }

    public Activity save(Activity activity) throws IOException {
        List<Activity> activities = findAll();

        // Gera ID automático se for novo usuário
        if (activity.getId() == 0) {
            int nextId = activities.stream().mapToInt(Activity::getId).max().orElse(0) + 1;
            activity.setId(nextId);
            activities.add(activity);
        } else {
            // Atualiza existente
            activities.replaceAll(u -> u.getId() == activity.getId() ? activity : u);
        }

        saveAll(activities);
        return activity;
    }

    public Optional<Activity> findById(int id) throws IOException {
        return findAll().stream().filter(a -> a.getId() == id).findFirst();
    }

    public void deleteById(int id) throws IOException {
        List<Activity> activities = findAll();
        activities.removeIf(a -> a.getId() == id);
        saveAll(activities);
    }
}
