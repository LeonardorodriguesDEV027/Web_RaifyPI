import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
export default function Propriedades() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  useEffect(() => {
    api
      .list('properties')
      .then(setItems)
      .catch(() => {});
  }, []);
  return (
    <>
      <PageHeader
        title="Propriedades"
        subtitle="Visualize os dados gerais, culturas e localização."
        action={
          <button className="btn btn-raify" onClick={() => nav('/app/propriedades/nova')}>
            + Cadastrar propriedade
          </button>
        }
      />
      {items.length ? items.map((p) => {
        const hasCoordinates =
          p.latitude !== '' &&
          p.latitude != null &&
          p.longitude !== '' &&
          p.longitude != null &&
          Number.isFinite(Number(p.latitude)) &&
          Number.isFinite(Number(p.longitude));
        return (
          <div className="property-card raify-card" key={p.id}>
            <div className="property-summary">
              <div className="property-photo">
                <i className="bi bi-image" />
              </div>
              <div>
                <h2>{p.nome}</h2>
                <p>
                  <i className="bi bi-geo-alt" /> {[p.municipio, p.uf].filter(Boolean).join(' - ') || 'Localização não informada'}
                </p>
                <div className="property-stats">
                  {p.areaTotal != null && <span><b>{p.areaTotal}</b> ha total</span>}
                  {p.areaProducao != null && <span><b>{p.areaProducao}</b> ha produção</span>}
                  <span><b>{p.culturas?.length || 0}</b> cultivo(s)</span>
                </div>
              </div>
            </div>
            <div className="property-map">
              {hasCoordinates ? (
                <MapContainer center={[Number(p.latitude), Number(p.longitude)]} zoom={13}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[Number(p.latitude), Number(p.longitude)]}>
                    <Popup>{p.nome}</Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <p className="ag-muted p-3 mb-0">Cadastre as coordenadas para exibir o mapa.</p>
              )}
            </div>
          </div>
        );
      }) : (
        <div className="raify-card p-4">
          <h3>Nenhuma propriedade cadastrada</h3>
          <p>Cadastre uma propriedade para visualizar seus dados aqui.</p>
        </div>
      )}
    </>
  );
}
