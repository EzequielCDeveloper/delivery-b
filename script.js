/**
 * prototipo-delivery-b/script.js — Variante B (A/B)
 * Misma lógica que delivery base; UI diferenciada por styles-ab-b.css + HTML.
 */

(function () {
  'use strict';

  var RESTAURANTES = [
    { id: 'r1', nombre: 'Pizzería Napoli', categoria: 'pizza', img: './assets/rest-r1.svg' },
    { id: 'r2', nombre: 'Sushi Roll', categoria: 'asiatica', img: './assets/rest-r2.svg' },
    { id: 'r3', nombre: 'Burger Norte', categoria: 'hamburguesas', img: './assets/rest-r3.svg' },
    { id: 'r4', nombre: 'Mamma Mia Express', categoria: 'pizza', img: './assets/rest-r4.svg' }
  ];

  /** Platos por restaurante (cada uno con imagen en ./assets/) */
  var MENU = {
    r1: [
      { id: 'm1', nombre: 'Margarita', precio: 8.5, img: './assets/dish-m1.svg' },
      { id: 'm2', nombre: 'Cuatro quesos', precio: 10.9, img: './assets/dish-m2.svg' }
    ],
    r2: [
      { id: 'm3', nombre: 'Menú maki (12 pzs)', precio: 14.0, img: './assets/dish-m3.svg' },
      { id: 'm4', nombre: 'Yakisoba', precio: 9.5, img: './assets/dish-m4.svg' }
    ],
    r3: [
      { id: 'm5', nombre: 'Clásica + patatas', precio: 11.0, img: './assets/dish-m5.svg' },
      { id: 'm6', nombre: 'Veggie', precio: 10.5, img: './assets/dish-m6.svg' }
    ],
    r4: [
      { id: 'm7', nombre: 'Calzone', precio: 9.0, img: './assets/dish-m7.svg' },
      { id: 'm8', nombre: 'Prosciutto', precio: 11.5, img: './assets/dish-m8.svg' }
    ]
  };

  var restauranteActual = null;
  /** pedido: { idPlato, nombre, precioUnit, cantidad } */
  var pedido = [];

  var elFiltro = document.getElementById('filtro-cat');
  var elListaRest = document.getElementById('lista-restaurantes');
  var elRestVacio = document.getElementById('rest-vacio');
  var elStepRest = document.getElementById('step-restaurante');
  var elStepProd = document.getElementById('step-productos');
  var elStepRes = document.getElementById('step-resumen');
  var elStepConf = document.getElementById('step-confirmacion');
  var elTituloRest = document.getElementById('titulo-restaurante');
  var elListaPlatos = document.getElementById('lista-platos');
  var elListaResumen = document.getElementById('lista-resumen');
  var elResumenVacio = document.getElementById('resumen-vacio');
  var elTotal = document.getElementById('total-delivery');
  var elMsgConfirm = document.getElementById('msg-confirm');
  var elConfirmSubtotal = document.getElementById('confirm-subtotal');
  var elConfirmFee = document.getElementById('confirm-fee');
  var elConfirmTax = document.getElementById('confirm-tax');
  var elConfirmTotal = document.getElementById('confirm-total');
  var elCarritoCount = document.getElementById('carrito-count');
  var elModalCambioRest = document.getElementById('modal-cambio-rest');
  var elModalCancel = document.getElementById('modal-cancel');
  var elModalConfirm = document.getElementById('modal-confirm');
  var elBtnCancelar = document.getElementById('btn-cancelar');
  var pendingRestId = null;
  var STAGGER_ITEM_SELECTOR = ':scope > li';

  function mostrarSoloPanel(panel) {
    var panels = [elStepRest, elStepProd, elStepRes, elStepConf];
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      var on = p === panel;
      p.classList.toggle('active', on);
      p.hidden = !on;
    }
    actualizarIndicadoresPasos(panel);
  }

  function actualizarIndicadoresPasos(panel) {
    var n = '0';
    if (panel === elStepRest) n = '1';
    if (panel === elStepProd) n = '2';
    if (panel === elStepRes) n = '3';
    if (panel === elStepConf) n = '3';

    var indicadores = document.querySelectorAll('[data-step-indicator]');
    for (var i = 0; i < indicadores.length; i++) {
      var el = indicadores[i];
      var step = el.getAttribute('data-step-indicator');
      el.classList.toggle('active', step === n || (panel === elStepConf && step === '3'));
    }
  }

  function filtrarRestaurantes() {
    var cat = elFiltro.value;
    elListaRest.innerHTML = '';
    var count = 0;
    for (var i = 0; i < RESTAURANTES.length; i++) {
      var r = RESTAURANTES[i];
      if (cat !== 'todas' && r.categoria !== cat) continue;
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card-rest';
      btn.setAttribute('data-rest', r.id);
      btn.innerHTML =
        '<span class="card-rest__media"><img src="' +
        r.img +
        '" width="72" height="72" alt="" loading="lazy"></span>' +
        '<span class="card-rest__body"><strong>' +
        escapeHtml(r.nombre) +
        '</strong><span class="tag">' +
        escapeHtml(r.categoria) +
        '</span></span>';
      li.appendChild(btn);
      elListaRest.appendChild(li);
      count += 1;
    }
    if (elRestVacio) elRestVacio.hidden = count !== 0;
    retriggerStagger(elListaRest);
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function abrirMenu(restId) {
    restauranteActual = restId;
    var r = null;
    for (var i = 0; i < RESTAURANTES.length; i++) {
      if (RESTAURANTES[i].id === restId) {
        r = RESTAURANTES[i];
        break;
      }
    }
    elTituloRest.textContent = r ? r.nombre : 'Menú';
    var platos = MENU[restId] || [];
    elListaPlatos.innerHTML = '';
    for (var j = 0; j < platos.length; j++) {
      var pl = platos[j];
      var li = document.createElement('li');
      li.className = 'plato-row';
      li.innerHTML =
        '<img class="plato-thumb" src="' +
        pl.img +
        '" width="52" height="52" alt="">' +
        '<div class="plato-info"><span class="plato-nombre">' +
        escapeHtml(pl.nombre) +
        '</span></div>' +
        '<span class="plato-precio">' +
        formatEuros(pl.precio) +
        '</span>' +
        '<button type="button" class="btn-mini" data-add-plato="' +
        pl.id +
        '" data-nombre="' +
        escapeAttr(pl.nombre) +
        '" data-precio="' +
        pl.precio +
        '" data-img="' +
        escapeAttr(pl.img) +
        '">+</button>';
      elListaPlatos.appendChild(li);
    }
    retriggerStagger(elListaPlatos);
    mostrarSoloPanel(elStepProd);
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  function lineaPedido(idPlato) {
    for (var i = 0; i < pedido.length; i++) {
      if (pedido[i].idPlato === idPlato) return pedido[i];
    }
    return null;
  }

  function agregarPlato(idPlato, nombre, precio, img) {
    var linea = lineaPedido(idPlato);
    if (linea) {
      linea.cantidad += 1;
    } else {
      pedido.push({
        idPlato: idPlato,
        nombre: nombre,
        precioUnit: precio,
        cantidad: 1,
        img: img
      });
    }
    actualizarCarritoCount();
  }

  function eliminarPlato(idPlato) {
    for (var i = 0; i < pedido.length; i++) {
      if (pedido[i].idPlato === idPlato) {
        pedido.splice(i, 1);
        break;
      }
    }
    actualizarCarritoCount();
  }

  function ajustarCantidad(idPlato, delta) {
    var linea = lineaPedido(idPlato);
    if (!linea) return;
    linea.cantidad += delta;
    if (linea.cantidad <= 0) {
      eliminarPlato(idPlato);
      return;
    }
    actualizarCarritoCount();
  }

  function limpiarPedido() {
    pedido = [];
    actualizarCarritoCount();
  }

  function totalPedido() {
    var t = 0;
    for (var i = 0; i < pedido.length; i++) {
      t += pedido[i].precioUnit * pedido[i].cantidad;
    }
    return t;
  }

  function formatEuros(n) {
    return Number(n).toFixed(2).replace('.', ',') + ' €';
  }

  function costoEnvio(subtotal) {
    if (subtotal <= 0) return 0;
    return 2.5;
  }

  function impuesto(subtotal) {
    if (subtotal <= 0) return 0;
    return subtotal * 0.08;
  }

  function pintarResumen() {
    elListaResumen.innerHTML = '';
    if (pedido.length === 0) {
      elResumenVacio.hidden = false;
    } else {
      elResumenVacio.hidden = true;
    }
    for (var i = 0; i < pedido.length; i++) {
      var l = pedido[i];
      var li = document.createElement('li');
      li.className = 'resumen-line';
      li.innerHTML =
        '<img class="resumen-thumb" src="' +
        l.img +
        '" width="40" height="40" alt="">' +
        '<div class="resumen-info">' +
        '<span class="resumen-nombre">' +
        escapeHtml(l.nombre) +
        '</span>' +
        '<div class="resumen-controls">' +
        '<button type="button" class="qty-btn" data-qty="dec" data-line-id="' +
        escapeAttr(l.idPlato) +
        '" aria-label="Restar">-</button>' +
        '<span class="resumen-cantidad">' +
        l.cantidad +
        '</span>' +
        '<button type="button" class="qty-btn" data-qty="inc" data-line-id="' +
        escapeAttr(l.idPlato) +
        '" aria-label="Sumar">+</button>' +
        '<button type="button" class="remove-btn" data-remove-line="' +
        escapeAttr(l.idPlato) +
        '">Quitar</button>' +
        '</div>' +
        '</div>' +
        '<span class="resumen-precio">' +
        formatEuros(l.precioUnit * l.cantidad) +
        '</span>';
      elListaResumen.appendChild(li);
    }
    elTotal.textContent = formatEuros(totalPedido());
    actualizarCarritoCount();
    retriggerStagger(elListaResumen);
  }

  function retriggerStagger(listEl) {
    if (!listEl) return;
    var items = listEl.querySelectorAll(STAGGER_ITEM_SELECTOR);
    for (var i = 0; i < items.length; i++) {
      items[i].style.removeProperty('animation-delay');
      items[i].offsetHeight;
    }
    listEl.classList.remove('stagger-animate');
    listEl.offsetHeight;
    listEl.classList.add('stagger-animate');
  }

  function totalItemsPedido() {
    var c = 0;
    for (var i = 0; i < pedido.length; i++) {
      c += pedido[i].cantidad;
    }
    return c;
  }

  function actualizarCarritoCount() {
    if (!elCarritoCount) return;
    elCarritoCount.textContent = String(totalItemsPedido());
  }

  elListaRest.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-rest]');
    if (!btn) return;
    var restId = btn.getAttribute('data-rest');
    if (restauranteActual && restId !== restauranteActual && pedido.length > 0) {
      pendingRestId = restId;
      if (elModalCambioRest) elModalCambioRest.hidden = false;
      return;
    }
    abrirMenu(restId);
  });

  elFiltro.addEventListener('change', filtrarRestaurantes);

  elListaPlatos.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add-plato]');
    if (!b) return;
    var id = b.getAttribute('data-add-plato');
    var nombre = b.getAttribute('data-nombre');
    var precio = parseFloat(b.getAttribute('data-precio'), 10);
    var imgPlato = b.getAttribute('data-img') || '';
    agregarPlato(id, nombre, precio, imgPlato);
  });

  elListaResumen.addEventListener('click', function (e) {
    var btnQty = e.target.closest('[data-qty]');
    if (btnQty) {
      var idQty = btnQty.getAttribute('data-line-id');
      var dir = btnQty.getAttribute('data-qty');
      ajustarCantidad(idQty, dir === 'inc' ? 1 : -1);
      pintarResumen();
      return;
    }
    var btnRemove = e.target.closest('[data-remove-line]');
    if (!btnRemove) return;
    eliminarPlato(btnRemove.getAttribute('data-remove-line'));
    pintarResumen();
  });

  document.getElementById('btn-volver-rest').addEventListener('click', function () {
    mostrarSoloPanel(elStepRest);
  });

  document.getElementById('btn-carrito').addEventListener('click', function () {
    pintarResumen();
    mostrarSoloPanel(elStepRes);
  });

  document.getElementById('btn-seguir-comprando').addEventListener('click', function () {
    if (restauranteActual) abrirMenu(restauranteActual);
    else mostrarSoloPanel(elStepRest);
  });

  if (elBtnCancelar) {
    elBtnCancelar.addEventListener('click', function () {
      limpiarPedido();
      pintarResumen();
      restauranteActual = null;
      mostrarSoloPanel(elStepRest);
    });
  }

  document.getElementById('btn-comprar').addEventListener('click', function () {
    if (pedido.length === 0) {
      alert('Añada al menos un plato antes de confirmar.');
      return;
    }
    var subtotal = totalPedido();
    var fee = costoEnvio(subtotal);
    var tax = impuesto(subtotal);
    var total = subtotal + fee + tax;
    var nombreRest = '';
    for (var i = 0; i < RESTAURANTES.length; i++) {
      if (RESTAURANTES[i].id === restauranteActual) {
        nombreRest = RESTAURANTES[i].nombre;
        break;
      }
    }
    elMsgConfirm.textContent =
      'Su pedido en ' +
      nombreRest +
      ' por ' +
      formatEuros(total) +
      ' está en preparación. Tiempo aproximado: 35 minutos.';
    if (elConfirmSubtotal) elConfirmSubtotal.textContent = formatEuros(subtotal);
    if (elConfirmFee) elConfirmFee.textContent = formatEuros(fee);
    if (elConfirmTax) elConfirmTax.textContent = formatEuros(tax);
    if (elConfirmTotal) elConfirmTotal.textContent = formatEuros(total);
    limpiarPedido();
    pintarResumen();
    mostrarSoloPanel(elStepConf);
  });

  document.getElementById('btn-nuevo').addEventListener('click', function () {
    restauranteActual = null;
    actualizarCarritoCount();
    mostrarSoloPanel(elStepRest);
  });

  if (elModalCambioRest) {
    elModalCambioRest.addEventListener('click', function (e) {
      if (e.target && e.target.getAttribute('data-close') === 'true') {
        elModalCambioRest.hidden = true;
        pendingRestId = null;
      }
    });
  }

  if (elModalCancel) {
    elModalCancel.addEventListener('click', function () {
      if (elModalCambioRest) elModalCambioRest.hidden = true;
      pendingRestId = null;
    });
  }

  if (elModalConfirm) {
    elModalConfirm.addEventListener('click', function () {
      if (!pendingRestId) return;
      limpiarPedido();
      pintarResumen();
      if (elModalCambioRest) elModalCambioRest.hidden = true;
      abrirMenu(pendingRestId);
      pendingRestId = null;
    });
  }

  filtrarRestaurantes();
  actualizarCarritoCount();
})();
