FROM php:8.2-fpm

WORKDIR /var/www

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo pdo_pgsql pgsql mbstring exif pcntl bcmath gd

COPY custom.ini /usr/local/etc/php/conf.d/custom.ini

RUN echo "pm = dynamic" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "pm.max_children = 50" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "pm.start_servers = 10" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "pm.min_spare_servers = 5" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "pm.max_spare_servers = 20" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "pm.max_requests = 500" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "request_terminate_timeout = 600" >> /usr/local/etc/php-fpm.d/zz-docker.conf

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install --no-interaction --optimize-autoloader --no-dev

RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]