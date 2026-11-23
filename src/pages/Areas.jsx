import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { api } from '../services/api';
export default function Areas() {
  const [items, setItems] = useState([]);
  const [form, setF] = useState({});
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const load = () =>
    api
      .list('areas')
      .then((records) => {
        setItems(records);
        setError('');
      })
      .catch((err) => setError(err.message));
  useEffect(() => {
    load();
  }, []);
  const mappedItems = items.filter(
    (item) =>
      item.latitude !== '' &&
      item.latitude != null &&
      item.longitude !== '' &&
      item.longitude != null &&
      Number.isFinite(Number(item.latitude)) &&
      Number.isFinite(Number(item.longitude))
  );
  const mapCenter = mappedItems.length
    ? [
        mappedItems.reduce((sum, item) => sum + Number(item.latitude), 0) / mappedItems.length,
        mappedItems.reduce((sum, item) => sum + Number(item.longitude), 0) / mappedItems.length
      ]
    : null;
  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      const { latitude, longitude, ...details } = form;
      const body = {
        ...details,
        ...(latitude !== '' && latitude != null ? { latitude: Number(latitude) } : {}),
        ...(longitude !== '' && longitude != null ? { longitude: Number(longitude) } : {})
      };
      await api.create('areas', body);
      setOpen(false);
      setF({});
      await load();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <div>
          <h3 className="fw-bold">Áreas e Talhões</h3>
          <p className="text-secondary">
            Cadastre culturas, área e localização da unidade produtiva.
          </p>
        </div>
        <button className="btn btn-raify" onClick={() => setOpen(true)}>
          + Nova área
        </button>
      </div>
      {error && <div className="alert alert-warning">{error}</div>}
      <div className="row g-3">
        {items.map((a) => (
          <div className="col-md-4" key={a.id}>
            <div className="raify-card p-3">
              <h5 className="fw-bold">{a.nome}</h5>
              <div className="text-secondary small">
                {[a.cultura, a.areaHa != null && `${a.areaHa} ha`].filter(Boolean).join(' • ') || 'Dados da área não informados'}
              </div>
              {a.progresso != null && a.progresso !== '' && (
                <>
                  <div className="small mt-3">Transição</div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${Math.max(0, Math.min(100, Number(a.progresso) || 0))}%` }} />
                  </div>
                  <b className="text-success d-block mt-2">{Number(a.progresso)}%</b>
                </>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && !error && (
          <div className="col-12">
            <div className="raify-card p-3">Nenhuma área ou talhão cadastrado.</div>
          </div>
        )}
      </div>
      <div className="raify-card p-3 mt-3">
        <h5 className="fw-bold">Mapa da propriedade</h5>
        {mapCenter ? (
          <div className="map-wrap">
            <MapContainer center={mapCenter} zoom={mappedItems.length > 1 ? 10 : 13} style={{ height: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {mappedItems.map((item) => (
                <Marker key={item.id} position={[Number(item.latitude), Number(item.longitude)]}>
                  <Popup>{item.nome}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        ) : (
          <p className="text-secondary mb-0">Cadastre coordenadas nas áreas para exibi-las no mapa.</p>
        )}
      </div>
      {open && (
        <div className="modal d-block" style={{ background: 'rgba(10,30,20,.45)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <form className="modal-content p-3" onSubmit={save}>
              <div className="modal-header border-0">
                <h5 className="fw-bold">Nova área / talhão</h5>
                <button type="button" className="btn-close" onClick={() => setOpen(false)} />
              </div>
              <div className="modal-body row g-3">
                {[
                  ['nome', 'Nome / talhão'],
                  ['cultura', 'Cultura'],
                  ['areaHa', 'Área (ha)'],
                  ['progresso', '% transição'],
                  ['latitude', 'Latitude'],
                  ['longitude', 'Longitude']
                ].map(([k, l]) => (
                  <div className="col-md-6" key={k}>
                    <label className="form-label">{l}</label>
                    <input
                      type={k === 'latitude' || k === 'longitude' || k === 'areaHa' || k === 'progresso' ? 'number' : 'text'}
                      step={k === 'latitude' || k === 'longitude' || k === 'areaHa' ? 'any' : undefined}
                      className="form-control"
                      value={form[k] || ''}
                      onChange={(e) => setF({ ...form, [k]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-raify">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
