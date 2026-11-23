import React from 'react';
import PageHeader from '../components/PageHeader';

export default function Educacao() {
  return (
    <>
      <PageHeader
        title="Conteúdo Educacional"
        subtitle="Materiais validados serão exibidos nesta área."
      />
      <div className="raify-card p-4">
        <p className="mb-0">Nenhum conteúdo educacional publicado no momento.</p>
      </div>
    </>
  );
}
