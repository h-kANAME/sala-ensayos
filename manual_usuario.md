● Reglas de Negocio para Reservas No Presentadas

  Escenario: Reserva a las 12:00hs sin presentación del cliente

  Estados de Reserva:

  1. pendiente - Estado inicial al crear la reserva
  2. presente - Cliente hizo check-in
  3. ausente - Cliente no se presentó
  4. finalizada - Sesión completada (después del check-out)

  Reglas Automáticas:

  Timeout de Ausencia: 15 minutos
  - Si la reserva está pendiente y han pasado 15 minutos desde la hora de inicio, se marca automáticamente como ausente
  - Lógica: hora_inicio + 15 minutos < hora_actual

  Flujo para una reserva a las 12:00hs:

  1. 12:00-12:15 → Estado pendiente (cliente puede hacer check-in)
  2. 12:15 en adelante → Si no hizo check-in, se marca como ausente automáticamente
  3. El sistema ejecuta actualizarEstadosAutomaticos() cada vez que se consultan las reservas

  Código relevante:

  - backend/models/Reserva.php:actualizarEstadosAutomaticos() - Líneas con timeout de 15 minutos
  - backend/controllers/ReservaController.php - Llama la actualización automática en cada consulta
  - backend/controllers/CheckinController.php - Maneja check-in/check-out

  Resumen: 15 minutos de gracia después de la hora de inicio, luego automáticamente ausente.


  --
  # Horario de atencion de la sala para negar turnos
  Establecimos horario de atencion de 09:00 a 23:00 en 'ReservaPublicaController.php'
  --

  