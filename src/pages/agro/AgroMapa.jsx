import React, { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import PageHeader from '../../components/PageHeader';
import { StatusPill, fmtNum, useAgroList } from './shared';

// Move o mapa até a propriedade selecionada na lista.
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 12, { duration: 0.6 });
  }, [target]);
  return null;
}

export default function AgroMapa() {
  const list = useAgroList('agroProperties');
  const [sel, setSel] = useState(null);
  const pts = useMemo(
    () =>
      list.items.filter(
        (p) =>
          p.latitude != null &&
          p.latitude !== '' &&
          p.longitude != null &&
          p.longitude !== '' &&
          Number.isFinite(Number(p.latitude)) &&
          Number.isFinite(Number(p.longitude))
      ),
    [list.items]
  );
  const center = pts.length
    ? [
        pts.reduce((s, p) => s + Number(p.latitude), 0) / pts.length,
        pts.reduce((s, p) => s + Number(p.longitude), 0) / pts.length
      ]
    : null;

  return (
    <>
      <PageHeader
        title="Mapa das Propriedades"
        subtitle="Visualize a localização e o status de transição de cada propriedade."
      />
      <div className="ag-map-layout">
        <div className="raify-card ag-map">
          {!list.loading && center ? (
            <MapContainer center={center} zoom={pts.length > 1 ? 8 : 12}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FlyTo target={sel} />
              {pts.map((p) => (
                <CircleMarker
                  key={p.id}
                  center={[Number(p.latitude), Number(p.longitude)]}
                  radius={11}
                  pathOptions={{ color: '#fff', weight: 3, fillColor: '#5B3FD9', fillOpacity: 0.95 }}
                >
                  <Popup>
                    <b>{p.nome}</b>
                    <br />
                    {[p.produtor, p.area != null && `${fmtNum(p.area)} ha`]
                      .filter(Boolean)
                      .join(' • ')}
                    {p.transicao != null && p.transicao !== '' && (
                      <>
                        <br />
                        Transição: {p.transicao}%
                      </>
                    )}
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          ) : (
            <p className="ag-muted p-3 mb-0">
              {list.loading
                ? 'Carregando propriedades...'
                : 'Nenhuma propriedade com coordenadas cadastradas.'}
            </p>
          )}
        </div>
        <div className="raify-card p-3 ag-map-list">
          <h3 className="px-2">Propriedades ({list.items.length})</h3>
          {list.items.map((p) => {
            const has = pts.includes(p);
            return (
              <button
                key={p.id}
                disabled={!has}
                onClick={() => setSel([Number(p.latitude), Number(p.longitude)])}
              >
                <i className="bi bi-geo-alt-fill" />
                <span>
                  <b>{p.nome}</b>
                  <small>
                    {has ? `${p.municipio || ''}${p.uf ? ` - ${p.uf}` : ''}` : 'Sem coordenadas'}
                  </small>
                </span>
                <StatusPill value={p.status} />
              </button>
            );
          })}
          {!list.loading && list.items.length === 0 && (
            <p className="ag-muted px-2">Nenhuma propriedade cadastrada.</p>
          )}
        </div>
      </div>
    </>
  );
}
