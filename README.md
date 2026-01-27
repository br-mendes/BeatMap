<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BeatMap - AI Studio Application

This contains everything you need to run your app locally with the enhanced API architecture.

View your app in AI Studio: https://ai.studio/apps/drive/14eGOXHo2-C_JIK1KVvfJpcPHk46zTXIb

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the environment variables in [.env.local](.env.local):
   - `GEMINI_API_KEY`: Your Gemini API key
   - `API_SECRET_KEY`: Secret key for API authentication
   - `DATABASE_URL`: Database connection string
   - `CACHE_REDIS_URL`: Redis cache connection (optional)
3. Run the app:
   `npm run dev`

## API Architecture

### New Features
- **Modular Architecture**: Separate service layers for better maintainability
- **Enhanced Security**: JWT authentication, rate limiting, and input validation
- **Improved Performance**: Caching layer and optimized database queries
- **Error Handling**: Centralized error management with detailed logging
- **Type Safety**: Full TypeScript integration with strict typing

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key
API_SECRET_KEY=your_secret_key_here
DATABASE_URL=your_database_url

# Optional
CACHE_REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Configurable request rate limits
- **Input Validation**: Comprehensive request validation using schemas
- **CORS Protection**: Configurable Cross-Origin Resource Sharing
- **Security Headers**: Built-in security headers for enhanced protection
- **Environment-based Configuration**: Secure configuration management

## Performance Improvements

- **Caching Layer**: Redis-based caching for frequently accessed data
- **Database Optimization**: Query optimization and connection pooling
- **Response Compression**: Automatic gzip compression
- **Lazy Loading**: Optimized bundle size with code splitting
- **Memory Management**: Efficient memory usage patterns

## Error Handling

The application implements comprehensive error handling:

- **Structured Error Responses**: Consistent error format across all endpoints
- **Error Logging**: Detailed error tracking and monitoring
- **Graceful Degradation**: Fallback mechanisms for critical operations
- **Validation Errors**: Clear validation feedback with field-specific messages

## Documentation

- **[API Documentation](./API_DOCUMENTATION.md)**: Complete API reference with examples
- **[Migration Guide](./MIGRATION_GUIDE.md)**: Step-by-step migration from previous versions
- **[Environment Setup](./docs/ENVIRONMENT_SETUP.md)**: Detailed environment configuration

## Migration

If upgrading from a previous version, please refer to the **[Migration Guide](./MIGRATION_GUIDE.md)** for detailed instructions on:
- Database schema changes
- Environment variable updates
- Breaking changes in API endpoints
- Configuration file updates

## Development

- **Code Style**: ESLint and Prettier for consistent code formatting
- **Type Checking**: Strict TypeScript configuration
- **Testing**: Jest unit tests and integration tests
- **Pre-commit Hooks**: Automated code quality checks

## Support

For issues and questions:
1. Check the [API Documentation](./API_DOCUMENTATION.md)
2. Review the [Migration Guide](./MIGRATION_GUIDE.md)
3. Open an issue in the project repository
