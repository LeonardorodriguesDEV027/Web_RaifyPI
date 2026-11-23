import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatusPill, fmtMoney, fmtNum, loadPrefs, useAgroList } from './shared';

const avg = (arr, key) => {
  const values = arr
    .map((item) => item[key])
    .filter((value) => value != null && value !== '' && Number.isFinite(Number(value)))
    .map(Number);
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null;
};

export default function AgroDashboard() {
  const { user } = useAuth();
  const [open, setOpen] = useState(() => !loadPrefs().heroCollapsed);
  const props = useAgroList('agroProperties');
  const producers = useAgroList('agroProducers');
  const acts = useAgroList('agroActivities');
  const fin = useAgroList('finance');
  const diagnostics = useAgroList('agroDiagnostics');

  const areas = props.items
    .map((property) => property.area)
    .filter((value) => value != null && value !== '' && Number.isFinite(Number(value)));
  const area = areas.reduce((sum, value) => sum + Number(value), 0);
  const transicao = avg(props.items, 'transicao');
  const custos = fin.items
    .filter((f) => f.tipo === 'Despesa')
    .reduce((s, f) => s + Number(f.valor || 0), 0);
  const recentes = [...acts.items].sort((a, b) => String(b.data).localeCompare(a.data)).slice(0, 3);
  const dependencia = avg(diagnostics.items, 'dependencia');
  const despesasClassificadas = fin.items.filter(
    (item) => item.tipo === 'Despesa' && ['Orgânico', 'Químico'].includes(item.origem)
  );
  const gastosOrganicos = despesasClassificadas
    .filter((item) => item.origem === 'Orgânico')
    .reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const gastosQuimicos = despesasClassificadas
    .filter((item) => item.origem === 'Químico')
    .reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const totalClassificado = gastosOrganicos + gastosQuimicos;
  const percentualOrganico = totalClassificado
    ? Math.round((gastosOrganicos / totalClassificado) * 100)
    : 0;
  const nome = (user?.nomeCompleto || 'Agrônomo').split(' ')[0];

  const kpis = [
    ['bi-house-heart', props.items.length, 'Propriedades ativas'],
    ['bi-people', producers.items.length, 'Produtores cadastrados'],
    ['bi-bounding-box', areas.length ? `${fmtNum(area)} ha` : '—', 'Área total monitorada'],
    ['bi-bullseye', transicao == null ? '—' : `${transicao}%`, 'Meta de transição', transicao != null]
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Bem-vindo, {nome}!</h1>
          <p>Aqui está um resumo das suas propriedades e da sua produção.</p>
        </div>
      </div>

      <div className={`ag-hero ${open ? '' : 'collapsed'}`}>
        {kpis.map(([icon, v, l, bar]) => (
          <div className="ag-hero-kpi" key={l}>
            <i className={`bi ${icon}`} />
            <div>
              <b>{v}</b>
              <span>{l}</span>
              {bar && (
                <div className="ag-hero-bar">
                  <i style={{ width: `${transicao}%` }} />
                </div>
              )}
            </div>
          </div>
        ))}
        <button className="ag-hero-toggle" onClick={() => setOpen(!open)} aria-label="Recolher">
          <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} />
        </button>
      </div>

      <div className="ag-grid-2 mt-3">
        <div className="raify-card p-4">
          <div className="card-title-row">
            <h3>Progresso da Transição Agroecológica</h3>
            <b className="ag-accent">{transicao == null ? '—' : `${transicao}%`}</b>
          </div>
          {transicao != null && (
            <div className="progress progress-lg">
              <div className="progress-bar" style={{ width: `${transicao}%` }} />
            </div>
          )}
          <p className="ag-muted mt-2 mb-0">
            {transicao != null
              ? 'Média calculada a partir dos percentuais informados nas propriedades cadastradas.'
              : 'Cadastre propriedades com o progresso da transição para acompanhar este indicador.'}
          </p>
        </div>
        <div className="raify-card cost-card">
          <div className="cost-icon">R$</div>
          <div>
            <span>Custos totais</span>
            <strong>{fmtMoney(custos)}</strong>
            <small>Lançamentos de despesas no financeiro</small>
          </div>
        </div>
      </div>

      <div className="ag-grid-2 mt-3">
        <div className="raify-card p-4">
          <div className="card-title-row">
            <h3>Dependência química registrada</h3>
            <Link to="/agro/diagnostico">Ver detalhes</Link>
          </div>
          {dependencia != null ? (
            <div className="npk-row">
              <span>Média dos diagnósticos</span>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${dependencia}%` }} />
              </div>
              <b>{dependencia}%</b>
            </div>
          ) : (
            <p className="ag-muted mb-0">
              Nenhum diagnóstico com percentual de dependência informado.
            </p>
          )}
        </div>
        <div className="raify-card p-4">
          <div className="card-title-row">
            <h3>Atividades recentes</h3>
            <Link to="/agro/historico">Ver todas</Link>
          </div>
          {recentes.map((a) => (
            <div className="activity-row" key={a.id}>
              <div className="activity-time">{a.hora || '—'}</div>
              <div className="activity-name">
                {a.atividade}
                <small className="d-block ag-muted">{a.propriedade}</small>
              </div>
              <StatusPill value={a.status} />
            </div>
          ))}
          {!recentes.length && <p className="ag-muted mb-0">Nenhuma atividade registrada.</p>}
        </div>
      </div>

      <div className="ag-grid-3 mt-3">
        <div className="raify-card p-4">
          <h3>Evolução da Produtividade (kg/ha)</h3>
          <p className="ag-muted mb-0">
            Nenhuma medição de produtividade cadastrada para compor este histórico.
          </p>
        </div>
        <div className="raify-card p-4">
          <h3>Insumos orgânicos x químicos</h3>
          {totalClassificado ? (
            <>
              <div className="bars-compare">
                <div className="bar-month">
                  <div className="bar-stack">
                    <i style={{ height: `${percentualOrganico}%` }} />
                    <b style={{ height: `${100 - percentualOrganico}%` }} />
                  </div>
                  <span>Despesas classificadas</span>
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
              Classifique despesas como orgânicas ou químicas para comparar os gastos.
            </p>
          )}
        </div>
        <div className="raify-card p-4">
          <h3>Atividades recentes</h3>
          {recentes.length ? (
            <div className="ag-timeline">
              {recentes.map((a) => (
                <div key={a.id}>
                  <span>{a.hora || '—'}</span>
                  <p>{a.atividade}</p>
                  <StatusPill value={a.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="ag-muted mb-0">Sem atividades para exibir.</p>
          )}
        </div>
      </div>
    </>
  );
}
