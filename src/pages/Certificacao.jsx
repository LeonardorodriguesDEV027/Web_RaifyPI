import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';

const TABS = [
  ['visao', 'Visão Geral'],
  ['etapas', 'Etapas'],
  ['grupos', 'Requisitos'],
  ['certificadoras', 'Certificadoras']
];

export default function Certificacao() {
  const [tab, setTab] = useState('visao');
  const messages = {
    visao: 'Nenhum processo de certificação foi registrado.',
    etapas: 'Nenhuma etapa de certificação foi registrada.',
    grupos: 'Nenhum requisito foi registrado.',
    certificadoras: 'Nenhuma entidade certificadora foi cadastrada.'
  };

  return (
    <>
      <PageHeader
        title="Certificação Orgânica"
        subtitle="Acompanhe as informações de certificação cadastradas para a propriedade."
      />
      <div className="tabs-raify">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? 'active' : ''}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="raify-card p-4">
        <p className="mb-0">{messages[tab]}</p>
      </div>
    </>
  );
}
