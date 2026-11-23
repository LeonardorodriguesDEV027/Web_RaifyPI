import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
export default function Solo() {
  const [tab, setTab] = useState('parametros');
  const [it, setIt] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({});
  useEffect(() => {
    api
      .list('soilAnalyses')
      .then(setIt)
      .catch(() => {});
  }, []);
  const soilHistory = [...it]
    .filter((item) => item.data)
    .sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
  const last = soilHistory[0] || null;
  const historyValues = (key) =>
    soilHistory
      .slice()
      .reverse()
      .map((item) => item[key])
      .filter((value) => value != null && value !== '' && Number.isFinite(Number(value)))
      .map(Number);
  async function save(e) {
    e.preventDefault();
    await api.create('soilAnalyses', f);
    setOpen(false);
    setIt([f, ...it]);
  }
  return (
    <>
      <PageHeader
        title="Análises de Solo"
        subtitle="Parâmetros, histórico, recomendações do agrônomo e relatórios."
        action={
          <button className="btn btn-raify" onClick={() => setOpen(true)}>
            + Nova análise
          </button>
        }
      />
      <div className="tabs-raify">
        {[
          ['parametros', 'Parâmetros'],
          ['historico', 'Histórico'],
          ['recomendacoes', 'Recomendações'],
          ['analises', 'Análises']
        ].map(([k, l]) => (
          <button className={tab === k ? 'active' : ''} onClick={() => setTab(k)} key={k}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'parametros' && (
        <>
          {last ? (
            <div className="raify-card last-analysis">
              <div>
                <span>Última Análise</span>
                <h3>{last.empresa || 'Análise cadastrada'}</h3>
                <p>
                  {last.data} • {last.local || 'Local não informado'}
                </p>
              </div>
              <div className="quality-score">
                <b>
                  {last.qualidade != null && last.qualidade !== ''
                    ? `${Number(last.qualidade)}%`
                    : '—'}
                </b>
                <span>Índice de Qualidade do Solo</span>
              </div>
            </div>
          ) : (
            <div className="raify-card p-4">
              <h3>Nenhuma análise cadastrada</h3>
              <p>Use “Nova análise” para registrar o primeiro laudo do solo.</p>
            </div>
          )}
          {last && (
            <div className="raify-card p-4 mt-3">
              <h3>Macronutrientes atuais</h3>
              <div className="macro-bars">
                {[
                  ['N', last.n, 'mg/dm³'],
                  ['P', last.p, 'mg/dm³'],
                  ['K', last.k, 'mmolc/dm³']
                ].map(([n, v, u]) => (
                  <div key={n}>
                    <div className="macro-title">
                      <b>{n}</b>
                      <span>{v != null && v !== '' ? `${v}%` : '—'}</span>
                    </div>
                    <div className="vertical-bar">
                      {v != null && v !== '' && (
                        <i style={{ height: `${Math.max(0, Math.min(100, Number(v) || 0))}%` }} />
                      )}
                    </div>
                    <small>{u}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {tab === 'historico' && (
        <div className="soil-history-grid">
          {soilHistory.length ? (
            <>
              <Chart
                title="Histórico do pH"
                values={historyValues('ph')}
                suffix="pH"
              />
              <Chart
                title="Matéria Orgânica (%)"
                values={historyValues('mo')}
                suffix="%"
              />
              <Dots title="Nitrogênio" values={historyValues('n')} />
            </>
          ) : (
            <div className="raify-card p-4">
              <h3>Sem histórico disponível</h3>
              <p>Cadastre análises em datas diferentes para visualizar a evolução.</p>
            </div>
          )}
        </div>
      )}
      {tab === 'recomendacoes' && (
        <div className="raify-card p-4">
          <h3>Recomendações técnicas</h3>
          <p className="mb-0">
            Nenhuma recomendação técnica foi registrada para as análises cadastradas.
          </p>
        </div>
      )}
      {tab === 'analises' && (
        <div className="report-grid">
          {it.length ? it.map((a, i) => (
            <div className="raify-card report-card" key={a.id || i}>
              <i className="bi bi-file-earmark-pdf" />
              <div>
                <h3>{a.empresa || 'Análise cadastrada'}</h3>
                <p>Postado em {a.data || 'data não informada'}</p>
                <span>{a.local || 'Local não informado'}</span>
              </div>
              {a.relatorioUrl && (
                <a className="btn btn-soft" href={a.relatorioUrl} target="_blank" rel="noreferrer">
                  Acessar relatório
                </a>
              )}
            </div>
          )) : (
            <div className="raify-card p-4">
              <h3>Nenhum laudo cadastrado</h3>
              <p>Os relatórios anexados às novas análises aparecerão aqui.</p>
            </div>
          )}
        </div>
      )}
      {open && (
        <div className="modal d-block modal-bg">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <form className="modal-content p-4" onSubmit={save}>
              <h3>Registrar análise de solo</h3>
              <div className="form-grid">
                {[
                  ['empresa', 'Empresa responsável', 'text'],
                  ['data', 'Data', 'date'],
                  ['local', 'Local da amostra', 'text'],
                  ['qualidade', 'Índice de qualidade (%)', 'number'],
                  ['ph', 'pH', 'number'],
                  ['mo', 'Matéria orgânica (%)', 'number'],
                  ['n', 'Nitrogênio (%)', 'number'],
                  ['p', 'Fósforo (%)', 'number'],
                  ['k', 'Potássio (%)', 'number']
                ].map(([k, l, t]) => (
                  <div key={k}>
                    <label>{l}</label>
                    <input
                      type={t}
                      step="any"
                      className="form-control"
                      value={f[k] || ''}
                      onChange={(e) => setF({ ...f, [k]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-soft" onClick={() => setOpen(false)}>
                  Cancelar
                </button>
                <button className="btn btn-raify">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
function Chart({ title, values, suffix }) {
  if (!values.length) {
    return (
      <div className="raify-card p-4">
        <h3>{title}</h3>
        <p className="mb-0">Sem valores cadastrados para este histórico.</p>
      </div>
    );
  }
  const pts = values
    .map((v, i) => `${30 + i * 86},${180 - (v - Math.min(...values) + 1) * 22}`)
    .join(' ');
  return (
    <div className="raify-card p-4">
      <h3>{title}</h3>
      <svg viewBox="0 0 500 190" className="history-svg">
        <polyline points={pts} fill="none" stroke="#50B47D" strokeWidth="5" />
        {values.map((v, i) => (
          <g key={i}>
            <circle
              cx={30 + i * 86}
              cy={180 - (v - Math.min(...values) + 1) * 22}
              r="6"
              fill="#50B47D"
            />
            <text x={30 + i * 86} y={170 - (v - Math.min(...values) + 1) * 22} textAnchor="middle">
              {v}
              {suffix}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
function Dots({ title, values }) {
  if (!values.length) {
    return (
      <div className="raify-card p-4">
        <h3>{title}</h3>
        <p className="mb-0">Sem valores cadastrados para este histórico.</p>
      </div>
    );
  }
  return (
    <div className="raify-card p-4">
      <h3>{title}</h3>
      <div className="dot-chart">
        {values.map((v, i) => (
          <div key={i}>
            <i style={{ width: `${20 + v / 2}px`, height: `${20 + v / 2}px` }} />
            <span>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
