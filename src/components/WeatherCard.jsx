import React, { useEffect, useState } from 'react';
export default function WeatherCard({ lat, lon, property }) {
  const [w, setW] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setW(null);
      setError('');
      return;
    }

    const controller = new AbortController();
    setW(null);
    setError('');
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`,
      { signal: controller.signal }
    )
      .then((response) => {
        if (!response.ok) throw new Error('Não foi possível consultar a previsão do tempo.');
        return response.json();
      })
      .then((d) => {
        if (!d.current) throw new Error('A previsão do tempo não está disponível.');
        setW({
          temperature: Math.round(d.current.temperature_2m),
          humidity: d.current.relative_humidity_2m,
          wind: Math.round(d.current.wind_speed_10m),
          desc: 'Condições atuais'
        });
        setError('');
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      });
    return () => controller.abort();
  }, [lat, lon]);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return (
      <div className="weather-card">
        <div className="weather-top">
          <b>Previsão do tempo</b>
        </div>
        <p className="mb-0">Cadastre as coordenadas da propriedade para consultar a previsão.</p>
      </div>
    );
  }

  return (
    <div className="weather-card">
      <div className="weather-top">
        <b>{property || 'Previsão do tempo'}</b>
      </div>
      <div className="weather-main">
        {error ? (
          <p className="mb-0" role="status">{error}</p>
        ) : w ? (
          <>
            <div>
              <div className="weather-temp">{w.temperature}°</div>
              <span>{w.desc}</span>
            </div>
            <div className="weather-location">
              <i className="bi bi-geo-alt" /> Localização cadastrada
            </div>
            <div className="weather-data">
              <span>
                <i className="bi bi-droplet" /> {w.humidity}%
              </span>
              <span>
                <i className="bi bi-wind" /> {w.wind} km/h
              </span>
            </div>
          </>
        ) : (
          <p className="mb-0">Consultando condições atuais...</p>
        )}
      </div>
    </div>
  );
}
