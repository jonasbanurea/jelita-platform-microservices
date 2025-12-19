# Security Policy

## Supported Versions

This project is a research implementation for thesis purposes. Security updates are provided on a best-effort basis.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please follow these steps:

### 1. **Do Not** Publish the Vulnerability

Please do not create public GitHub issues for security vulnerabilities.

### 2. Report Privately

Send details to: banurea.jonas@gmail.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Time

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity and complexity

## Security Best Practices

### For Users

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong passwords for database
   - Rotate JWT secrets regularly

2. **Database Security**
   - Change default MySQL password
   - Use strong root password
   - Limit database access to necessary services

3. **API Security**
   - Use HTTPS in production
   - Implement rate limiting
   - Validate all input data

4. **Docker Security**
   - Keep Docker images updated
   - Scan images for vulnerabilities
   - Use non-root users in containers

### For Contributors

1. **Code Review**
   - All PRs require review
   - Check for security issues
   - Use static analysis tools

2. **Dependencies**
   - Keep dependencies updated
   - Run `npm audit` regularly
   - Fix vulnerabilities promptly

3. **Secrets Management**
   - Never hardcode credentials
   - Use environment variables
   - Consider using secrets management tools

## Known Limitations

As a research prototype, this implementation has known limitations:

1. **Development Focus**
   - Optimized for development and testing
   - Not production-hardened
   - Limited security features

2. **Authentication**
   - JWT tokens with configurable expiry
   - Basic role-based access control
   - No OAuth2/OIDC integration

3. **Network Security**
   - Services communicate over plain HTTP
   - No TLS/SSL by default
   - No network segmentation

## Production Deployment Recommendations

Before deploying to production:

1. **Enable HTTPS/TLS**
   - Use reverse proxy (Nginx/Traefik)
   - Obtain SSL certificates
   - Enforce HTTPS only

2. **Harden Authentication**
   - Implement refresh tokens
   - Add 2FA support
   - Use OAuth2 providers

3. **Database Security**
   - Enable SSL connections
   - Implement encryption at rest
   - Regular backups

4. **Monitoring**
   - Add security monitoring
   - Implement audit logging
   - Set up alerts

5. **Infrastructure**
   - Use secrets management (Vault)
   - Network segmentation
   - Firewall rules

## Compliance

This project does not claim compliance with any specific security standards (PCI-DSS, HIPAA, etc.). Users must implement additional security controls for regulated environments.

## Acknowledgments

We appreciate responsible disclosure of security vulnerabilities and will acknowledge contributors (with permission) in release notes.

---

**Note**: This is a research/educational project. For production use, comprehensive security review and hardening is required.
