/* =========================================================
   js/index.js — Página principal (index.html)
   Paradigma: Orientación a Objetos (ECMAScript 6+)
   jQuery encapsulado dentro de clases
   ========================================================= */

'use strict';

/* ---- CLASE: Carrusel ---- */
class Carrusel {
  /**
   * @param {string} selector - Selector CSS del contenedor section
   * @param {Array}  imagenes - Array de objetos {src, alt, caption}
   * @param {number} intervaloMs - Milisegundos entre diapositivas
   */
  constructor(selector, imagenes, intervaloMs = 4000) {
    this.$contenedor   = $(selector);
    this.imagenes      = imagenes;
    this.intervaloMs   = intervaloMs;
    this.indice        = 0;
    this.$timer        = null;
  }

  init() {
    this._renderizar();
    this._bindEventos();
    this._iniciarAutoplay();
  }

  _renderizar() {
    const $figura = $('<figure>').attr('role', 'group').attr('aria-roledescription', 'diapositiva');

    this.imagenes.forEach((img, i) => {
      $figura.append(
        $('<img>')
          .attr('src', img.src)
          .attr('alt', img.alt)
          .attr('width', 1200)
          .attr('height', 420)
          .css('display', i === 0 ? 'block' : 'none')
      );
    });

    const $leyenda = $('<figcaption>').text(this.imagenes[0].caption);
    $figura.append($leyenda);

    // Botones anterior/siguiente
    const $btnPrev = $('<button>')
      .attr('type', 'button')
      .attr('data-dir', 'prev')
      .attr('aria-label', 'Imagen anterior')
      .text('‹');

    const $btnNext = $('<button>')
      .attr('type', 'button')
      .attr('data-dir', 'next')
      .attr('aria-label', 'Imagen siguiente')
      .text('›');

    // Indicadores (dots)
    const $indicadores = $('<ol>').attr('aria-label', 'Índice de imágenes');
    this.imagenes.forEach((img, i) => {
      const $li = $('<li>')
        .attr('aria-label', `Ir a imagen ${i + 1}: ${img.caption}`)
        .attr('aria-selected', i === 0 ? 'true' : 'false')
        .attr('tabindex', '0')
        .attr('role', 'tab')
        .attr('data-indice', i);
      $indicadores.append($li);
    });

    this.$contenedor
      .empty()
      .append($btnPrev)
      .append($figura)
      .append($btnNext)
      .append($indicadores);

    this.$figura    = $figura;
    this.$leyenda   = $leyenda;
    this.$indicators = $indicadores.find('li');
  }

  _bindEventos() {
    this.$contenedor.find('button[data-dir="prev"]').on('click', () => {
      this._parar();
      this._irA((this.indice - 1 + this.imagenes.length) % this.imagenes.length);
      this._iniciarAutoplay();
    });

    this.$contenedor.find('button[data-dir="next"]').on('click', () => {
      this._parar();
      this._irA((this.indice + 1) % this.imagenes.length);
      this._iniciarAutoplay();
    });

    this.$indicators.on('click keydown', (e) => {
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      const idx = parseInt($(e.currentTarget).attr('data-indice'), 10);
      this._parar();
      this._irA(idx);
      this._iniciarAutoplay();
    });
  }

  _irA(nuevoIndice) {
    this.$figura.find('img').eq(this.indice).hide();
    this.$indicators.eq(this.indice).attr('aria-selected', 'false');

    this.indice = nuevoIndice;

    this.$figura.find('img').eq(this.indice).fadeIn(300);
    this.$leyenda.text(this.imagenes[this.indice].caption);
    this.$indicators.eq(this.indice).attr('aria-selected', 'true');
  }

  _iniciarAutoplay() {
    this.$timer = setInterval(() => {
      this._irA((this.indice + 1) % this.imagenes.length);
    }, this.intervaloMs);
  }

  _parar() {
    clearInterval(this.$timer);
  }
}

/* ---- CLASE: Noticias ---- */
class Noticias {
  /**
   * @param {string} selector - Selector del section de noticias
   * @param {string} apiKey   - Clave de NewsAPI (https://newsapi.org)
   */
  constructor(selector, apiKey) {
    this.$contenedor = $(selector);
    this.apiKey      = apiKey;
    // API de noticias gratuita — el alumno debe registrarse en https://newsapi.org
    // para obtener su propia API key y sustituir el valor en index.html
    this.apiUrl      = 'https://newsapi.org/v2/everything';
  }

  async cargar() {
    try {
      const params = $.param({
        q:        'Segovia turismo',
        language: 'es',
        sortBy:   'publishedAt',
        pageSize: 4,
        apiKey:   this.apiKey
      });

      const datos = await $.get(`${this.apiUrl}?${params}`);
      this._renderizar(datos.articles);
    } catch (error) {
      this._mostrarError();
    }
  }

  _renderizar(articulos) {
    this.$contenedor.find('p[data-estado="cargando"]').remove();

    if (!articulos || articulos.length === 0) {
      this.$contenedor.append(
        $('<p>').attr('role', 'alert').attr('data-tipo', 'info')
          .text('No se han encontrado noticias recientes sobre Segovia.')
      );
      return;
    }

    articulos.forEach(art => {
      const $articulo = $('<article>');

      if (art.urlToImage) {
        $articulo.append(
          $('<img>')
            .attr('src', art.urlToImage)
            .attr('alt', `Imagen para la noticia: ${art.title}`)
            .attr('loading', 'lazy')
            .attr('width', 120)
            .attr('height', 80)
        );
      }

      const $info = $('<div>');
      $info.append(
        $('<a>')
          .attr('href', art.url)
          .attr('target', '_blank')
          .attr('rel', 'noopener noreferrer')
          .text(art.title)
      );

      if (art.description) {
        $info.append($('<p>').text(art.description));
      }

      const fecha = new Date(art.publishedAt).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      $info.append($('<p>').text(fecha));

      $articulo.append($info);
      this.$contenedor.append($articulo);
    });
  }

  _mostrarError() {
    this.$contenedor.find('p[data-estado="cargando"]').remove();
    this.$contenedor.append(
      $('<p>').attr('role', 'alert').attr('data-tipo', 'error')
        .text('No se han podido cargar las noticias en este momento. Inténtalo más tarde.')
    );
  }
}

/* ---- INICIALIZACIÓN ---- */
$(document).ready(function () {

  // Datos del carrusel — coloca las imágenes en multimedia/
  const imagenesCarrusel = [
    {
      src:     'multimedia/carrusel-acueducto.jpg',
      alt:     'Acueducto Romano de Segovia al atardecer, con sus arcos de granito reflejando la luz dorada del sol poniente',
      caption: 'El Acueducto Romano, símbolo de Segovia'
    },
    {
      src:     'multimedia/carrusel-alcazar.jpg',
      alt:     'Alcázar de Segovia elevándose sobre el espolón rocoso en la confluencia de los ríos Eresma y Clamores',
      caption: 'El Alcázar, castillo de cuento de hadas'
    },
    {
      src:     'multimedia/carrusel-catedral.jpg',
      alt:     'Catedral de Segovia con su magnífica torre gótica dominando el skyline de la ciudad histórica',
      caption: 'La Catedral, "Dama de las Catedrales"'
    },
    {
      src:     'multimedia/carrusel-lagranja.jpg',
      alt:     'Jardines del Palacio Real de La Granja de San Ildefonso con sus fuentes barrocas en pleno funcionamiento',
      caption: 'Palacio Real de La Granja de San Ildefonso'
    },
    {
      src:     'multimedia/carrusel-mapa.jpg',
      alt:     'Mapa de situación de la provincia de Segovia dentro de la comunidad de Castilla y León, en el centro de la Península Ibérica',
      caption: 'Mapa de situación de la provincia de Segovia'
    }
  ];

  const carrusel = new Carrusel('section[data-componente="carrusel"]', imagenesCarrusel, 4000);
  carrusel.init();

  const noticias = new Noticias('section[data-componente="noticias"]', '0dd2863db5cd40a496fff4fbf1d9361c');
  noticias.cargar();
});