/* =========================================================
   js/rutas.js — Página de Rutas (rutas.html)
   Carga rutas.xml, muestra info, mapa Leaflet/OSM y SVG
   Paradigma OOP — jQuery + ECMAScript puro
   ========================================================= */

'use strict';

class VisorRutas {
  constructor(selectorContenedor) {
    this.$contenedor = $(selectorContenedor);
    this.mapas       = {};
  }

  init() {
    $.ajax({
      url:      'xml/rutas.xml',
      type:     'GET',
      dataType: 'xml',
      success:  (xmlDoc) => {
        const rutas = this._parsearXML(xmlDoc);
        this._renderizarRutas(rutas);
      },
      error: () => {
        this.$contenedor.empty().append(
          $('<p>').attr('role', 'alert').attr('data-tipo', 'error')
            .text('Error al cargar las rutas. Comprueba que el servidor esté activo y que rutas.xml existe.')
        );
      }
    });
  }

  _parsearXML(xmlDoc) {
    const rutas = [];
    $(xmlDoc).find('ruta').each((_, rutaEl) => {
      const $ruta = $(rutaEl);

      // Hitos
      const hitos = [];
      $ruta.find('hito').each((_, hitoEl) => {
        const $hito = $(hitoEl);
        const fotos = [];
        $hito.find('fotos foto').each((_, fotoEl) => fotos.push($(fotoEl).text()));
        hitos.push({
          nombre:      $hito.find('nombre').first().text(),
          descripcion: $hito.find('descripcion').first().text(),
          lat:         parseFloat($hito.find('latitud').text()),
          lon:         parseFloat($hito.find('longitud').text()),
          alt:         parseFloat($hito.find('altitud').text()),
          distancia:   $hito.find('distancia').text(),
          unidades:    $hito.find('distancia').attr('unidades') || 'km',
          fotos:       fotos
        });
      });

      // Referencias
      const refs = [];
      $ruta.find('referencias referencia').each((_, refEl) => refs.push($(refEl).text()));

      rutas.push({
        id:           $ruta.attr('id'),
        nombre:       $ruta.find('> nombre').text(),
        tipo:         $ruta.find('tipo').text(),
        transporte:   $ruta.find('transporte').text(),
        duracion:     $ruta.find('duracion').text(),
        agencia:      $ruta.find('agencia').text(),
        descripcion:  $ruta.find('> descripcion').text(),
        personas:     $ruta.find('personas').text(),
        lugarInicio:  $ruta.find('lugarInicio').text(),
        recomendacion: $ruta.find('recomendacion').text(),
        inicioLat:    parseFloat($ruta.find('> coordenadas latitud').text()),
        inicioLon:    parseFloat($ruta.find('> coordenadas longitud').text()),
        planimetria:  $ruta.find('planimetria').text(),
        altimetria:   $ruta.find('altimetria').text(),
        hitos:        hitos,
        referencias:  refs
      });
    });
    return rutas;
  }

  _renderizarRutas(rutas) {
    this.$contenedor.empty();

    rutas.forEach((ruta, idx) => {
      const seccion = this._crearSeccionRuta(ruta, idx);
      this.$contenedor.append(seccion);
    });

    // Inicializar mapas Leaflet después de que el DOM esté listo
    rutas.forEach((ruta, idx) => {
      this._inicializarMapa(ruta, idx);
    });
  }

  _crearSeccionRuta(ruta, idx) {
    const $sec = $('<section>').attr('data-componente', 'ruta').attr('id', `ruta-${idx}`);
    $sec.attr('aria-label', `Ruta: ${ruta.nombre}`);

    // Cabecera
    $sec.append($('<h3>').text(ruta.nombre));

    // Info general
    const $info = $('<article>');
    $info.append($('<p>').html(`<strong>Tipo:</strong> ${ruta.tipo}`));
    $info.append($('<p>').html(`<strong>Transporte:</strong> ${ruta.transporte}`));
    $info.append($('<p>').html(`<strong>Duración:</strong> ${ruta.duracion}`));
    $info.append($('<p>').html(`<strong>Agencia:</strong> ${ruta.agencia}`));
    $info.append($('<p>').html(`<strong>Inicio:</strong> ${ruta.lugarInicio}`));
    $info.append($('<p>').html(`<strong>Recomendación:</strong> ${ruta.recomendacion} / 10`));
    $info.append($('<p>').html(`<strong>Descripción:</strong> ${ruta.descripcion}`));
    $info.append($('<p>').html(`<strong>Apto para:</strong> ${ruta.personas}`));
    $sec.append($info);

    // Hitos
    $sec.append($('<h4>').text('Hitos de la ruta'));
    const $listaHitos = $('<ol>');
    ruta.hitos.forEach(hito => {
      const $li = $('<li>');
      $li.append($('<strong>').text(hito.nombre));
      $li.append($('<p>').text(hito.descripcion));
      if (hito.distancia) {
        $li.append($('<p>').html(`Distancia desde anterior: <strong>${hito.distancia} ${hito.unidades}</strong>`));
      }
      if (hito.fotos.length > 0) {
        const $galeria = $('<p>');
        hito.fotos.forEach(foto => {
          $galeria.append(
            $('<img>')
              .attr('src', `multimedia/${foto}`)
              .attr('alt', `Fotografía del hito: ${hito.nombre}`)
              .attr('loading', 'lazy')
              .attr('width', 200)
              .attr('height', 133)
              .css({ 'margin-right': '0.4rem', 'margin-bottom': '0.4rem',
                     'max-width': '200px', height: 'auto', display: 'inline-block' })
          );
        });
        $li.append($galeria);
      }
      $listaHitos.append($li);
    });
    $sec.append($listaHitos);

    // Mapa (planimetría KML)
    $sec.append($('<h4>').text('Planimetría — Mapa interactivo'));
    const mapaId = `mapa-${ruta.id}`;
    $sec.append(
      $('<div>').attr('id', mapaId).attr('aria-label', `Mapa interactivo de la ruta ${ruta.nombre}`)
    );

    // Altimetría SVG
    $sec.append($('<h4>').text('Altimetría'));
    $sec.append(
      $('<img>')
        .attr('src', `xml/${ruta.altimetria}`)
        .attr('alt', `Gráfico de altimetría de la ruta ${ruta.nombre}: perfil de elevación con distancia en metros en el eje horizontal y altitud en metros en el eje vertical`)
        .attr('width', 800)
        .attr('height', 400)
    );

    // Referencias
    if (ruta.referencias.length > 0) {
      $sec.append($('<h4>').text('Referencias'));
      const $refList = $('<ul>');
      ruta.referencias.forEach(ref => {
        $refList.append(
          $('<li>').append(
            $('<a>').attr('href', ref).attr('target', '_blank').attr('rel', 'noopener noreferrer').text(ref)
          )
        );
      });
      $sec.append($refList);
    }

    return $sec;
  }

  _inicializarMapa(ruta, idx) {
    if (!window.L) return;

    const mapaId = `mapa-${ruta.id}`;
    const el = document.getElementById(mapaId);
    if (!el) return;

    const mapa = L.map(mapaId, { scrollWheelZoom: false }).setView(
      [ruta.inicioLat, ruta.inicioLon], 14
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(mapa);

    // Marcador de inicio
    const iconoInicio = L.divIcon({
      html: '<span >🚩</span>',
      className: '',
      iconAnchor: [12, 12]
    });
    L.marker([ruta.inicioLat, ruta.inicioLon], { icon: iconoInicio })
      .addTo(mapa)
      .bindPopup(`<strong>Inicio:</strong> ${ruta.lugarInicio}`);

    // Polilínea con los hitos
    if (ruta.hitos.length > 0) {
      const puntos = ruta.hitos
        .filter(h => !isNaN(h.lat) && !isNaN(h.lon))
        .map(h => [h.lat, h.lon]);

      if (puntos.length > 1) {
        L.polyline(puntos, { color: '#8B1A1A', weight: 3, opacity: 0.9 }).addTo(mapa);
      }

      // Marcadores de hitos
      ruta.hitos.forEach(hito => {
        if (!isNaN(hito.lat) && !isNaN(hito.lon)) {
          const iconoHito = L.divIcon({
            html: '<span >📍</span>',
            className: '',
            iconAnchor: [8, 8]
          });
          L.marker([hito.lat, hito.lon], { icon: iconoHito })
            .addTo(mapa)
            .bindPopup(`<strong>${hito.nombre}</strong><br>${hito.descripcion.substring(0, 100)}…`);
        }
      });

      // Ajustar vista a todos los puntos
      if (puntos.length > 0) {
        try { mapa.fitBounds(puntos, { padding: [30, 30] }); } catch (_e) { /* noop */ }
      }
    }

    this.mapas[ruta.id] = mapa;
  }
}

$(document).ready(() => {
  const visor = new VisorRutas('#contenedor-rutas');
  visor.init();
});