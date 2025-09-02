import React from 'react';

const MonthGrid = ({ fechaActual, reservas, salaSeleccionada, onDayClick }) => {
  // Obtener primer y último día del mes
  const primerDiaDelMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
  const ultimoDiaDelMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
  
  // Obtener día de la semana del primer día (0 = domingo)
  const primerDiaSemana = primerDiaDelMes.getDay();
  
  // Crear array de días para mostrar
  const diasCalendario = [];
  
  // Días del mes anterior (para completar primera semana)
  const mesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 0);
  for (let i = primerDiaSemana - 1; i >= 0; i--) {
    const dia = new Date(mesAnterior);
    dia.setDate(mesAnterior.getDate() - i);
    diasCalendario.push({
      fecha: new Date(dia),
      esMesActual: false
    });
  }
  
  // Días del mes actual
  for (let dia = 1; dia <= ultimoDiaDelMes.getDate(); dia++) {
    const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia);
    diasCalendario.push({
      fecha,
      esMesActual: true
    });
  }
  
  // Días del próximo mes (para completar última semana)
  const diasRestantes = 42 - diasCalendario.length; // 6 semanas * 7 días
  for (let dia = 1; dia <= diasRestantes; dia++) {
    const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, dia);
    diasCalendario.push({
      fecha,
      esMesActual: false
    });
  }

  // Función para obtener reservas de un día específico
  const obtenerReservasDelDia = (fecha) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return reservas.filter(reserva => reserva.fecha_reserva === fechaStr);
  };

  // Función para determinar el estado de ocupación de un día
  const obtenerEstadoDia = (fecha) => {
    const reservasDelDia = obtenerReservasDelDia(fecha);
    
    if (reservasDelDia.length === 0) {
      return 'disponible';
    }
    
    // Calcular horas ocupadas (aproximado)
    const horasOcupadas = reservasDelDia.reduce((total, reserva) => {
      const inicio = new Date(`2000-01-01T${reserva.hora_inicio}`);
      const fin = new Date(`2000-01-01T${reserva.hora_fin}`);
      const duracion = (fin - inicio) / (1000 * 60 * 60); // Horas
      return total + duracion;
    }, 0);
    
    if (horasOcupadas >= 8) {
      return 'ocupado';
    } else if (horasOcupadas >= 4) {
      return 'parcial';
    } else {
      return 'disponible';
    }
  };

  const esHoy = (fecha) => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const esPasado = (fecha) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha < hoy;
  };

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="month-grid">
      {/* Header con días de la semana */}
      <div className="dias-semana-header">
        {diasSemana.map(dia => (
          <div key={dia} className="dia-semana-label">
            {dia}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="calendario-grid">
        {diasCalendario.map((item, index) => {
          const reservasDelDia = obtenerReservasDelDia(item.fecha);
          const estadoDia = obtenerEstadoDia(item.fecha);
          
          return (
            <div
              key={index}
              className={`dia-celda ${
                item.esMesActual ? 'mes-actual' : 'mes-otro'
              } ${estadoDia} ${
                esHoy(item.fecha) ? 'hoy' : ''
              } ${
                esPasado(item.fecha) ? 'pasado' : ''
              }`}
              onClick={() => item.esMesActual && onDayClick(item.fecha)}
            >
              <div className="dia-numero">
                {item.fecha.getDate()}
              </div>
              
              {item.esMesActual && reservasDelDia.length > 0 && (
                <div className="reservas-indicador">
                  <div className="reservas-count">
                    {reservasDelDia.length} reserva{reservasDelDia.length !== 1 ? 's' : ''}
                  </div>
                  <div className="reservas-preview">
                    {reservasDelDia.slice(0, 2).map((reserva, idx) => (
                      <div key={idx} className={`reserva-mini estado-${reserva.estado_actual}`}>
                        <span className="hora-mini">
                          {reserva.hora_inicio.substring(0, 5)} - {reserva.hora_fin.substring(0, 5)}
                        </span>
                      </div>
                    ))}
                    {reservasDelDia.length > 2 && (
                      <div className="mas-reservas">
                        +{reservasDelDia.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {item.esMesActual && reservasDelDia.length === 0 && !esPasado(item.fecha) && (
                <div className="dia-disponible-hint">
                  Click para ver
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="calendario-leyenda">
        <h4>Leyenda:</h4>
        <div className="leyenda-items">
          <div className="leyenda-item">
            <div className="color-muestra disponible"></div>
            <span>Disponible</span>
          </div>
          <div className="leyenda-item">
            <div className="color-muestra parcial"></div>
            <span>Parcialmente ocupado</span>
          </div>
          <div className="leyenda-item">
            <div className="color-muestra ocupado"></div>
            <span>Muy ocupado</span>
          </div>
          <div className="leyenda-item">
            <div className="color-muestra hoy"></div>
            <span>Hoy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthGrid;