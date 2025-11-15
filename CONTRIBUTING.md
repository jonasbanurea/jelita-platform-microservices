# Contributing to Jelita Microservices

Thank you for your interest in contributing to the Jelita Licensing Service Microservices project!

## 🎯 About This Project

This project is a research implementation demonstrating the transformation from monolithic architecture to microservices, focusing on:
- **Scalability**: Horizontal scaling capabilities
- **Interoperability**: Service-to-service communication via REST APIs
- **Fault Isolation**: Independent service deployment and failure handling

## 🚀 Getting Started

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Node.js 18+
- MySQL 8.0 (for local development)
- Git

### Setup Development Environment

1. **Clone the repository**
```bash
git clone https://github.com/jonasbanurea/jelita-microservices.git
cd jelita-microservices
```

2. **Run the stack**
```bash
docker-compose up -d --build
```

3. **Setup databases**
```bash
.\docker\setup-databases.ps1  # Windows PowerShell
# or
./docker/setup-databases.sh   # Linux/Mac
```

4. **Verify services**
```bash
docker-compose ps
curl http://localhost:3001/health
```

## 📝 How to Contribute

### Reporting Issues
- Use GitHub Issues to report bugs or suggest features
- Provide clear description and reproduction steps
- Include logs, screenshots if applicable

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
```bash
# Run tests for specific service
cd layanan-arsip
npm test

# Run integration tests
k6 run tests/test-e2e-integration.js

# Run load tests
k6 run tests/loadtest-baseline.js
```

5. **Commit your changes**
```bash
git commit -m "feat: add new feature description"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions or changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

6. **Push and create Pull Request**
```bash
git push origin feature/your-feature-name
```

## 🏗️ Project Structure

```
prototype_eng/
├── layanan-manajemen-pengguna/    # Auth Service (Port 3001)
├── layanan-pendaftaran/           # Application Service (Port 3010)
├── layanan-alur-kerja/            # Workflow Service (Port 3020)
├── layanan-survei/                # Survey Service (Port 3030)
├── layanan-arsip/                 # Archive Service (Port 3040)
├── docker/                        # Docker setup scripts
├── tests/                         # Load testing and E2E tests
└── docker-compose.yml            # Main orchestration file
```

## 🧪 Testing Guidelines

### Unit Tests
```bash
cd <service-folder>
npm test
```

### Integration Tests
```bash
newman run <service>/postman/*.postman_collection.json
```

### Load Tests
```bash
k6 run tests/loadtest-baseline.js   # Normal load
k6 run tests/loadtest-stress.js     # Stress test
```

## 📚 Code Style

- Use ESLint configuration provided
- Follow Node.js best practices
- Write meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## 🔒 Security

- Never commit sensitive data (passwords, API keys)
- Use environment variables for configuration
- Follow security best practices for JWT handling
- Report security issues privately

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Community

- Be respectful and constructive
- Help others in discussions
- Share knowledge and best practices

## 📞 Contact

For questions or discussions:
- Open a GitHub Issue
- Check existing documentation
- Review closed issues for similar problems

---

**Thank you for contributing to Jelita Microservices!** 🚀
