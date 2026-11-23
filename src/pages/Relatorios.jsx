import React, { useState } from 'react';
import { api } from '../services/api';
const reports = [
  ['Redução de agrotóxicos', 'Aplicações registradas com tipo, produto, dose e área.', 'applications'],
  ['Evolução do plano', 'Metas, ações previstas, responsáveis e status.', 'plans'],
  ['Manejos alternativos', 'Práticas não químicas e resultados observados.', 'alternatives'],
  ['Aplicações por cultura', 'Aplicações registradas por cultura e safra.', 'applications'],
  ['Acompanhamento técnico', 'Visitas, orientações e pendências técnicas.', 'technical'],
  ['Indicadores de transição', 'Monitoramentos, ocorrências e condutas registradas.', 'monitoring']
];
export default function Relatorios() {
  const [gerando, setGerando] = useState('');
  const [erro, setErro] = useState('');

  async function gerar(titulo, moduleKey) {
    setGerando(titulo);
    setErro('');
    try {
      const items = await api.list(moduleKey);
      if (!items.length) {
        setErro(`Não há registros em "${titulo}" para exportar.`);
        return;
      }
      const keys = [...new Set(items.flatMap((item) => Object.keys(item)))]
        .filter((key) => key !== 'usuarioUid' && key !== 'criadoEm' && key !== 'atualizadoEm');
      const escapeCsv = (value) => {
        const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `"${text.replaceAll('"', '""')}"`;
      };
      const lines = [
        keys.map(escapeCsv).join(';'),
        ...items.map((item) => keys.map((key) => escapeCsv(item[key])).join(';'))
      ];
      const blob = new Blob(['\ufeff', lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${titulo.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro(e?.message || 'Não foi possível gerar o relatório.');
    } finally {
      setGerando('');
    }
  }

  return (
    <>
      <h3 className="fw-bold">Relatórios</h3>
      <p className="text-secondary">Exporte dados reais cadastrados no sistema em formato CSV.</p>
      {erro && <div className="alert alert-warning">{erro}</div>}
      <div className="row g-3">
        {reports.map(([a, b, moduleKey]) => (
          <div className="col-md-6 col-xl-4" key={a}>
            <div className="raify-card p-4 h-100">
              <h5 className="fw-bold">{a}</h5>
              <p className="text-secondary">{b}</p>
              <button
                className="btn btn-soft"
                disabled={gerando === a}
                onClick={() => gerar(a, moduleKey)}
              >
                {gerando === a ? 'Gerando...' : 'Exportar CSV'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
