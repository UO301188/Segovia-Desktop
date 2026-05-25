/* =========================================================
   js/juego.js — Juego de preguntas sobre Segovia
   ECMAScript puro (sin jQuery), paradigma OOP
   ========================================================= */

'use strict';

class Juego {
  constructor(selectorContenedor) {
    this.contenedor      = document.querySelector(selectorContenedor);
    this.preguntaActual  = 0;
    this.puntuacion      = 0;
    this.respondidas     = new Array(this.preguntas.length).fill(null);
    this.finalizado      = false;
  }

  get preguntas() {
    return [
      {
        enunciado: '¿Cuál es el monumento más representativo de Segovia, declarado Patrimonio de la Humanidad?',
        opciones: [
          'La Catedral de Segovia',
          'El Alcázar de Segovia',
          'El Acueducto Romano de Segovia',
          'El Palacio de La Granja',
          'La Iglesia de la Vera Cruz'
        ],
        correcta: 2
      },
      {
        enunciado: '¿En qué siglo fue construido el Acueducto Romano de Segovia?',
        opciones: [
          'Siglo V d.C.',
          'Siglo III d.C.',
          'Siglo I d.C.',
          'Siglo II a.C.',
          'Siglo VIII a.C.'
        ],
        correcta: 2
      },
      {
        enunciado: '¿Cuál es el plato gastronómico más famoso de Segovia?',
        opciones: [
          'Los callos a la madrileña',
          'El cocido maragato',
          'El lechazo asado',
          'El cochinillo asado (tostón)',
          'Los judiones de La Granja'
        ],
        correcta: 3
      },
      {
        enunciado: '¿En qué localidad segoviana se encuentra el Palacio Real con los famosos jardines barrocos?',
        opciones: [
          'Pedraza',
          'Riaza',
          'Sepúlveda',
          'La Granja de San Ildefonso',
          'Coca'
        ],
        correcta: 3
      },
      {
        enunciado: '¿Qué legumbre típica de Segovia es especialmente famosa por su gran tamaño?',
        opciones: [
          'Los garbanzos de Pedrosillo',
          'Las lentejas pardinas',
          'Los judiones de La Granja',
          'Las alubias pintas',
          'Las habas segovianas'
        ],
        correcta: 2
      },
      {
        enunciado: '¿Cuál es el dulce más emblemático de la ciudad de Segovia?',
        opciones: [
          'El brazo de gitano',
          'El ponche segoviano',
          'Las yemas de Santa Teresa',
          'Los pestiños',
          'La leche frita'
        ],
        correcta: 1
      },
      {
        enunciado: '¿En qué comunidad autónoma se encuentra la provincia de Segovia?',
        opciones: [
          'Comunidad de Madrid',
          'Extremadura',
          'La Rioja',
          'Castilla-La Mancha',
          'Castilla y León'
        ],
        correcta: 4
      },
      {
        enunciado: '¿Cómo se denomina el valle que rodea Segovia, en el que discurre el río Eresma?',
        opciones: [
          'Valle del Duero',
          'Valle del Pisuerga',
          'Valle del Eresma',
          'Valle del Tajo',
          'Valle del Adaja'
        ],
        correcta: 2
      },
      {
        enunciado: '¿Qué tipo de ruta turística conecta el Acueducto con el Alcázar atravesando el casco histórico?',
        opciones: [
          'Ruta de los castillos',
          'Ruta del vino',
          'Ruta de las iglesias románicas',
          'Ruta del Acueducto y el Casco Histórico a pie',
          'Ruta de la naturaleza'
        ],
        correcta: 3
      },
      {
        enunciado: '¿Qué iglesia templaria de planta circular se puede visitar en el Valle del Eresma, en las afueras de Segovia?',
        opciones: [
          'Iglesia de San Millán',
          'Iglesia de San Justo',
          'Iglesia de la Vera Cruz',
          'Iglesia de San Lorenzo',
          'Iglesia de San Martín'
        ],
        correcta: 2
      }
    ];
  }

  init() {
    this.contenedor.querySelector('p[data-estado="cargando"]')?.remove();
    this._renderizarPregunta();
  }

  _renderizarPregunta() {
    const pregunta = this.preguntas[this.preguntaActual];
    const total    = this.preguntas.length;

    this.contenedor.innerHTML = '';

    const articulo = document.createElement('article');

    // Contador de progreso
    const progreso = document.createElement('p');
    progreso.textContent = `Pregunta ${this.preguntaActual + 1} de ${total}`;
    // OJO
    //progreso.style.cssText = 'font-size:0.85rem; color:#6B1414; font-family:Arial,sans-serif; margin-bottom:0.5rem;';
    articulo.appendChild(progreso);

    // Enunciado
    const enunciado = document.createElement('p');
    enunciado.textContent = pregunta.enunciado;
    articulo.appendChild(enunciado);

    // Opciones
    const lista = document.createElement('ol');
    lista.setAttribute('role', 'radiogroup');
    lista.setAttribute('aria-label', `Opciones para: ${pregunta.enunciado}`);

    pregunta.opciones.forEach((texto, i) => {
      const li = document.createElement('li');

      const inputId = `opcion-${i}`;
      const input   = document.createElement('input');
      input.type    = 'radio';
      input.name    = 'respuesta';
      input.value   = i;
      input.id      = inputId;

      if (this.respondidas[this.preguntaActual] !== null) {
        input.disabled = true;
        if (this.respondidas[this.preguntaActual] === i) {
          input.checked = true;
        }
      }

      const label = document.createElement('label');
      label.setAttribute('for', inputId);
      label.textContent = texto;

      if (this.respondidas[this.preguntaActual] !== null) {
        if (i === pregunta.correcta) {
          label.setAttribute('data-estado', 'correcto');
        } else if (this.respondidas[this.preguntaActual] === i) {
          label.setAttribute('data-estado', 'incorrecto');
        }
      }

      input.addEventListener('change', () => this._seleccionar(i));
      li.appendChild(input);
      li.appendChild(label);
      lista.appendChild(li);
    });

    articulo.appendChild(lista);

    // Botones de navegación
    const divBotones = document.createElement('div');
    //divBotones.style.cssText = 'margin-top:1rem; display:flex; gap:0.5rem; flex-wrap:wrap;';

    if (this.preguntaActual > 0) {
      const btnAnterior = document.createElement('button');
      btnAnterior.type = 'button';
      btnAnterior.textContent = '← Anterior';
      btnAnterior.addEventListener('click', () => {
        this.preguntaActual--;
        this._renderizarPregunta();
      });
      divBotones.appendChild(btnAnterior);
    }

    if (this.preguntaActual < total - 1) {
      if (this.respondidas[this.preguntaActual] !== null) {
        const btnSiguiente = document.createElement('button');
        btnSiguiente.type = 'button';
        btnSiguiente.textContent = 'Siguiente →';
        btnSiguiente.addEventListener('click', () => {
          this.preguntaActual++;
          this._renderizarPregunta();
        });
        divBotones.appendChild(btnSiguiente);
      }
    } else {
      // Última pregunta: botón de resultado
      const todasRespondidas = this.respondidas.every(r => r !== null);
      if (todasRespondidas) {
        const btnResultado = document.createElement('button');
        btnResultado.type = 'button';
        btnResultado.textContent = 'Ver resultado';
        btnResultado.addEventListener('click', () => this._mostrarResultado());
        divBotones.appendChild(btnResultado);
      }
    }

    articulo.appendChild(divBotones);
    this.contenedor.appendChild(articulo);
  }

  _seleccionar(indiceOpcion) {
    if (this.respondidas[this.preguntaActual] !== null) return;
    this.respondidas[this.preguntaActual] = indiceOpcion;

    const pregunta = this.preguntas[this.preguntaActual];
    if (indiceOpcion === pregunta.correcta) {
      this.puntuacion++;
    }

    this._renderizarPregunta();
  }

  _mostrarResultado() {
    this.contenedor.innerHTML = '';

    const articulo = document.createElement('article');
    articulo.setAttribute('data-tipo', 'resultado');
    articulo.setAttribute('aria-live', 'polite');

    const titulo = document.createElement('h3');
    titulo.textContent = '¡Juego completado!';
    articulo.appendChild(titulo);

    const puntuacion = document.createElement('strong');
    puntuacion.textContent = `${this.puntuacion} / 10`;
    articulo.appendChild(puntuacion);

    const mensaje = document.createElement('p');
    if (this.puntuacion >= 8) {
      mensaje.textContent = '¡Excelente! Eres un experto en el turismo segoviano.';
    } else if (this.puntuacion >= 5) {
      mensaje.textContent = 'Buen resultado. Explora más el sitio para aprender sobre Segovia.';
    } else {
      mensaje.textContent = 'Sigue explorando el sitio para conocer mejor Segovia.';
    }
    articulo.appendChild(mensaje);

    const btnReinicio = document.createElement('button');
    btnReinicio.type = 'button';
    btnReinicio.textContent = 'Jugar de nuevo';
    btnReinicio.addEventListener('click', () => {
      this.preguntaActual = 0;
      this.puntuacion     = 0;
      this.respondidas    = new Array(this.preguntas.length).fill(null);
      this._renderizarPregunta();
    });
    articulo.appendChild(btnReinicio);

    this.contenedor.appendChild(articulo);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const juego = new Juego('section[data-componente="juego"]');
  juego.init();
});