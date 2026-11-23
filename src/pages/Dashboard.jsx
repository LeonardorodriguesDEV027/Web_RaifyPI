import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import WeatherCard from '../components/WeatherCard';
export default function Dashboard() {
  const { user } = useAuth();
  const [s, setS] = useState({});
  const [property, setProperty] = useState(null);
  const [propertyError, setPropertyError] = useState('');
  const soilNutrients = [
    ['Nitrogênio (N)', s.ultimaAnaliseSolo?.n],
    ['Fósforo (P)', s.ultimaAnaliseSolo?.p],
    ['Potássio (K)', s.ultimaAnaliseSolo?.k]
  ].filter(([, value]) => value != null && value !== '' && Number.isFinite(Number(value)));
  useEffect(() => {
    api
      .summary()
      .then(setS)
      .catch(() => {});
    api
      .list('properties')
      .then((items) =>
        setProperty(
          items.find(
            (item) =>
              item.latitude !== '' &&
              item.latitude != null &&
              item.longitude !== '' &&
              item.longitude != null &&
              Number.isFinite(Number(item.latitude)) &&
              Number.isFinite(Number(item.longitude))
          ) || null
        )
      )
      .catch((error) => setPropertyError(error.message));
  }, []);
  return (
    <>
      <PageHeader
        title={`Bom dia, ${(user?.nomeCompleto || 'Agricultor').split(' ')[0]}!`}
        subtitle="Acompanhe sua propriedade e a evolução da transição."
      />
      {propertyError && <div className="alert alert-warning">{propertyError}</div>}
      <WeatherCard
        lat={property ? Number(property.latitude) : null}
        lon={property ? Number(property.longitude) : null}
        property={property?.nome}
      />
      <div className="dashboard-grid mt-4">
        <div className="raify-card p-4 transition-card">
          <div className="card-title-row">
            <h3>Planos concluídos</h3>
            <b className="percent">{s.planoProgresso == null ? '—' : `${s.planoProgresso}%`}</b>
          </div>
          <div className="progress progress-lg">
            <div className="progress-bar" style={{ width: `${s.planoProgresso ?? 0}%` }} />
          </div>
          <p>
            {s.planos
              ? `${s.planosConcluidos} de ${s.planos} planos cadastrados marcados como concluídos.`
              : 'Cadastre planos para acompanhar as conclusões.'}
          </p>
        </div>
        <div className="raify-card cost-card">
          <div className="cost-icon">R$</div>
          <div>
            <span>Custos do mês</span>
            <strong>
              {(s.custosMes ?? 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </strong>
            <small>{s.aplicacoes ?? 0} aplicações registradas</small>
          </div>
        </div>
      </div>
      <div className="dashboard-grid mt-3">
        <div className="raify-card p-4">
          <div className="card-title-row">
            <h3>Última análise de solo</h3>
            <a href="/app/solo">Ver análise</a>
          </div>
          {soilNutrients.length ? soilNutrients.map(([n, raw]) => {
            const v = Number(raw);
            return (
            <div className="npk-row" key={n}>
              <span>{n}</span>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${Math.max(0, Math.min(100, v))}%` }} />
              </div>
              <b>{v}%</b>
            </div>
            );
          }) : (
            <p className="ag-muted mb-0">
              {s.ultimaAnaliseSolo
                ? 'A última análise não contém valores de N, P ou K.'
                : 'Nenhuma análise de solo cadastrada.'}
            </p>
          )}
        </div>
        <div className="raify-card p-4">
          <div className="card-title-row">
            <h3>
              <i className="bi bi-calendar3" /> Atividades de hoje
            </h3>
            <a href="/app/calendario">Ver todas</a>
          </div>
          {(s.atividadesHoje?.length ? s.atividadesHoje : []).map((activity) => {
            const status = activity.status || 'Não informado';
            const color =
              status === 'Concluída'
                ? 'success'
                : status === 'Em andamento'
                  ? 'purple'
                  : 'secondary';
            return (
              <div className="activity-row" key={activity.id}>
                <div className="activity-time">{activity.hora || '--:--'}</div>
                <div className="activity-name">{activity.titulo || 'Atividade sem título'}</div>
                <span className={`status-pill ${color}`}>{status}</span>
              </div>
            );
          })}
          {!s.atividadesHoje?.length && (
            <div className="activity-row">
              <div className="activity-name">Nenhuma atividade cadastrada para hoje.</div>
            </div>
          )}
        </div>
      </div>
      <div className="dashboard-grid mt-3">
        <div className="raify-card p-4">
          <h3>Qualidade do solo — 6 meses</h3>
          {s.historicoSolo?.length ? (
            <SoilQualityChart values={s.historicoSolo} />
          ) : (
            <div className="activity-row">
              <div className="activity-name">Cadastre análises de solo para acompanhar a evolução.</div>
            </div>
          )}
        </div>
        <div className="raify-card p-4">
          <h3>Insumos orgânicos x químicos</h3>
          {s.aplicacoesClassificadas ? (
            <>
              <div className="bars-compare">
                <div className="bar-month">
                  <div className="bar-stack">
                    <i style={{ height: `${s.participacaoOrganica}%` }} />
                    <b style={{ height: `${100 - s.participacaoOrganica}%` }} />
                  </div>
                  <span>Registros</span>
                </div>
              </div>
              <div className="legend">
                <span>
                  <i className="dot org" /> Orgânicos
                </span>
                <span>
                  <i className="dot chem" /> Químicos
                </span>
              </div>
            </>
          ) : (
            <p className="ag-muted mb-0">
              Nenhuma aplicação classificada como orgânica ou química para calcular este indicador.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function SoilQualityChart({ values }) {
  const width = 520;
  const left = 25;
  const usableWidth = width - left * 2;
  const points = values.map((item, index) => {
    const x = values.length === 1 ? width / 2 : left + (index * usableWidth) / (values.length - 1);
    const value = Math.max(0, Math.min(100, Number(item.qualidade) || 0));
    const y = 150 - value * 1.08;
    return { x, y, value, date: item.data };
  });

  return (
    <>
      <svg className="soil-line" viewBox="0 0 520 190">
        {points.length > 1 && (
          <polyline
            fill="none"
            stroke="#50B47D"
            strokeWidth="5"
            points={points.map((point) => `${point.x},${point.y}`).join(' ')}
          />
        )}
        {points.map((point, index) => (
          <g key={`${point.date}-${index}`}>
            <circle cx={point.x} cy={point.y} r="7" fill="#50B47D" />
            <text x={point.x} y={point.y - 12} textAnchor="middle" fontSize="10">
              {point.value}%
            </text>
          </g>
        ))}
      </svg>
      <div className="chart-labels">
        {points.map((point, index) => (
          <span key={`${point.date}-label-${index}`}>
            {formatChartDate(point.date)}
          </span>
        ))}
      </div>
    </>
  );
}

function formatChartDate(value) {
  if (!value) return '--';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}
