<?php
// backend/routes/clientes.php
require_once '../controllers/ClienteController.php';

$app->get('/clientes', 'ClienteController:getAll');
$app->post('/clientes', 'ClienteController:create');
$app->put('/clientes/{id}', 'ClienteController:update');
$app->delete('/clientes/{id}', 'ClienteController:delete');