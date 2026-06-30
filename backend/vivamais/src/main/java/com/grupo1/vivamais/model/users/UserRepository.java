package com.grupo1.vivamais.model.users;

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
public class UserRepository {

    private final ObjectMapper mapper = new ObjectMapper();
    private final Path filePath;

    public UserRepository(@Value("${users.json.path:users.json}") String path) {
        this.filePath = Paths.get(path);
    }

    // Lê todos os usuários do arquivo
    public List<User> findAll() throws IOException {
        if (!Files.exists(filePath)) return new ArrayList<>();

        // Verifica se o arquivo está vazio
        if (Files.size(filePath) == 0) return new ArrayList<>();

        return mapper.readValue(filePath.toFile(),
                mapper.getTypeFactory().constructCollectionType(List.class, User.class));
    }

    // Salva a lista inteira (sobrescreve)
    private void saveAll(List<User> users) throws IOException {
        mapper.writerWithDefaultPrettyPrinter().writeValue(filePath.toFile(), users);
    }

    public User save(User user) throws IOException {
        List<User> users = findAll();

        // Gera ID automático se for novo usuário
        if (user.getId() == 0) {
            int nextId = users.stream().mapToInt(User::getId).max().orElse(0) + 1;
            user.setId(nextId);
            users.add(user);
        } else {
            // Atualiza existente
            users.replaceAll(u -> u.getId() == user.getId() ? user : u);
        }

        saveAll(users);
        return user;
    }

    public Optional<User> findById(int id) throws IOException {
        return findAll().stream().filter(u -> u.getId() == id).findFirst();
    }

    public void deleteById(int id) throws IOException {
        List<User> users = findAll();
        users.removeIf(u -> u.getId() == id);
        saveAll(users);
    }
}
