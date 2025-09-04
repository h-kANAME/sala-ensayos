import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configurar moment en español
moment.locale('es');
const localizer = momentLocalizer(moment);

const MonthGrid = ({ fechaActual, reservas, salaSeleccionada, onDayClick }) => {
  
  // Convertir reservas al formato que espera React Big Calendar
  const eventos = reservas.map((reserva, index) => {
    const fechaReserva = new Date(reserva.fecha_reserva + 'T00:00:00');
    const horaInicio = reserva.hora_inicio.split(':');
    const horaFin = reserva.hora_fin.split(':');
    
    const start = new Date(fechaReserva);
    start.setHours(parseInt(horaInicio[0]), parseInt(horaInicio[1]), 0);
    
    const end = new Date(fechaReserva);
    end.setHours(parseInt(horaFin[0]), parseInt(horaFin[1]), 0);
    
    return {
      id: reserva.id || index,
      title: `${reserva.cliente_nombre} - ${reserva.hora_inicio.substring(0, 5)}`,
      start: start,
      end: end,
      resource: {
        reserva: reserva,
        estado: reserva.estado_actual
      }
    };
  });

  // Personalizar estilos de eventos según estado
  const eventStyleGetter = (event) => {
    const { estado } = event.resource;
    let style = {
      fontSize: '12px',
      padding: '2px 4px',
      borderRadius: '3px',
      border: 'none'
    };

    switch (estado) {
      case 'presente':
        style.backgroundColor = '#28a745';
        style.color = 'white';
        break;
      case 'pendiente':
        style.backgroundColor = '#ffc107';
        style.color = '#000';
        break;
      case 'ausente':
        style.backgroundColor = '#dc3545';
        style.color = 'white';
        break;
      case 'finalizada':
        style.backgroundColor = '#17a2b8';
        style.color = 'white';
        break;
      default:
        style.backgroundColor = '#6c757d';
        style.color = 'white';
    }

    return { style };
  };

  // Manejar click en día vacío
  const handleSelectSlot = ({ start }) => {
    onDayClick(start);
  };

  // Manejar click en evento
  const handleSelectEvent = (event) => {
    onDayClick(event.start);
  };

  // Mensajes en español
  const messages = {
    allDay: 'Todo el día',
    previous: '◀',
    next: '▶',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay reservas en este período',
    showMore: (total) => `+${total} más`
  };

  return (
    <div className="month-grid-calendar">
      <Calendar
        localizer={localizer}
        events={eventos}
        date={fechaActual}
        onNavigate={(date) => {
          // Actualizar fecha cuando naveguen
          const event = new Event('calendar-navigate');
          event.detail = { date };
          window.dispatchEvent(event);
        }}
        view="month"
        views={['month']}
        style={{ height: 600 }}
        eventPropGetter={eventStyleGetter}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable={true}
        popup={true}
        messages={messages}
        dayPropGetter={(date) => {
          const today = new Date();
          const isToday = date.toDateString() === today.toDateString();
          
          if (isToday) {
            return {
              style: {
                backgroundColor: '#fff3cd',
                border: '2px solid #ffc107'
              }
            };
          }
          return {};
        }}
      />
      
      {/* Leyenda */}
      <div className="calendario-leyenda">
        <h4>Estados de Reservas:</h4>
        <div className="leyenda-items">
          <div className="leyenda-item">
            <div className="color-muestra" style={{backgroundColor: '#ffc107'}}></div>
            <span>Pendiente</span>
          </div>
          <div className="leyenda-item">
            <div className="color-muestra" style={{backgroundColor: '#28a745'}}></div>
            <span>Presente</span>
          </div>
          <div className="leyenda-item">
            <div className="color-muestra" style={{backgroundColor: '#dc3545'}}></div>
            <span>Ausente</span>
          </div>
          <div className="leyenda-item">
            <div className="color-muestra" style={{backgroundColor: '#17a2b8'}}></div>
            <span>Finalizada</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthGrid;