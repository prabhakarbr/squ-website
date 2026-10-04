# Official Drupal 11 image (PHP + Apache) extended with PostgreSQL support
FROM drupal:11-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev git unzip \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN cd /opt/drupal && composer require drush/drush --no-interaction --no-progress
WORKDIR /var/www/html

# Ensure the Apache server has permission to read and write your files
RUN chown -R www-data:www-data /var/www/html
