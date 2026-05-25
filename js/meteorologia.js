/* =========================================================
   js/meteorologia.js — Página de Meteorología
   API: Open-Meteo
   Coordenadas Segovia capital: lat 40.9429, lon -4.1088
   Paradigma OOP — jQuery encapsulado en la clase
   ========================================================= */

'use strict';

class Meteorologia {
  constructor() {
    this.lat    = 40.9429;
    this.lon    = -4.1088;
    this.ciudad = 'Segovia';
    this.apiUrl = 'https://api.open-meteo.com/v1/forecast';
    this.$seccionActual  = $('section[data-componente="tiempo-actual"]');
    this.$seccionPrevision = $('section[data-componente="prevision"]');
  }

  async init() {
    try {
      const params = {
        latitude:  this.lat,
        longitude: this.lon,
        current: [
          'temperature_2m',
          'apparent_temperature',
          'relative_humidity_2m',
          'weather_code',
          'wind_speed_10m',
          'precipitation'
        ].join(','),
        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
          'wind_speed_10m_max'
        ].join(','),
        timezone:      'Europe/Madrid',
        forecast_days: 7
      };

      const datos = await $.get(this.apiUrl, params);
      this._renderizarActual(datos.current);
      this._renderizarPrevision(datos.daily);
    } catch (error) {
      this._mostrarError();
    }
  }

  _codigoADescripcion(codigo) {
    const mapa = {
      0:  { desc: 'Despejado',              icono: '☀️' },
      1:  { desc: 'Mayormente despejado',   icono: '🌤️' },
      2:  { desc: 'Parcialmente nublado',   icono: '⛅' },
      3:  { desc: 'Nublado',                icono: '☁️' },
      45: { desc: 'Niebla',                 icono: '🌫️' },
      48: { desc: 'Niebla con escarcha',    icono: '🌫️' },
      51: { desc: 'Llovizna ligera',        icono: '🌦️' },
      53: { desc: 'Llovizna moderada',      icono: '🌦️' },
      55: { desc: 'Llovizna intensa',       icono: '🌧️' },
      61: { desc: 'Lluvia ligera',          icono: '🌧️' },
      63: { desc: 'Lluvia moderada',        icono: '🌧️' },
      65: { desc: 'Lluvia intensa',         icono: '🌧️' },
      71: { desc: 'Nevada ligera',          icono: '❄️' },
      73: { desc: 'Nevada moderada',        icono: '❄️' },
      75: { desc: 'Nevada intensa',         icono: '❄️' },
      80: { desc: 'Chubascos ligeros',      icono: '🌨️' },
      81: { desc: 'Chubascos moderados',    icono: '🌨️' },
      82: { desc: 'Chubascos fuertes',      icono: '⛈️' },
      95: { desc: 'Tormenta',               icono: '⛈️' },
      96: { desc: 'Tormenta con granizo',   icono: '⛈️' },
      99: { desc: 'Tormenta intensa',       icono: '⛈️' }
    };
    return mapa[codigo] || { desc: 'Dato no disponible', icono: '❓' };
  }

  _renderizarActual(current) {
    const { desc, icono } = this._codigoADescripcion(current.weather_code);
    this.$seccionActual.empty().attr('aria-label', `Tiempo actual en ${this.ciudad}`);

    const $h2 = $('<h2>').text(`Tiempo actual en ${this.ciudad}`);
    const $temp = $('<p>').append(
      $('<strong>').text(`${Math.round(current.temperature_2m)} °C`)
    );
    const $icono    = $('<p>').html(`<span role="img" aria-label="${desc}" >${icono}</span>`);
    const $estado   = $('<p>').text(desc);
    const $sensacion = $('<p>').html(`Sensación térmica: <strong>${Math.round(current.apparent_temperature)} °C</strong>`);
    const $humedad  = $('<p>').html(`Humedad: <strong>${current.relative_humidity_2m} %</strong>`);
    const $viento   = $('<p>').html(`Viento: <strong>${Math.round(current.wind_speed_10m)} km/h</strong>`);
    const $precip   = $('<p>').html(`Precipitación: <strong>${current.precipitation} mm</strong>`);

    this.$seccionActual.append($h2, $icono, $temp, $estado, $sensacion, $humedad, $viento, $precip);
  }

  _renderizarPrevision(daily) {
    this.$seccionPrevision.empty();
    this.$seccionPrevision.before($('<h2>').text('Previsión para 7 días'));

    const diasNombre = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    daily.time.forEach((fechaStr, i) => {
      const { desc, icono } = this._codigoADescripcion(daily.weather_code[i]);
      const fecha = new Date(fechaStr + 'T12:00:00');
      const diaNombre = diasNombre[fecha.getDay()];
      const diaNum    = fecha.getDate();
      const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short' });

      const $articulo = $('<article>').attr('aria-label', `Previsión para ${diaNombre} ${diaNum}`);
      $articulo.append($('<p>').html(`<strong>${diaNombre} ${diaNum} ${mesNombre}</strong>`));
      $articulo.append($('<p>').html(`<span role="img" aria-label="${desc}" >${icono}</span>`));
      $articulo.append($('<p>').text(desc));
      $articulo.append($('<p>').html(
        `<strong>${Math.round(daily.temperature_2m_max[i])}°</strong>` +
        ` / ${Math.round(daily.temperature_2m_min[i])}°`
      ));
      $articulo.append($('<p>').html(`💧 ${daily.precipitation_sum[i]} mm`));

      this.$seccionPrevision.append($articulo);
    });
  }

  _mostrarError() {
    this.$seccionActual.empty().append(
      $('<p>').attr('role', 'alert').attr('data-tipo', 'error')
        .text('No se han podido cargar los datos meteorológicos. Inténtalo más tarde.')
    );
  }
}

$(document).ready(function () {
  const meteo = new Meteorologia();
  meteo.init();
});