# Official Drupal 11 image (PHP + Apache) extended with PostgreSQL support
FROM drupal:11-apache

# Install PostgreSQL support and required tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev git unzip \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Drupal Composer project root
WORKDIR /opt/drupal

# Copy Composer files first for better Docker layer caching
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-interaction --no-progress

# Copy project files
COPY . .

# Install Drush using the project's Composer
RUN composer require drush/drush --no-interaction --no-progress

# Ensure Drupal files are accessible by Apache/PHP
RUN chown -R www-data:www-data /opt/drupal