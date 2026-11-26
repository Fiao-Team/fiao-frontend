import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { ProductoItem } from '../../../modelo/producto';
import { Productos } from './productos';

const PRODUCTOS_MOCK: ProductoItem[] = [
  {
    producto_id: 1,
    nombre: 'Atún Florida 170g',
    marca: 'Florida',
    categoria: 'Conservas',
    proveedor: 'Distribuidora Lima',
    unidad_medida: 'Lata',
    moneda: 'PEN',
    precio_contado: '5.50',
    precio_lista: '6.00',
    forma_venta_credito: 'FIN_DE_MES',
    imagen_url: null,
    estado: 1,
  },
  {
    producto_id: 2,
    nombre: 'Licuadora Oster',
    marca: 'Oster',
    categoria: 'Electrodomésticos',
    proveedor: null,
    unidad_medida: 'Unidad',
    moneda: 'USD',
    precio_contado: '45.00',
    precio_lista: '50.00',
    forma_venta_credito: 'EN_MESES',
    imagen_url: null,
    estado: 0,
  },
];

describe('Productos', () => {
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/productos`;

  beforeEach(async () => {
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute('open', '');
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function () {
        this.removeAttribute('open');
      };
    }

    await TestBed.configureTestingModule({
      imports: [Productos],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('carga la tabla de productos con precios formateados y acciones según estado', () => {
    const fixture = TestBed.createComponent(Productos);
    fixture.detectChanges();

    http.expectOne(baseUrl).flush(PRODUCTOS_MOCK);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('tbody tr').length).toBe(2);
    expect(el.textContent).toContain('Atún Florida 170g');
    expect(el.textContent).toContain('S/ 6.00');
    expect(el.textContent).toContain('US$ 50.00');
    expect(el.querySelector('button[aria-label="Dar de baja Atún Florida 170g"]')).toBeTruthy();
    expect(el.querySelector('button[aria-label="Reactivar Licuadora Oster"]')).toBeTruthy();
  });

  it('envía solo_activos=false al activar Mostrar productos inactivos y filtra por moneda', () => {
    const fixture = TestBed.createComponent(Productos);
    fixture.detectChanges();
    http.expectOne(baseUrl).flush([PRODUCTOS_MOCK[0]]);
    fixture.detectChanges();

    const check: HTMLInputElement = fixture.nativeElement.querySelector('#fp-inactivos');
    check.checked = true;
    check.dispatchEvent(new Event('change'));

    const reqInact = http.expectOne((r) => r.url === baseUrl && r.params.get('solo_activos') === 'false');
    reqInact.flush(PRODUCTOS_MOCK);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);

    const selectMoneda: HTMLSelectElement = fixture.nativeElement.querySelector('#fp-moneda');
    selectMoneda.value = 'USD';
    selectMoneda.dispatchEvent(new Event('change'));

    const reqUsd = http.expectOne(
      (r) => r.url === baseUrl && r.params.get('moneda') === 'USD' && r.params.get('solo_activos') === 'false',
    );
    reqUsd.flush([PRODUCTOS_MOCK[1]]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Licuadora Oster');
  });
});
