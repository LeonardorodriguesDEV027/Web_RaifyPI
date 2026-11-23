import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import { calendarStatus, FormModal, StatusPill, fmtDate, useAgroList } from './agro/shared';

const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];
const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const fields = [
  { key: 'titulo', label: 'Atividade', required: true },
  { key: 'propriedade', label: 'Propriedade' },
  { key: 'data', label: 'Data', type: 'date', required: true },
  { key: 'hora', label: 'Hora', type: 'time' },
  { key: 'descricao', label: 'Descrição', type: 'textarea', full: true }
];

export default function Calendario() {
  const list = useAgroList('calendar');
  const [now, setNow] = useState(() => new Date());
  const today = iso(now);
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState('Mês');
  const [selected, setSelected] = useState(today);
  const [form, setForm] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const byDay = useMemo(() => {
    const events = {};
    list.items.forEach((event) => {
      events[event.data] = [...(events[event.data] || []), event];
    });
    Object.values(events).forEach((items) =>
      items.sort((a, b) => String(a.hora || '').localeCompare(String(b.hora || '')))
    );
    return events;
  }, [list.items]);

  const days = useMemo(() => {
    const result = [];
    if (view === 'Mês') {
      const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const start = new Date(first);
      start.setDate(1 - first.getDay());
      for (let index = 0; index < 42; index += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        result.push(date);
      }
    } else if (view === 'Semana') {
      const start = new Date(cursor);
      start.setDate(cursor.getDate() - cursor.getDay());
      for (let index = 0; index < 7; index += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        result.push(date);
      }
    }
    return result;
  }, [cursor, view]);

  function move(direction) {
    const date = new Date(cursor);
    if (view === 'Mês') date.setMonth(date.getMonth() + direction, 1);
    else date.setDate(date.getDate() + (view === 'Semana' ? 7 : 1) * direction);
    setCursor(date);
    if (view === 'Dia') setSelected(iso(date));
  }

  const upcoming = list.items
    .filter((event) => event.data >= today)
    .sort((a, b) =>
      `${a.data}${a.hora || ''}`.localeCompare(`${b.data}${b.hora || ''}`)
    );
  const dayEvents = byDay[selected] || [];

  async function save() {
    try {
      const { id, ...body } = form;
      if (id) {
        const updated = await api.update('calendar', id, body);
        list.setItems((previous) => previous.map((item) => (item.id === id ? updated : item)));
      } else {
        const created = await api.create('calendar', body);
        list.setItems((previous) => [created, ...previous]);
      }
      setForm(null);
    } catch (error) {
      list.setError(error.message);
    }
  }

  async function remove() {
    if (!window.confirm('Excluir esta atividade?')) return;
    try {
      await api.remove('calendar', form.id);
      list.setItems((previous) => previous.filter((item) => item.id !== form.id));
      setForm(null);
    } catch (error) {
      list.setError(error.message);
    }
  }

  async function complete() {
    try {
      const updated = await api.update('calendar', form.id, { status: 'Concluída' });
      list.setItems((previous) =>
        previous.map((item) => (item.id === form.id ? updated : item))
      );
      setForm(updated);
    } catch (error) {
      list.setError(error.message);
    }
  }

  const openEvent = (event) => setForm(event);
  const title =
    view === 'Dia'
      ? fmtDate(iso(cursor))
      : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  return (
    <>
      <PageHeader
        title="Calendário"
        subtitle="Organize suas atividades e não perca nenhum compromisso."
        action={
          <button
            className="btn btn-raify"
            onClick={() => setForm({ data: selected })}
          >
            + Nova atividade
          </button>
        }
      />
      {list.error && <div className="alert alert-warning">{list.error}</div>}
      <div className="calendar-layout">
        <div className="raify-card calendar-card">
          <div className="ag-cal-head">
            <div className="ag-cal-nav">
              <button onClick={() => move(-1)} aria-label="Anterior">
                <i className="bi bi-chevron-left" />
              </button>
              <b>{title}</b>
              <button onClick={() => move(1)} aria-label="Próximo">
                <i className="bi bi-chevron-right" />
              </button>
            </div>
            <div className="ag-seg">
              {['Mês', 'Semana', 'Dia'].map((option) => (
                <button
                  key={option}
                  className={view === option ? 'active' : ''}
                  onClick={() => {
                    setView(option);
                    if (option === 'Dia') setCursor(new Date(`${selected}T12:00:00`));
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {view === 'Dia' ? (
            <div className="ag-day-list">
              {(byDay[iso(cursor)] || []).length ? (
                byDay[iso(cursor)].map((event) => (
                  <button
                    className="agenda-item"
                    key={event.id}
                    onClick={() => openEvent(event)}
                  >
                    <span>
                      <b>{event.hora || '—'}</b> {event.titulo}
                      <small className="d-block ag-muted">{event.propriedade}</small>
                    </span>
                    <StatusPill value={calendarStatus(event, today)} />
                  </button>
                ))
              ) : (
                <p className="ag-muted p-3 mb-0">Nenhuma atividade neste dia.</p>
              )}
            </div>
          ) : (
            <div className="calendar-grid ag-cal-grid">
              {WEEK.map((day) => (
                <b key={day}>{day}</b>
              ))}
              {days.map((date) => {
                const key = iso(date);
                const events = byDay[key] || [];
                const outsideMonth = view === 'Mês' && date.getMonth() !== cursor.getMonth();
                return (
                  <button
                    key={key}
                    className={`${outsideMonth ? 'out' : ''} ${key === today ? 'is-today' : ''} ${key === selected ? 'is-selected' : ''}`}
                    onClick={() => setSelected(key)}
                  >
                    <span>{date.getDate()}</span>
                    <span className="ag-cal-dots">
                      {events.slice(0, 3).map((event) => (
                        <i key={event.id} className={toneDot(calendarStatus(event, today))} />
                      ))}
                    </span>
                    {view === 'Semana' &&
                      events.map((event) => (
                        <small key={event.id} className="ag-cal-ev">
                          {event.hora} {event.titulo}
                        </small>
                      ))}
                  </button>
                );
              })}
            </div>
          )}
          {view !== 'Dia' && (
            <div className="mt-3">
              <b>{fmtDate(selected)}</b>
              {dayEvents.length ? (
                dayEvents.map((event) => (
                  <button
                    className="agenda-item"
                    key={event.id}
                    onClick={() => openEvent(event)}
                  >
                    <span>
                      <b>{event.hora || '—'}</b> {event.titulo}
                      <small className="d-block ag-muted">{event.propriedade}</small>
                    </span>
                    <StatusPill value={calendarStatus(event, today)} />
                  </button>
                ))
              ) : (
                <p className="ag-muted mb-0">Nenhuma atividade neste dia.</p>
              )}
            </div>
          )}
        </div>

        <div className="raify-card p-4">
          <h3>Próximas atividades</h3>
          {upcoming.length === 0 && (
            <p className="ag-muted">Nenhuma atividade agendada.</p>
          )}
          {(showAll ? upcoming : upcoming.slice(0, 4)).map((event) => (
            <button
              className="ag-upcoming"
              key={event.id}
              onClick={() => openEvent(event)}
            >
              <span className="ag-upcoming-date">{fmtDate(event.data).slice(0, 5)}</span>
              <span>
                <b>
                  {event.hora} {event.titulo}
                </b>
                <small>{event.propriedade}</small>
              </span>
            </button>
          ))}
          {upcoming.length > 4 && (
            <button
              className="btn btn-raify w-100 mt-3"
              onClick={() => setShowAll((previous) => !previous)}
            >
              {showAll ? 'Mostrar menos' : 'Ver todas as atividades'}
            </button>
          )}
        </div>
      </div>
      {form && (
        <FormModal
          title={form.id ? 'Editar atividade' : 'Nova atividade'}
          fields={fields}
          value={form}
          onChange={setForm}
          onSubmit={save}
          onClose={() => setForm(null)}
          onDelete={form.id ? remove : undefined}
          onComplete={
            form.id && calendarStatus(form, today) !== 'Concluída' ? complete : undefined
          }
        />
      )}
    </>
  );
}

function toneDot(status) {
  const value = String(status || '').toLowerCase();
  return value.startsWith('conclu') ? 'ok' : value === 'agendada' ? 'info' : 'warn';
}
