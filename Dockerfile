# Crear archivo: C:\xampp\htdocs\sala-ensayos\Dockerfile
FROM php:8.2-apache

# Habilitar módulos de Apache
RUN a2enmod rewrite headers

# Instalar extensiones PHP necesarias
RUN docker-php-ext-install pdo pdo_mysql

# Configurar Apache
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Configurar PHP para desarrollo
RUN echo "display_errors = On" >> /usr/local/etc/php/conf.d/development.ini
RUN echo "error_reporting = E_ALL" >> /usr/local/etc/php/conf.d/development.ini
RUN echo "log_errors = On" >> /usr/local/etc/php/conf.d/development.ini

# Instalar herramientas útiles
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html